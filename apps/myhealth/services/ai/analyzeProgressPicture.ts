import { ProgressPictureService } from '../ProgressPictureService';
import { getAIProvider } from './AIProviderFactory';

// Generous enough to cover cold model load (weights not yet in memory) plus
// inference on an older/slower device. Without this a hung or slow inference
// leaves the row null forever, same as the "stuck Analyzing" bug.
const ANALYSIS_TIMEOUT_MS = 60_000;

interface AnalysisTask {
    pictureId: string;
    cancel: (reason: string) => void;
}

export interface AnalysisStatus {
    activeId: string | null;
    queuedIds: string[];
}

// The underlying model is a single shared instance - only one analysis can
// actually run at a time, so calls queue. `activeTask` is whichever one is
// currently in flight, `queuedIds` is everything waiting behind it, in order.
let activeTask: AnalysisTask | null = null;
let queuedIds: string[] = [];
let queueTail: Promise<void> = Promise.resolve();
const listeners = new Set<(status: AnalysisStatus) => void>();

function getStatus(): AnalysisStatus {
    return { activeId: activeTask?.pictureId ?? null, queuedIds: [...queuedIds] };
}

function notifyListeners() {
    const status = getStatus();
    listeners.forEach((listener) => listener(status));
}

export function subscribeAnalysisStatus(listener: (status: AnalysisStatus) => void): () => void {
    listeners.add(listener);
    listener(getStatus());
    return () => {
        listeners.delete(listener);
    };
}

export function getAnalysisStatus(): AnalysisStatus {
    return getStatus();
}

// Stops the in-flight analysis for this picture, if it's the one currently
// running. Returns false if nothing is running for it (already finished, or
// still queued behind another analysis - queued entries haven't started, so
// there's nothing to interrupt yet; use dequeue-on-finish behavior instead).
export function cancelAnalysis(pictureId: string): boolean {
    if (activeTask?.pictureId === pictureId) {
        activeTask.cancel('Analysis cancelled by user');
        return true;
    }
    return false;
}

function runOne(pictureId: string, imageUri: string): Promise<void> {
    const provider = getAIProvider();

    let cancelReject!: (err: Error) => void;
    const cancelPromise = new Promise<never>((_, reject) => {
        cancelReject = reject;
    });

    const interruptAndReject = (message: string) => {
        try {
            provider.interrupt();
        } catch (err) {
            console.warn(`[AI] interrupt() threw while stopping analysis for ${pictureId}:`, err);
        }
        cancelReject(new Error(message));
    };

    const timeoutHandle = setTimeout(
        () => interruptAndReject(`Analysis timed out after ${ANALYSIS_TIMEOUT_MS / 1000}s`),
        ANALYSIS_TIMEOUT_MS
    );

    queuedIds = queuedIds.filter((id) => id !== pictureId);
    activeTask = { pictureId, cancel: interruptAndReject };
    notifyListeners();

    return Promise.race([provider.analyzeMuscleGroups(imageUri), cancelPromise])
        .then((result) => ProgressPictureService.updateMuscleGroups(pictureId, result))
        .catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[AI] Muscle group analysis failed for ${pictureId}:`, err);
            return ProgressPictureService.updateMuscleGroups(pictureId, {
                primaryMuscles: [],
                secondaryMuscles: [],
                confidence: 0,
                source: 'local',
                error: message,
            });
        })
        .catch((persistErr) => {
            console.warn(`[AI] Failed to persist muscle group error state for ${pictureId}:`, persistErr);
        })
        .finally(() => {
            clearTimeout(timeoutHandle);
            activeTask = null;
            notifyListeners();
        });
}

// Runs in the background - callers don't await this, so failures are
// persisted as an error result rather than thrown, otherwise the picture
// would show "Analyzing..." forever. Also used directly as the manual
// "Analyze" / "Re-analyze" action from the UI - same entrypoint either way.
// Calls queue: only one analysis runs on the shared model at a time.
export function analyzeMuscleGroupsInBackground(pictureId: string, imageUri: string) {
    if (activeTask?.pictureId !== pictureId && !queuedIds.includes(pictureId)) {
        queuedIds = [...queuedIds, pictureId];
        notifyListeners();
    }
    queueTail = queueTail.then(() => runOne(pictureId, imageUri));
}
