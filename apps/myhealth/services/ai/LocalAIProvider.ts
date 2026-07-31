import { LLMModule, LLMModelName, ResourceFetcher, ResourceSource } from 'react-native-executorch';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
    AIProvider,
    InsightResult,
    MuscleGroupResult,
    WorkoutSummaryInput,
} from './AIProvider';
import { getModelOption } from './modelRegistry';
import { getSelectedModelId, isModelDownloaded } from './modelManager';
import { MUSCLE_GROUPS } from '../../assets/data/muscle-groups';

const ALLOWED_MUSCLE_NAMES = MUSCLE_GROUPS.map((m) => m.name);
// Case-insensitive lookup back to the app's canonical casing/spelling, so
// "biceps" or "BICEPS" from the model still resolves to "Biceps".
const MUSCLE_NAME_LOOKUP = new Map(MUSCLE_GROUPS.map((m) => [m.name.toLowerCase(), m.name]));

// Built dynamically per model - the image placeholder token varies by model
// (e.g. "<image>" for LFM2.5-VL, "<|image|>" for Gemma) and must appear in
// the prompt exactly once per image passed, or the native runner throws
// "More image/audio paths provided than placeholders in prompt".
// Kept short - a verbose version pushed total prompt+image tokens over this
// model's context window and produced a silent empty response. A literal
// JSON example (not "string[]" type notation) matters too - without one the
// model latched onto the muscle list itself and invented a {muscle: flag}
// dict schema instead of the requested arrays.
function buildMuscleAnalysisPrompt(imageToken: string): string {
    return (
        `${imageToken} Identify visible muscles in this photo (a cropped body part counts). ` +
        `Only use names from: ${ALLOWED_MUSCLE_NAMES.join(', ')}. ` +
        'Reply with ONLY this exact JSON shape, e.g. ' +
        '{"primaryMuscles": ["Biceps"], "secondaryMuscles": [], "confidence": 0.9}. ' +
        'If nothing body-related is visible, use empty arrays.'
    );
}

// Hard guardrail on top of the prompt instruction - the model has already
// been observed inventing names (e.g. "transverse abductor") that aren't on
// the app's list, so anything that doesn't match is dropped rather than
// trusted to have followed instructions.
function normalizeMuscleNames(names: string[]): string[] {
    const result: string[] = [];
    for (const name of names) {
        const canonical = MUSCLE_NAME_LOOKUP.get(String(name).trim().toLowerCase());
        if (canonical && !result.includes(canonical)) {
            result.push(canonical);
        }
    }
    return result;
}

let loadedModelId: string | null = null;
let llmInstance: LLMModule | null = null;
let imageTokenCache: Map<string, string> = new Map();

async function getImageToken(modelId: string, tokenizerConfigSource: ResourceSource): Promise<string> {
    const cached = imageTokenCache.get(modelId);
    if (cached) return cached;

    const [tokenizerConfigPath] = await ResourceFetcher.fetch(undefined, tokenizerConfigSource);
    const raw = await ResourceFetcher.fs.readAsString(tokenizerConfigPath);
    const config = JSON.parse(raw);
    const token = config.image_token;
    if (!token) {
        throw new Error('Tokenizer config is missing "image_token" - this model may not support vision input');
    }
    imageTokenCache.set(modelId, token);
    return token;
}

// The native image reader (OpenCV's cv::imread) can't decode HEIC, the
// default format for iOS camera captures - re-encoding to JPEG here makes
// analysis work regardless of the original photo's format.
async function toJpeg(imageUri: string): Promise<string> {
    const result = await manipulateAsync(imageUri, [], { format: SaveFormat.JPEG });
    return result.uri;
}

// Hard cap on generated characters, in case the model never produces a
// complete JSON object at all (still observed rambling for 1000+ chars
// without ever emitting valid JSON).
const EARLY_STOP_MAX_CHARS = 600;

function hasCompleteJsonObject(text: string): boolean {
    // Our schema is flat (no nested braces), so a non-nested match is enough.
    const match = text.match(/\{[^{}]*\}/);
    if (!match) return false;
    try {
        JSON.parse(match[0]);
        return true;
    } catch {
        return false;
    }
}

// Some models keep generating well past a correct answer - one observed
// response buried a valid JSON object early, then rambled for another 4000+
// characters of incoherent text before stopping on its own. Stopping the
// moment valid JSON appears (or a hard length cap is hit) avoids wasting
// time/battery and avoids the tail-end rambling corrupting the response.
async function forwardWithEarlyStop(llm: LLMModule, prompt: string, imagePaths: string[]): Promise<string> {
    let buffer = '';
    let stopped = false;
    llm.setTokenCallback({
        tokenCallback: (token: string) => {
            if (stopped) return;
            buffer += token;
            if (buffer.length > EARLY_STOP_MAX_CHARS || hasCompleteJsonObject(buffer)) {
                stopped = true;
                llm.interrupt();
            }
        },
    });
    try {
        return await llm.forward(prompt, imagePaths);
    } finally {
        // Don't leak this callback into unrelated calls (e.g. generateInsights)
        // sharing the same underlying model instance.
        llm.setTokenCallback({ tokenCallback: () => {} });
    }
}

async function getLLM(): Promise<{ llm: LLMModule; capabilities: readonly ('vision' | 'audio')[] }> {
    const selectedId = await getSelectedModelId();
    const option = getModelOption(selectedId);
    if (!option) {
        throw new Error(`Unknown selected model id: ${selectedId}`);
    }

    // Fail fast instead of silently downloading ~hundreds of MB inline - that
    // download can alone exceed the analysis timeout and just looks like a
    // hang. Downloading is a deliberate action in AI Models settings.
    if (loadedModelId !== selectedId && !(await isModelDownloaded(selectedId))) {
        throw new Error(`"${option.label}" is not downloaded - download it from AI Models settings first`);
    }

    if (llmInstance && loadedModelId !== selectedId) {
        llmInstance.delete();
        llmInstance = null;
    }

    if (!llmInstance) {
        llmInstance = await LLMModule.fromModelName({
            modelName: option.config.modelName as LLMModelName,
            modelSource: option.config.modelSource,
            tokenizerSource: option.config.tokenizerSource,
            tokenizerConfigSource: option.config.tokenizerConfigSource,
            capabilities: option.config.capabilities,
        });
        if (option.config.generationConfig) {
            llmInstance.configure({ generationConfig: option.config.generationConfig });
        }
        loadedModelId = selectedId;
    }

    return { llm: llmInstance, capabilities: option.config.capabilities ?? [] };
}

function buildInsightsPrompt(input: WorkoutSummaryInput): string {
    const setLines = input.sets
        .map((s, i) => `Set ${i + 1}: ${s.reps} reps @ ${s.weight}${s.unit}`)
        .join('\n');
    const historyLines = (input.recentHistory ?? [])
        .map((h) => `${h.performedAt}: total volume ${h.totalVolume}`)
        .join('\n');

    return [
        `You are a concise fitness coach. Analyze this ${input.exerciseName} performance.`,
        setLines,
        historyLines ? `Recent history:\n${historyLines}` : '',
        'Respond with a one-sentence summary, then up to 3 short actionable tips, one per line prefixed with "-".',
    ]
        .filter(Boolean)
        .join('\n\n');
}

function parseInsightResponse(raw: string): { summary: string; tips: string[] } {
    const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const tips = lines.filter((l) => l.startsWith('-')).map((l) => l.replace(/^-\s*/, ''));
    const summary = lines.find((l) => !l.startsWith('-')) ?? raw.trim();
    return { summary, tips };
}

// Field-level fallback for when the model doesn't emit strictly valid JSON
// (seen in practice: missing opening brace, "=" instead of ":"). Extracts
// each field independently rather than requiring the whole blob to parse.
function extractArrayField(raw: string, field: string): string[] {
    const match = raw.match(new RegExp(`"?${field}"?\\s*[:=]\\s*(\\[[^\\]]*\\])`, 'i'));
    if (!match) return [];
    try {
        const parsed = JSON.parse(match[1]);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function extractNumberField(raw: string, field: string): number {
    const match = raw.match(new RegExp(`"?${field}"?\\s*[:=]\\s*([0-9]*\\.?[0-9]+)`, 'i'));
    return match ? parseFloat(match[1]) : 0;
}

function parseMuscleGroupResponse(raw: string): Omit<MuscleGroupResult, 'source'> {
    // TODO(debug): remove once we've confirmed the model reliably returns
    // populated results - this tells us whether an empty result is the model
    // genuinely finding nothing, or us failing to parse what it said.
    console.log('[AI] Raw muscle group response:', JSON.stringify(raw));

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                primaryMuscles: normalizeMuscleNames(Array.isArray(parsed.primaryMuscles) ? parsed.primaryMuscles : []),
                secondaryMuscles: normalizeMuscleNames(Array.isArray(parsed.secondaryMuscles) ? parsed.secondaryMuscles : []),
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
            };
        } catch (err) {
            console.warn('[AI] Found a {...} block but JSON.parse failed, falling back to field extraction:', err);
        }
    } else {
        console.warn('[AI] No {...} block found in muscle group response, falling back to field extraction');
    }

    return {
        primaryMuscles: normalizeMuscleNames(extractArrayField(raw, 'primaryMuscles')),
        secondaryMuscles: normalizeMuscleNames(extractArrayField(raw, 'secondaryMuscles')),
        confidence: extractNumberField(raw, 'confidence'),
    };
}

export const LocalAIProvider: AIProvider = {
    kind: 'local',

    async isReady(): Promise<boolean> {
        try {
            await getLLM();
            return true;
        } catch {
            return false;
        }
    },

    async analyzeMuscleGroups(imageUri: string): Promise<MuscleGroupResult> {
        const { llm, capabilities } = await getLLM();
        if (!capabilities.includes('vision')) {
            throw new Error('Selected local model does not support photo analysis - pick a vision-capable model in AI settings');
        }
        const selectedId = await getSelectedModelId();
        const option = getModelOption(selectedId)!;
        const imageToken = await getImageToken(selectedId, option.config.tokenizerConfigSource);
        const jpegUri = await toJpeg(imageUri);
        const raw = await forwardWithEarlyStop(llm, buildMuscleAnalysisPrompt(imageToken), [jpegUri]);
        if (!raw.trim()) {
            // A real failure, not "the model looked and found nothing" -
            // likely the prompt+image exceeded the model's context window.
            // Surfacing distinctly instead of silently returning an empty
            // result that looks identical to a legitimate empty finding.
            throw new Error('Model produced no output - the prompt may be too long for this model\'s context window');
        }
        return { ...parseMuscleGroupResponse(raw), source: 'local' };
    },

    async generateInsights(input: WorkoutSummaryInput): Promise<InsightResult> {
        const { llm } = await getLLM();
        const prompt = buildInsightsPrompt(input);
        const raw = await llm.forward(prompt);
        const { summary, tips } = parseInsightResponse(raw);
        return { summary, tips, source: 'local' };
    },

    interrupt(): void {
        llmInstance?.interrupt();
    },
};
