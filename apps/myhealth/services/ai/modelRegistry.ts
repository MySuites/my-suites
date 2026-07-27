import {
    LFM2_5_VL_450M_QUANTIZED,
    LFM2_5_VL_1_6B_QUANTIZED,
    GEMMA4_E2B_MM,
    QWEN3_0_6B_QUANTIZED,
} from 'react-native-executorch';
import { AIModelOption, ResourceSourceLike } from './modelRegistry.types';

export * from './modelRegistry.types';

// Curated list only - keeps download sizes predictable and every option
// verified to run through react-native-executorch on-device.
export const AI_MODEL_REGISTRY: AIModelOption[] = [
    {
        id: 'lfm2.5-vl-450m-quantized',
        label: 'LFM2.5 VL 450M (quantized)',
        description: 'Smallest vision+text model. Handles photo analysis and workout insights in one download.',
        approxSizeMB: 450,
        capabilities: ['vision', 'text'],
        config: LFM2_5_VL_450M_QUANTIZED,
    },
    {
        id: 'lfm2.5-vl-1.6b-quantized',
        label: 'LFM2.5 VL 1.6B (quantized)',
        description: 'Larger vision+text model. Better photo analysis and insight quality, bigger download.',
        approxSizeMB: 1600,
        capabilities: ['vision', 'text'],
        config: LFM2_5_VL_1_6B_QUANTIZED,
    },
    {
        id: 'gemma4-e2b-multimodal',
        label: 'Gemma 4 E2B Multimodal',
        description: 'Largest option. Vision+text with the strongest reasoning quality.',
        approxSizeMB: 2000,
        capabilities: ['vision', 'text'],
        config: GEMMA4_E2B_MM,
    },
    {
        id: 'qwen3-0.6b-quantized',
        label: 'Qwen3 0.6B (quantized)',
        description: 'Text-only, fastest option for workout insights. No photo analysis support.',
        approxSizeMB: 600,
        capabilities: ['text'],
        config: QWEN3_0_6B_QUANTIZED,
    },
];

export const DEFAULT_AI_MODEL_ID = AI_MODEL_REGISTRY[0].id;

export function getModelOption(id: string): AIModelOption | undefined {
    return AI_MODEL_REGISTRY.find((m) => m.id === id);
}

export function getModelResourceSources(option: AIModelOption): ResourceSourceLike[] {
    return [option.config.modelSource, option.config.tokenizerSource, option.config.tokenizerConfigSource];
}
