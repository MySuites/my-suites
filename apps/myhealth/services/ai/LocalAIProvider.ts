import { LLMModule } from 'react-native-executorch';
import {
    AIProvider,
    InsightResult,
    MuscleGroupResult,
    WorkoutSummaryInput,
} from './AIProvider';
import { getModelOption } from './modelRegistry';
import { getSelectedModelId } from './modelManager';

const MUSCLE_ANALYSIS_PROMPT =
    'Look at this workout progress photo. List the visible muscle groups, ' +
    'ranked by how prominent they are in the frame. Respond with strict JSON only, ' +
    'no other text, in this shape: ' +
    '{"primaryMuscles": string[], "secondaryMuscles": string[], "confidence": number between 0 and 1}';

let loadedModelId: string | null = null;
let llmInstance: LLMModule | null = null;

async function getLLM(): Promise<{ llm: LLMModule; capabilities: readonly ('vision' | 'audio')[] }> {
    const selectedId = await getSelectedModelId();
    const option = getModelOption(selectedId);
    if (!option) {
        throw new Error(`Unknown selected model id: ${selectedId}`);
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
        const raw = await llm.forward(MUSCLE_ANALYSIS_PROMPT, [imageUri]);
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
