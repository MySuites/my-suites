import { ResourceFetcher } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
import { storage } from '../../utils/storage';
import {
    AI_MODEL_REGISTRY,
    AIModelOption,
    DEFAULT_AI_MODEL_ID,
    getModelOption,
    getModelResourceSources,
} from './modelRegistry';

const SELECTED_MODEL_STORAGE_KEY = 'ai_selected_model_id';
const DOWNLOADED_MODELS_STORAGE_KEY = 'ai_downloaded_model_ids';

async function getDownloadedIds(): Promise<string[]> {
    return (await storage.getItem<string[]>(DOWNLOADED_MODELS_STORAGE_KEY)) ?? [];
}

async function markDownloaded(id: string): Promise<void> {
    const ids = await getDownloadedIds();
    if (!ids.includes(id)) {
        await storage.setItem(DOWNLOADED_MODELS_STORAGE_KEY, [...ids, id]);
    }
}

async function markNotDownloaded(id: string): Promise<void> {
    const ids = await getDownloadedIds();
    await storage.setItem(DOWNLOADED_MODELS_STORAGE_KEY, ids.filter((existing) => existing !== id));
}

export async function getSelectedModelId(): Promise<string> {
    return (await storage.getItem<string>(SELECTED_MODEL_STORAGE_KEY)) ?? DEFAULT_AI_MODEL_ID;
}

export async function setSelectedModelId(id: string): Promise<void> {
    await storage.setItem(SELECTED_MODEL_STORAGE_KEY, id);
}

export async function isModelDownloaded(id: string): Promise<boolean> {
    const ids = await getDownloadedIds();
    return ids.includes(id);
}

export async function listModelsWithStatus(): Promise<(AIModelOption & { downloaded: boolean })[]> {
    const downloadedIds = await getDownloadedIds();
    return AI_MODEL_REGISTRY.map((option) => ({
        ...option,
        downloaded: downloadedIds.includes(option.id),
    }));
}

export async function downloadModel(id: string, onProgress?: (progress: number) => void): Promise<void> {
    const option = getModelOption(id);
    if (!option) {
        throw new Error(`Unknown model id: ${id}`);
    }
    await ResourceFetcher.fetch(onProgress, ...getModelResourceSources(option));
    await markDownloaded(id);
}

export async function deleteModel(id: string): Promise<void> {
    const option = getModelOption(id);
    if (!option) {
        throw new Error(`Unknown model id: ${id}`);
    }
    await ExpoResourceFetcher.deleteResources(...getModelResourceSources(option));
    await markNotDownloaded(id);

    const selected = await getSelectedModelId();
    if (selected === id) {
        await setSelectedModelId(DEFAULT_AI_MODEL_ID);
    }
}
