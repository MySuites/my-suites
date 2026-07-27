import { AIModelOption, DEFAULT_AI_MODEL_ID } from './modelRegistry';

// react-native-executorch is native-only - no models exist to select,
// download, or delete on web.
export async function getSelectedModelId(): Promise<string> {
    return DEFAULT_AI_MODEL_ID;
}

export async function setSelectedModelId(_id: string): Promise<void> {}

export async function isModelDownloaded(_id: string): Promise<boolean> {
    return false;
}

export async function listModelsWithStatus(): Promise<(AIModelOption & { downloaded: boolean })[]> {
    return [];
}

export async function downloadModel(_id: string, _onProgress?: (progress: number) => void): Promise<void> {
    throw new Error('On-device AI models are not supported on web');
}

export async function deleteModel(_id: string): Promise<void> {}
