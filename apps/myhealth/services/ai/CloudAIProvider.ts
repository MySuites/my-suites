import { AIProvider, InsightResult, MuscleGroupResult, WorkoutSummaryInput } from './AIProvider';

// Stub until the paid subscription tier ships. Will proxy to a serverless
// endpoint (Cloudflare Worker) backed by a hosted model, gated server-side
// by subscription status - never trust the client-side tier flag alone.
export const CloudAIProvider: AIProvider = {
    kind: 'cloud',

    async isReady(): Promise<boolean> {
        return false;
    },

    async analyzeMuscleGroups(_imageUri: string): Promise<MuscleGroupResult> {
        throw new Error('CloudAIProvider is not available yet');
    },

    async generateInsights(_input: WorkoutSummaryInput): Promise<InsightResult> {
        throw new Error('CloudAIProvider is not available yet');
    },
};
