import { useCallback, useEffect, useState } from 'react';
import { AIModelOption } from '../../services/ai/modelRegistry';
import {
    deleteModel,
    downloadModel,
    getSelectedModelId,
    listModelsWithStatus,
    setSelectedModelId,
} from '../../services/ai/modelManager';

export function useAIModelManager() {
    const [models, setModels] = useState<(AIModelOption & { downloaded: boolean })[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        const [modelList, selected] = await Promise.all([listModelsWithStatus(), getSelectedModelId()]);
        setModels(modelList);
        setSelectedId(selected);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const download = useCallback(async (id: string) => {
        setError(null);
        setDownloadingId(id);
        setDownloadProgress(0);
        try {
            await downloadModel(id, setDownloadProgress);
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setDownloadingId(null);
        }
    }, [refresh]);

    const remove = useCallback(async (id: string) => {
        setError(null);
        try {
            await deleteModel(id);
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [refresh]);

    const select = useCallback(async (id: string) => {
        setError(null);
        try {
            await setSelectedModelId(id);
            setSelectedId(id);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    }, []);

    return {
        models,
        selectedId,
        downloadingId,
        downloadProgress,
        error,
        download,
        remove,
        select,
    };
}
