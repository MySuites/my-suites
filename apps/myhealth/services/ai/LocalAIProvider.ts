import { LLMModule, ResourceFetcher, ResourceSource } from 'react-native-executorch';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
    AIProvider,
    InsightResult,
    MuscleGroupResult,
    WorkoutSummaryInput,
} from './AIProvider';
import { getModelOption } from './modelRegistry';
import { getSelectedModelId, isModelDownloaded } from './modelManager';

// Built dynamically per model - the image placeholder token varies by model
// (e.g. "<image>" for LFM2.5-VL, "<|image|>" for Gemma) and must appear in
// the prompt exactly once per image passed, or the native runner throws
// "More image/audio paths provided than placeholders in prompt".
function buildMuscleAnalysisPrompt(imageToken: string): string {
    return (
        `This image may or may not be a fitness progress photo. ${imageToken} ` +
        'First check whether a human body is clearly visible. If no person, or no muscle group is ' +
        'clearly visible (e.g. a landscape, object, or a heavily obscured/clothed body), return empty ' +
        'arrays and confidence 0 - do not guess or invent muscle names to fill the response. Otherwise ' +
        'list the visible muscle groups, ranked by how prominent they are in the frame. Respond with ' +
        'strict JSON only, no other text, in this shape: ' +
        '{"primaryMuscles": string[], "secondaryMuscles": string[], "confidence": number between 0 and 1}'
    );
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
            modelName: option.config.modelName,
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

function parseMuscleGroupResponse(raw: string): Omit<MuscleGroupResult, 'source'> {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return { primaryMuscles: [], secondaryMuscles: [], confidence: 0 };
    }
    try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            primaryMuscles: Array.isArray(parsed.primaryMuscles) ? parsed.primaryMuscles : [],
            secondaryMuscles: Array.isArray(parsed.secondaryMuscles) ? parsed.secondaryMuscles : [],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        };
    } catch {
        return { primaryMuscles: [], secondaryMuscles: [], confidence: 0 };
    }
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
        const raw = await llm.forward(buildMuscleAnalysisPrompt(imageToken), [jpegUri]);
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
