import {
    calculateNextWorkoutState,
    createExercise,
    Exercise,
    reorderSequence,
    isUnilateralExercise,
} from "../utils/workout-logic";

describe("Workout Logic", () => {
    describe("createExercise", () => {
        it("should create an exercise with valid defaults", () => {
            const ex = createExercise("Push Ups", "3", "10");
            expect(ex.name).toBe("Push Ups");
            expect(ex.sets).toBe(3);
            expect(ex.reps).toBe(10);
            expect(ex.completedSets).toBe(0);
            expect(ex.id).toBeDefined();
        });

        it("should handle invalid inputs gracefully", () => {
            const ex = createExercise("", "invalid", "0");
            expect(ex.name).toContain("Exercise");
            expect(ex.sets).toBe(1); // Min 1
            expect(ex.reps).toBe(1); // Min 1
        });
    });

    describe("calculateNextWorkoutState", () => {
        const mockExercises: Exercise[] = [
            { id: "1", name: "Ex 1", sets: 2, reps: 10, completedSets: 0 },
            { id: "2", name: "Ex 2", sets: 1, reps: 10, completedSets: 0 },
        ];

        it("should increment completed sets", () => {
            const { updatedExercises, nextIndex, shouldRest } =
                calculateNextWorkoutState(mockExercises, 0);
            expect(updatedExercises[0].completedSets).toBe(1);
            expect(nextIndex).toBe(0);
            expect(shouldRest).toBe(true);
        });

        it("should advance to next exercise when sets are complete", () => {
            const exercises = [
                { ...mockExercises[0], completedSets: 1 },
                mockExercises[1],
            ];
            const { updatedExercises, nextIndex } = calculateNextWorkoutState(
                exercises,
                0,
            );
            expect(updatedExercises[0].completedSets).toBe(2);
            expect(nextIndex).toBe(1);
        });

        it("should stay on last exercise when workout is done", () => {
            const exercises = [
                mockExercises[0],
                { ...mockExercises[1], completedSets: 0 },
            ];
            const { updatedExercises, nextIndex } = calculateNextWorkoutState(
                exercises,
                1,
            );
            expect(updatedExercises[1].completedSets).toBe(1);
            expect(nextIndex).toBe(1);
        });
    });

    describe("reorderSequence", () => {
        const sequence = ["A", "B", "C"];

        it("should move item down", () => {
            const result = reorderSequence(sequence, 0, 1);
            expect(result).toEqual(["B", "A", "C"]);
        });

        it("should move item up", () => {
            const result = reorderSequence(sequence, 1, -1);
            expect(result).toEqual(["B", "A", "C"]);
        });

        it("should do nothing if moving out of bounds", () => {
            const result = reorderSequence(sequence, 0, -1);
            expect(result).toEqual(["A", "B", "C"]);
        });
    });

    describe("isUnilateralExercise", () => {
        it("should detect single arm/leg and unilateral keywords", () => {
            expect(isUnilateralExercise("Single Arm Bicep Curl")).toBe(true);
            expect(isUnilateralExercise("One-Arm Dumbbell Row")).toBe(true);
            expect(isUnilateralExercise("Dumbbell Row")).toBe(true);
            expect(isUnilateralExercise("Bulgarian Split Squat")).toBe(true);
            expect(isUnilateralExercise("Weighted Lunges")).toBe(true);
        });

        it("should return false for bilateral exercises", () => {
            expect(isUnilateralExercise("Bench Press")).toBe(false);
            expect(isUnilateralExercise("Squats")).toBe(false);
            expect(isUnilateralExercise("Push Ups")).toBe(false);
            expect(isUnilateralExercise("Bicep Curl")).toBe(false);
        });
    });
});
