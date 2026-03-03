import { useState } from "react";

export const useWorkoutDraft = (initialExercises: any[] = []) => {
    const [workoutDraftExercises, setWorkoutDraftExercises] = useState<any[]>(
        initialExercises,
    );

    function addExercise(exercise: any) {
        const newExercise = {
            id: exercise.id,
            name: exercise.name,
            sets: 3,
            reps: 10,
            category: exercise.category,
            properties: exercise.properties, // Copy properties
            type: exercise.rawType,
            isNewlyAdded: exercise.isNewlyAdded,
            setTargets: Array.from(
                { length: 3 },
                () => ({ reps: 10, weight: 0, duration: 0, distance: 0 }),
            ),
        };
        setWorkoutDraftExercises((prev) => [...prev, newExercise]);
    }

    function removeExercise(index: number) {
        setWorkoutDraftExercises((prev) => prev.filter((_, i) => i !== index));
    }

    function moveExercise(index: number, dir: -1 | 1) {
        const newArr = [...workoutDraftExercises];
        if (index + dir < 0 || index + dir >= newArr.length) return;
        const temp = newArr[index];
        newArr[index] = newArr[index + dir];
        newArr[index + dir] = temp;
        setWorkoutDraftExercises(newArr);
    }

    function updateSetTarget(
        exerciseIndex: number,
        setIndex: number,
        field: "reps" | "weight" | "duration" | "distance",
        value: string,
    ) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
            if (!ex.setTargets) {
                ex.setTargets = Array.from(
                    { length: ex.sets || 1 },
                    () => ({ reps: ex.reps || 0, weight: 0 }),
                );
            }
            const newTargets = [...ex.setTargets];
            newTargets[setIndex] = {
                ...newTargets[setIndex],
                [field]: Number(value) || 0,
            };
            ex.setTargets = newTargets;

            // Sync top level properties for the first set (legacy behavior/UI summary)
            if (setIndex === 0) {
                if (field === "reps") ex.reps = Number(value) || 0;
            }
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    function addSet(exerciseIndex: number) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
            if (!ex.setTargets) {
                ex.setTargets = Array.from(
                    { length: ex.sets || 1 },
                    () => ({ reps: ex.reps || 0, weight: 0 }),
                );
            }
            const lastSet = ex.setTargets[ex.setTargets.length - 1] ||
                { reps: 10, weight: 0 };
            ex.setTargets = [...ex.setTargets, { ...lastSet }];
            ex.sets = ex.setTargets.length;
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    function removeSet(exerciseIndex: number, setIndex: number) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
            if (!ex.setTargets) {
                ex.setTargets = Array.from(
                    { length: ex.sets || 1 },
                    () => ({ reps: ex.reps || 0, weight: 0 }),
                );
            }
            if (ex.setTargets.length <= 1) {
                return newArr;
            }
            ex.setTargets = ex.setTargets.filter((_: any, i: number) =>
                i !== setIndex
            );
            ex.sets = ex.setTargets.length;

            if (setIndex === 0 && ex.setTargets.length > 0) {
                ex.reps = ex.setTargets[0].reps;
            }
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    return {
        workoutDraftExercises,
        setWorkoutDraftExercises,
        addExercise,
        removeExercise,
        moveExercise,
        updateSetTarget,
        addSet,
        removeSet,
    };
};
