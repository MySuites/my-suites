import { ProgressPictureService } from '../ProgressPictureService';
import { getAIProvider } from './AIProviderFactory';

// Generous enough to cover cold model load (weights not yet in memory) plus
// inference on an older/slower device. Without this a hung or slow inference
// leaves the row null forever, same as the "stuck Analyzing" bug.
const ANALYSIS_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => {
                onTimeout();
                reject(new Error(`Analysis timed out after ${ms / 1000}s`));
            }, ms)
        ),
    ]);
}

// Runs in the background after a progress picture is saved - callers don't
// await this, so failures are persisted as an error result rather than
// thrown, otherwise the picture would show "Analyzing..." forever.
export function analyzeMuscleGroupsInBackground(pictureId: string, imageUri: string) {
    const provider = getAIProvider();

    withTimeout(provider.analyzeMuscleGroups(imageUri), ANALYSIS_TIMEOUT_MS, () => provider.interrupt())
        .then((result) => ProgressPictureService.updateMuscleGroups(pictureId, result))
        .catch((err) => {
            console.warn(`[AI] Muscle group analysis failed for ${pictureId}:`, err);
            return ProgressPictureService.updateMuscleGroups(pictureId, {
                primaryMuscles: [],
                secondaryMuscles: [],
                confidence: 0,
                source: 'local',
                error: err instanceof Error ? err.message : String(err),
            });
        })
        .catch((persistErr) => {
            console.warn(`[AI] Failed to persist muscle group error state for ${pictureId}:`, persistErr);
        });
}
