import { renderHook, waitFor } from "@testing-library/react-native";
import { useActiveWorkoutPersistence } from "../../hooks/workouts/useActiveWorkoutPersistence";

// Mock localStorage
const mockLocalStorage = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn(function (key: string) {
            return store[key] || null;
        }),
        setItem: jest.fn(function (key: string, value: string) {
            store[key] = value.toString();
        }),
        removeItem: jest.fn(function (key: string) {
            delete store[key];
        }),
        clear: jest.fn(function () {
            store = {};
        }),
    };
})();

Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
});

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: {
        multiGet: jest.fn(async (keys: string[]) => {
            return keys.map(key => [key, mockLocalStorage.getItem(key)]);
        }),
        multiSet: jest.fn(async (pairs: [string, string][]) => {
            pairs.forEach(([key, val]) => mockLocalStorage.setItem(key, val));
        }),
        multiRemove: jest.fn(async (keys: string[]) => {
            keys.forEach(key => mockLocalStorage.removeItem(key));
        }),
        removeItem: jest.fn(async (key: string) => {
            mockLocalStorage.removeItem(key);
        })
    }
}));

describe("useActiveWorkoutPersistence", () => {
    beforeEach(() => {
        (mockLocalStorage as any).clear();
        jest.clearAllMocks();
    });

    const defaultProps = {
        exercises: [],
        workoutSeconds: 0,
        workoutName: "Test Workout",
        isRunning: false,
        routineId: null,
        sourceWorkoutId: null,
        currentIndex: 0,
        hasActiveSession: false,
        setExercises: jest.fn(),
        setWorkoutSeconds: jest.fn(),
        setWorkoutName: jest.fn(),
        setRoutineId: jest.fn(),
        setSourceWorkoutId: jest.fn(),
        setCurrentIndex: jest.fn(),
        setRunning: jest.fn(),
        setHasActiveSession: jest.fn(),
    };

    it("should save state to localStorage on update", async () => {
        const { result, rerender } = renderHook(
            (props: any) => useActiveWorkoutPersistence(props),
            {
                initialProps: defaultProps,
            },
        );

        // Wait for mount load to finish
        await waitFor(() => {
            expect(result.current.isLoaded).toBe(true);
        });

        // Mock calls might happen during load, so clear them for the update test
        jest.clearAllMocks();

        const newProps = {
            ...defaultProps,
            workoutSeconds: 10,
            workoutName: "My Workout",
            hasActiveSession: true, // Only save if hasActiveSession is true
        };
        rerender(newProps);

        await waitFor(() => {
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "myhealth_workout_seconds",
                "10",
            );
        });

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            "myhealth_workout_name",
            "My Workout",
        );
    });

    it("should save exercises to localStorage", async () => {
        const { result, rerender } = renderHook(
            (props: any) => useActiveWorkoutPersistence(props),
            {
                initialProps: defaultProps,
            },
        );

        await waitFor(() => {
            expect(result.current.isLoaded).toBe(true);
        });

        jest.clearAllMocks();

        const exercises = [{
            id: "ex1",
            name: "Exercise 1",
            sets: 3,
            reps: 10,
            completedSets: 0,
            logs: [],
        }];
        const newProps = { ...defaultProps, exercises, hasActiveSession: true };
        rerender(newProps);

        await waitFor(() => {
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "myhealth_workout_exercises",
                JSON.stringify(exercises),
            );
        });
    });

    it("should save routineId if present", async () => {
        const { result, rerender } = renderHook(
            (props: any) => useActiveWorkoutPersistence(props),
            {
                initialProps: defaultProps,
            },
        );

        await waitFor(() => {
            expect(result.current.isLoaded).toBe(true);
        });

        jest.clearAllMocks();

        const newProps = { ...defaultProps, routineId: "routine-123", hasActiveSession: true };
        rerender(newProps);

        await waitFor(() => {
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                "myhealth_workout_routine_id",
                "routine-123",
            );
        });
    });

    it("should remove routineId if null", async () => {
        // Start with a routine ID
        const initialProps = { ...defaultProps, routineId: "routine-123", hasActiveSession: true };
        const { result, rerender } = renderHook(
            (props: any) => useActiveWorkoutPersistence(props),
            {
                initialProps: initialProps,
            },
        );

        await waitFor(() => {
            expect(result.current.isLoaded).toBe(true);
        });

        jest.clearAllMocks();

        // Update to null
        const newProps = { ...defaultProps, routineId: null, hasActiveSession: true };
        rerender(newProps);

        await waitFor(() => {
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                "myhealth_workout_routine_id",
            );
        });
    });

    it("should load state from localStorage on mount", async () => {
        mockLocalStorage.setItem("myhealth_workout_seconds", "25");
        mockLocalStorage.setItem("myhealth_workout_name", "Loaded Workout");
        mockLocalStorage.setItem(
            "myhealth_workout_routine_id",
            "routine-saved",
        );
        mockLocalStorage.setItem("myhealth_workout_running", "true");

        const { result } = renderHook(() => useActiveWorkoutPersistence(defaultProps));

        await waitFor(() => {
            expect(result.current.isLoaded).toBe(true);
        });

        expect(defaultProps.setWorkoutSeconds).toHaveBeenCalledWith(25);
        expect(defaultProps.setWorkoutName).toHaveBeenCalledWith(
            "Loaded Workout",
        );
        expect(defaultProps.setRoutineId).toHaveBeenCalledWith("routine-saved");
        expect(defaultProps.setRunning).toHaveBeenCalledWith(true);
        expect(defaultProps.setHasActiveSession).toHaveBeenCalledWith(true);
    });

    it("should clear persistence", async () => {
        const { result } = renderHook(() =>
            useActiveWorkoutPersistence(defaultProps)
        );

        await waitFor(() => {
            expect(result.current.isLoaded).toBe(true);
        });

        result.current.clearPersistence();

        await waitFor(() => {
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                "myhealth_workout_exercises",
            );
        });
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
            "myhealth_workout_seconds",
        );
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
            "myhealth_workout_name",
        );
    });
});
