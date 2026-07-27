import { AIProvider, InsightResult, MuscleGroupResult, WorkoutSummaryInput } from './AIProvider';

// react-native-executorch is native-only - on-device inference isn't
// available on the web build at all.
export const LocalAIProvider: AIProvider = {
    kind: 'local',

    async isReady(): Promise<boolean> {
        return false;
    },

    async analyzeMuscleGroups(_imageUri: string): Promise<MuscleGroupResult> {
        throw new Error('On-device AI analysis is not supported on web');
    },

    async generateInsights(_input: WorkoutSummaryInput): Promise<InsightResult> {
        throw new Error('On-device AI analysis is not supported on web');
    },

    interrupt(): void {},
};
