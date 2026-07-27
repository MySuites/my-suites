import { AIModelOption, ResourceSourceLike } from './modelRegistry.types';

export * from './modelRegistry.types';

// react-native-executorch is native-only - no models to offer on web.
export const AI_MODEL_REGISTRY: AIModelOption[] = [];

export const DEFAULT_AI_MODEL_ID = '';

export function getModelOption(_id: string): AIModelOption | undefined {
    return undefined;
}

export function getModelResourceSources(_option: AIModelOption): ResourceSourceLike[] {
    return [];
}
