import { act, renderHook } from "@testing-library/react-native";
import { useWorkoutDraft } from "../../hooks/workouts/useWorkoutDraft";

describe("useWorkoutDraft", () => {
    it("initializes with empty array by default", () => {
        const { result } = renderHook(() => useWorkoutDraft());
        expect(result.current.workoutDraftExercises).toEqual([]);
    });

    it("initializes with provided exercises", () => {
        const init = [{ id: "1", name: "Ex1" }];
        const { result } = renderHook(() => useWorkoutDraft(init));
        expect(result.current.workoutDraftExercises).toEqual(init);
    });

    it("adds an exercise correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());

        act(() => {
            result.current.addExercise({
                id: "ex1",
                name: "Push Ups",
                rawType: "reps",
            });
        });

        expect(result.current.workoutDraftExercises).toHaveLength(1);
        const ex = result.current.workoutDraftExercises[0];
        expect(ex.name).toBe("Push Ups");
        expect(ex.sets).toBe(3);
        expect(ex.setTargets).toHaveLength(3);
    });

    it("removes an exercise correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());

        act(() => {
            result.current.addExercise({ id: "ex1", name: "Push Ups" });
            result.current.addExercise({ id: "ex2", name: "Squats" });
        });

        expect(result.current.workoutDraftExercises).toHaveLength(2);

        act(() => {
            result.current.removeExercise(0); // Remove Push Ups
        });

        expect(result.current.workoutDraftExercises).toHaveLength(1);
        expect(result.current.workoutDraftExercises[0].name).toBe("Squats");
    });

    it("moves an exercise correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());

        act(() => {
            result.current.addExercise({ id: "ex1", name: "Push Ups" });
            result.current.addExercise({ id: "ex2", name: "Squats" });
        });

        // Current: [Push Ups, Squats]
        // Move Push Ups (index 0) down (dir 1) -> [Squats, Push Ups]
        act(() => {
            result.current.moveExercise(0, 1);
        });

        expect(result.current.workoutDraftExercises[0].name).toBe("Squats");
        expect(result.current.workoutDraftExercises[1].name).toBe("Push Ups");
    });

    it("adds a set correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());
        act(() => {
            result.current.addExercise({ id: "ex1", name: "Push Ups" });
        });
        // Default 3 sets
        expect(result.current.workoutDraftExercises[0].sets).toBe(3);

        act(() => {
            result.current.addSet(0);
        });

        expect(result.current.workoutDraftExercises[0].sets).toBe(4);
        expect(result.current.workoutDraftExercises[0].setTargets).toHaveLength(
            4,
        );
    });

    it("removes a set correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());
        act(() => {
            result.current.addExercise({ id: "ex1", name: "Push Ups" });
        });

        act(() => {
            result.current.removeSet(0, 0); // Remove 1st set
        });

        expect(result.current.workoutDraftExercises[0].sets).toBe(2);
        expect(result.current.workoutDraftExercises[0].setTargets).toHaveLength(
            2,
        );
    });

    it("updates set target correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());
        act(() => {
            result.current.addExercise({ id: "ex1", name: "Push Ups" });
        });

        act(() => {
            // Update Set 0, reps -> 15
            result.current.updateSetTarget(0, 0, "reps", "15");
        });

        const ex = result.current.workoutDraftExercises[0];
        expect(ex.setTargets[0].reps).toBe(15);
        // Should sync to top level legacy rep prop
        expect(ex.reps).toBe(15);

        act(() => {
            // Update Set 1, weight -> 50
            result.current.updateSetTarget(0, 1, "weight", "50");
        });

        expect(result.current.workoutDraftExercises[0].setTargets[1].weight)
            .toBe(50);
    });

    it("updates exercise attachment correctly", () => {
        const { result } = renderHook(() => useWorkoutDraft());
        act(() => {
            result.current.addExercise({
                id: "lat_pulldown",
                name: "Lat Pulldown",
                rawType: "reps",
                attachment: "Lat Bar"
            });
        });

        expect(result.current.workoutDraftExercises[0].attachment).toBe("Lat Bar");

        act(() => {
            result.current.updateExerciseAttachment(0, "Close-Grip V-Bar");
        });

        expect(result.current.workoutDraftExercises[0].attachment).toBe("Close-Grip V-Bar");
    });
});
