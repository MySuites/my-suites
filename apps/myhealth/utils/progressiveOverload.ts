// Double progression: at a given weight, add a rep each session until
// hitting the rep ceiling (top of a normal working-set range), then reset
// reps back to the floor and bump the weight. This is the standard,
// exercise-agnostic progressive-overload scheme — safer than a flat linear
// weight increase (which stalls on harder lifts) and simpler than %-of-1RM
// programming (which needs a reliable e1RM history to be accurate).
//
// When recent RPE history is available (RPE tracking enabled), it adjusts
// how aggressively to progress: sets that have felt easy get pushed harder,
// sets that have felt near-max get held steady instead of piled on.
export const DEFAULT_REP_CEILING = 12;
export const REP_CEILING_MIN = 6;
export const REP_CEILING_MAX = 30;
export const WEIGHT_INCREMENT_LB = 5;
export const WEIGHT_INCREMENT_LB_AGGRESSIVE = 10;
export const RPE_EASY_THRESHOLD = 6;
export const RPE_HARD_THRESHOLD = 9;

export interface PreviousSetLog {
    weight?: string | number | null;
    reps?: string | number | null;
    reps_left?: string | number | null;
    reps_right?: string | number | null;
    duration?: string | number | null;
}

export interface SuggestedGoal {
    // Weight is always in lb (canonical storage unit) — convert for display
    // at the call site, same as everywhere else weight is shown.
    weight: number;
    reps: number;
}

function num(val: string | number | null | undefined): number | null {
    if (val === undefined || val === null || val === '') return null;
    const n = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(n) ? null : n;
}

// Single-limb (or bilateral) suggestion from a previous weight/reps pair,
// optionally weighted by recent average RPE for this set. The floor (where
// reps reset to after a weight bump) scales with the ceiling, keeping the
// same 4-rep working range as the 8-12 default regardless of what ceiling
// the user configures.
function suggestFromPair(
    prevWeight: number | null,
    prevReps: number | null,
    avgRpe: number | null | undefined,
    repCeiling: number
): SuggestedGoal | null {
    if (prevWeight === null || prevReps === null) return null;
    const repFloor = Math.max(1, repCeiling - 4);

    // Recent sets have been near-max effort — hold steady rather than add
    // more on top of an already-grinding set.
    if (avgRpe !== undefined && avgRpe !== null && avgRpe >= RPE_HARD_THRESHOLD) {
        return { weight: prevWeight, reps: prevReps };
    }

    // Recent sets have felt easy — push harder than the standard +1 rep.
    const isEasy = avgRpe !== undefined && avgRpe !== null && avgRpe <= RPE_EASY_THRESHOLD;

    if (prevReps >= repCeiling) {
        return {
            weight: prevWeight + (isEasy ? WEIGHT_INCREMENT_LB_AGGRESSIVE : WEIGHT_INCREMENT_LB),
            reps: repFloor,
        };
    }
    return { weight: prevWeight, reps: Math.min(repCeiling, prevReps + (isEasy ? 2 : 1)) };
}

export function getSuggestedGoal(
    prev: PreviousSetLog | undefined | null,
    avgRpe?: number | null,
    repCeiling: number = DEFAULT_REP_CEILING
): SuggestedGoal | null {
    if (!prev) return null;
    return suggestFromPair(num(prev.weight), num(prev.reps), avgRpe, repCeiling);
}

// Unilateral suggestion uses the weaker (lower-rep) side to drive the
// weight/rep bump, so the suggestion never asks the weaker side to jump
// straight to a rep count it hasn't proven it can hit.
export function getSuggestedUnilateralGoal(
    prev: PreviousSetLog | undefined | null,
    avgRpe?: number | null,
    repCeiling: number = DEFAULT_REP_CEILING
): SuggestedGoal | null {
    if (!prev) return null;
    const left = num(prev.reps_left ?? prev.reps);
    const right = num(prev.reps_right ?? prev.reps);
    const prevWeight = num(prev.weight);
    if (left === null || right === null || prevWeight === null) return null;
    return suggestFromPair(prevWeight, Math.min(left, right), avgRpe, repCeiling);
}

// Same double-progression idea applied to timed holds (planks, dead hangs,
// etc.): add seconds each session until a duration ceiling, then — for
// weighted holds — reset the timer and add load, same as the rep version.
// For bodyweight-only holds (no weight to add), just keep extending past the
// ceiling since there's no natural "reset point" without added resistance.
export const DEFAULT_DURATION_CEILING_SEC = 60;
export const DURATION_CEILING_MIN_SEC = 15;
export const DURATION_CEILING_MAX_SEC = 300;
export const DURATION_INCREMENT_SEC = 5;
export const DURATION_INCREMENT_SEC_AGGRESSIVE = 10;

export interface SuggestedDurationGoal {
    // Present only if the exercise also tracks weight (e.g. weighted plank).
    weight?: number;
    duration: number; // seconds
}

export function getSuggestedDurationGoal(
    prev: PreviousSetLog | undefined | null,
    avgRpe?: number | null,
    durationCeiling: number = DEFAULT_DURATION_CEILING_SEC
): SuggestedDurationGoal | null {
    if (!prev) return null;
    const prevDuration = num(prev.duration);
    if (prevDuration === null) return null;
    const prevWeight = num(prev.weight);
    const hasWeight = prevWeight !== null;
    const durationFloor = Math.max(5, durationCeiling - 20);

    if (avgRpe !== undefined && avgRpe !== null && avgRpe >= RPE_HARD_THRESHOLD) {
        return hasWeight ? { weight: prevWeight!, duration: prevDuration } : { duration: prevDuration };
    }

    const isEasy = avgRpe !== undefined && avgRpe !== null && avgRpe <= RPE_EASY_THRESHOLD;
    const increment = isEasy ? DURATION_INCREMENT_SEC_AGGRESSIVE : DURATION_INCREMENT_SEC;

    if (prevDuration >= durationCeiling) {
        if (hasWeight) {
            return {
                weight: prevWeight! + (isEasy ? WEIGHT_INCREMENT_LB_AGGRESSIVE : WEIGHT_INCREMENT_LB),
                duration: durationFloor,
            };
        }
        // No load to add — keep extending the hold past the ceiling.
        return { duration: prevDuration + increment };
    }

    const nextDuration = hasWeight ? Math.min(durationCeiling, prevDuration + increment) : prevDuration + increment;
    return hasWeight ? { weight: prevWeight!, duration: nextDuration } : { duration: nextDuration };
}
