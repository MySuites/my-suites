import uuid from "react-native-uuid";
import { SetLog } from "./workout-api/types";

// Bodyweight sets carry no explicit `weight` (nothing was added), but
// ActiveWorkoutProvider already stamps `bodyweight` onto them with the
// exercise-adjusted load estimate (see getBodyweightLoadPercentage below) —
// this is what volume/history math should treat as the set's load instead
// of silently reading 0.
export function getEffectiveSetWeight(set: SetLog): number {
    if (set.weight) return set.weight;
    if (set.bodyweight) return set.bodyweight;
    return 0;
}

// Fraction of total bodyweight actually borne by the working limbs for a
// given bodyweight exercise (e.g. a push-up loads roughly two-thirds of
// bodyweight through the arms, not the full weight — the legs/toes bear the
// rest). Keyed by exercise id; only covers exercises with well-established
// figures. Anything not listed defaults to 1 (full bodyweight), the same
// assumption used before this table existed.
export const BODYWEIGHT_LOAD_PERCENTAGE: Record<string, number> = {
    push_up: 0.67,
    pull_up: 0.92,
    chin_up: 0.92,
};

export function getBodyweightLoadPercentage(exercise: { id?: string }): number {
    if (!exercise.id) return 1;
    return BODYWEIGHT_LOAD_PERCENTAGE[exercise.id] ?? 1;
}

// The user's bodyweight scaled down to what a given exercise actually loads
// (see getBodyweightLoadPercentage). Passes a missing bodyweight through
// unchanged so callers can keep treating null/undefined as "unknown".
export function getEffectiveBodyweightLoad<T extends number | null | undefined>(
    exercise: { id?: string },
    latestBodyWeight: T,
): T {
    if (latestBodyWeight == null) return latestBodyWeight;
    return (latestBodyWeight * getBodyweightLoadPercentage(exercise)) as T;
}

export type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    completedSets?: number;
    properties?: string[];
    logs?: any[];
    setTargets?: any[];
    restTime?: number;
};

export function createExercise(
    name: string,
    setsStr: string,
    repsStr: string,
    properties?: string[],
    restTime?: number,
): Exercise {
    const sets = Math.max(1, Number(setsStr) || 1);
    const reps = Math.max(1, Number(repsStr) || 1);
    const id = uuid.v4().toString();
    return {
        id,
        name: name || `Exercise ${id}`,
        sets,
        reps,
        completedSets: 0,
        properties: properties || [],
        setTargets: Array.from({ length: sets }, () => {
            const lowerProps = (properties || []).map(p => p.toLowerCase());
            const target: any = { weight: undefined };
            if (lowerProps.includes('duration')) {
                target.duration = Number(repsStr) || undefined;
            } else if (lowerProps.includes('distance')) {
                target.distance = Number(repsStr) || undefined;
            } else {
                target.reps = Number(repsStr) || undefined;
            }
            return target;
        }),
        restTime,
    };
}

export function createSequenceItem(item: any) {
    const id = Date.now().toString();
    if (item === "rest") {
        return { id, type: "rest", name: "Rest" };
    }

    return { id, type: "workout", workout: item, name: item.name };
}

export function reorderSequence(sequence: any[], index: number, dir: -1 | 1) {
    const copy = sequence.slice();
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= copy.length) return sequence;
    const [item] = copy.splice(index, 1);
    copy.splice(newIndex, 0, item);
    return copy;
}

export function calculateNextWorkoutState(
    exercises: Exercise[],
    currentIndex: number,
) {
    const copy = exercises.map((x) => ({ ...x }));
    const cur = copy[currentIndex];

    if (!cur) {
        return {
            updatedExercises: exercises,
            nextIndex: currentIndex,
            shouldRest: false,
        };
    }

    cur.completedSets = (cur.completedSets || 0) + 1;

    let nextIndex = currentIndex;

    if (cur.completedSets >= cur.sets) {
        nextIndex = Math.min(copy.length - 1, currentIndex + 1);
    }

    return {
        updatedExercises: copy,
        nextIndex,
        shouldRest: true,
    };
}

export function generateSummary(workoutSeconds: number, exercises: Exercise[]) {
    return JSON.stringify(
        {
            totalTime: workoutSeconds,
            exercises,
            startedAt: new Date().toISOString(),
        },
        null,
        2,
    );
}

export function isUnilateralExercise(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower.includes('single') || 
           lower.includes('one-arm') || 
           lower.includes('one arm') || 
           lower.includes('one-leg') || 
           lower.includes('one leg') || 
           lower.includes('unilateral') || 
           lower.includes('dumbbell row') || 
           lower.includes('lunges') || 
           lower.includes('lunge') || 
           lower.includes('split squat');
}
