// Bodyweight-relative estimated-1RM standards for the "big three" compound
// lifts — the only lifts with widely-agreed public strength norms, which is
// why ranking stops here instead of covering every exercise. Ratios are
// community-consensus ballpark figures (informal, not any single proprietary
// source) for estimated-1RM ÷ bodyweight.
export type StrengthSex = 'male' | 'female';
export type StrengthTier = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';

export const RANKING_SEX_STORAGE_KEY = 'strength_ranking_sex';
export const DEFAULT_RANKING_SEX: StrengthSex = 'male';

export interface RankedLift {
    exerciseId: string;
    name: string;
    // Push/Pull/Legs — a display grouping only, not a composite score. Each
    // lift is still ranked independently against its own standard.
    category: 'Push' | 'Pull' | 'Legs';
}

export const RANKED_LIFTS: RankedLift[] = [
    { exerciseId: 'bench_press', name: 'Bench Press', category: 'Push' },
    { exerciseId: 'weighted_squat', name: 'Squat', category: 'Legs' },
    { exerciseId: 'deadlift', name: 'Deadlift', category: 'Pull' },
];

const TIERS: StrengthTier[] = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

// [Beginner, Novice, Intermediate, Advanced, Elite] bodyweight-multiple thresholds.
const STANDARDS: Record<StrengthSex, Record<string, number[]>> = {
    male: {
        bench_press: [0.5, 0.75, 1.0, 1.5, 2.0],
        weighted_squat: [0.5, 0.75, 1.25, 1.75, 2.25],
        deadlift: [0.75, 1.0, 1.5, 2.0, 2.5],
    },
    female: {
        bench_press: [0.3, 0.45, 0.65, 1.0, 1.35],
        weighted_squat: [0.35, 0.5, 0.85, 1.2, 1.6],
        deadlift: [0.5, 0.7, 1.0, 1.4, 1.9],
    },
};

export interface StrengthRankResult {
    ratio: number;
    tier: StrengthTier | null; // null = below Beginner threshold
    nextTier: StrengthTier | null;
    progressToNextTier: number | null; // 0-1, null if no next tier
}

export function getStrengthRank(
    exerciseId: string,
    estimatedOneRepMax: number,
    bodyweight: number,
    sex: StrengthSex
): StrengthRankResult | null {
    if (!bodyweight || bodyweight <= 0 || !estimatedOneRepMax || estimatedOneRepMax <= 0) return null;
    const thresholds = STANDARDS[sex]?.[exerciseId];
    if (!thresholds) return null;

    const ratio = estimatedOneRepMax / bodyweight;

    let tierIndex = -1;
    for (let i = 0; i < thresholds.length; i++) {
        if (ratio >= thresholds[i]) tierIndex = i;
    }

    const tier = tierIndex >= 0 ? TIERS[tierIndex] : null;
    const nextTierIndex = tierIndex + 1;
    const hasNext = nextTierIndex < TIERS.length;
    const nextTier = hasNext ? TIERS[nextTierIndex] : null;

    let progressToNextTier: number | null = null;
    if (hasNext) {
        const lowerBound = tierIndex >= 0 ? thresholds[tierIndex] : 0;
        const upperBound = thresholds[nextTierIndex];
        progressToNextTier = Math.max(0, Math.min(1, (ratio - lowerBound) / (upperBound - lowerBound)));
    }

    return { ratio, tier, nextTier, progressToNextTier };
}
