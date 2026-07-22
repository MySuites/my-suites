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
    error?: string; // set when analysis failed to run - distinguishes "failed" from "ran, found nothing"
}

export interface AIProvider {
    readonly kind: 'local' | 'cloud';
    isReady(): Promise<boolean>;
    analyzeMuscleGroups(imageUri: string): Promise<MuscleGroupResult>;
    generateInsights(input: WorkoutSummaryInput): Promise<InsightResult>;
    // Stops in-flight generation (e.g. after a caller-side timeout). Best-effort:
    // the model may still emit one more token after this before actually stopping.
    interrupt(): void;
}
