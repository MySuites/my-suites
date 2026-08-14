// No react-native-executorch import here on purpose - this file must stay
// importable from the web build. It's native-only (importing the package
// crashes Metro's web bundle at module-eval time), so anything that touches
// it needs a native/.web split; this file is the shared type surface both
// sides re-export.
export type ResourceSourceLike = string | number | object;

export type AIModelCapability = 'vision' | 'text';

export interface AIModelConfig {
    modelName: string;
    modelSource: ResourceSourceLike;
    tokenizerSource: ResourceSourceLike;
    tokenizerConfigSource: ResourceSourceLike;
    generationConfig?: Record<string, unknown>;
    capabilities?: readonly ('vision' | 'audio')[];
}

export interface AIModelOption {
    id: string;
    label: string;
    description: string;
    approxSizeMB: number;
    capabilities: AIModelCapability[];
    config: AIModelConfig;
    // Estimated from model size/RAM needs, not device-tested - update if
    // real benchmarks say otherwise.
    minIphone: string;
    recommendedIphone: string;
}
