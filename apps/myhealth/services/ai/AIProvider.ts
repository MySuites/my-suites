export interface WorkoutSummaryInput {
    userId: string;
    exerciseName: string;
    sets: { reps: number; weight: number; unit: 'kg' | 'lb' }[];
    performedAt: string; // ISO date
    recentHistory?: { performedAt: string; totalVolume: number }[];
}

export interface InsightResult {
    summary: string;
    tips: string[];
    source: 'local' | 'cloud';
}

export interface MuscleGroupResult {
    primaryMuscles: string[];
    secondaryMuscles: string[];
    confidence: number; // 0-1
    source: 'local' | 'cloud';
}

export interface AIProvider {
    readonly kind: 'local' | 'cloud';
    isReady(): Promise<boolean>;
    analyzeMuscleGroups(imageUri: string): Promise<MuscleGroupResult>;
    generateInsights(input: WorkoutSummaryInput): Promise<InsightResult>;
}
