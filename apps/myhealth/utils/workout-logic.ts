export type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    completedSets?: number;
    type?: string;
};

export function createExercise(
    name: string,
    setsStr: string,
    repsStr: string,
    type?: string,
): Exercise {
    const sets = Math.max(1, Number(setsStr) || 1);
    const reps = Math.max(1, Number(repsStr) || 1);
    const id = Date.now().toString();
    return {
        id,
        name: name || `Exercise ${id}`,
        sets,
        reps,
        completedSets: 0,
        type: type || "weight_reps",
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
