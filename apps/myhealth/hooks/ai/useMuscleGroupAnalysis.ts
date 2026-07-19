import { useCallback, useState } from 'react';
import { getAIProvider } from '../../services/ai/AIProviderFactory';
import { MuscleGroupResult } from '../../services/ai/AIProvider';

export function useMuscleGroupAnalysis() {
    const [result, setResult] = useState<MuscleGroupResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const analyze = useCallback(async (imageUri: string) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const provider = getAIProvider();
            const analysis = await provider.analyzeMuscleGroups(imageUri);
            setResult(analysis);
            return analysis;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return { result, isAnalyzing, error, analyze };
}
