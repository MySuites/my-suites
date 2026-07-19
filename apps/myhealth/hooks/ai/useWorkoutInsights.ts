import { useCallback, useState } from 'react';
import { getAIProvider } from '../../services/ai/AIProviderFactory';
import { InsightResult, WorkoutSummaryInput } from '../../services/ai/AIProvider';

export function useWorkoutInsights() {
    const [result, setResult] = useState<InsightResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generate = useCallback(async (input: WorkoutSummaryInput) => {
        setIsGenerating(true);
        setError(null);
        try {
            const provider = getAIProvider();
            const insights = await provider.generateInsights(input);
            setResult(insights);
            return insights;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return { result, isGenerating, error, generate };
}
