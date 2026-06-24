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
            attachment: exercise.attachment, // Copy attachment
            equipment: Array.isArray(exercise.equipment) ? exercise.equipment[0] : exercise.equipment,   // Copy equipment
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

    function reorderExercises(from: number, to: number) {
        if (from === to) return;
        const newArr = [...workoutDraftExercises];
        const [moved] = newArr.splice(from, 1);
        newArr.splice(to, 0, moved);
        setWorkoutDraftExercises(newArr);
    }

    function updateSetTarget(
        exerciseIndex: number,
        setIndex: number,
        field: "reps" | "reps_left" | "reps_right" | "weight" | "duration" | "distance" | "rpe",
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
            const numValue = value === '' ? undefined : Number(value);
            newTargets[setIndex] = {
                ...newTargets[setIndex],
                [field]: (value === '' || isNaN(numValue as any)) ? undefined : numValue
            };
            ex.setTargets = newTargets;

            // Sync top level properties for the first set (legacy behavior/UI summary)
            if (setIndex === 0) {
                if (field === "reps") ex.reps = (value === '' || isNaN(numValue as any)) ? undefined : numValue;
                if (field === "reps_left" || field === "reps_right") {
                    const leftVal = field === "reps_left" ? numValue : newTargets[setIndex].reps_left;
                    const rightVal = field === "reps_right" ? numValue : newTargets[setIndex].reps_right;
                    ex.reps = Math.max(leftVal ?? 0, rightVal ?? 0);
                }
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

    function updateExerciseRestTime(exerciseIndex: number, restTime: number) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            newArr[exerciseIndex] = { ...newArr[exerciseIndex], restTime };
            return newArr;
        });
    }

    function updateExerciseAttachment(exerciseIndex: number, attachment: string) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            newArr[exerciseIndex] = { ...newArr[exerciseIndex], attachment };
            return newArr;
        });
    }

    function updateExerciseEquipment(exerciseIndex: number, equipment: string) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            newArr[exerciseIndex] = { ...newArr[exerciseIndex], equipment };
            return newArr;
        });
    }

    function updateExerciseMovementType(exerciseIndex: number, movementType: string) {
        setWorkoutDraftExercises((prev) => {
            const newArr = [...prev];
            newArr[exerciseIndex] = { ...newArr[exerciseIndex], movementType };
            return newArr;
        });
    }

    return {
        workoutDraftExercises,
        setWorkoutDraftExercises,
        addExercise,
        removeExercise,
        moveExercise,
        reorderExercises,
        updateSetTarget,
        updateExerciseRestTime,
        updateExerciseAttachment,
        updateExerciseEquipment,
        updateExerciseMovementType,
        addSet,
        removeSet,
    };
};
