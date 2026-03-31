import { act, renderHook } from "@testing-library/react-native";
import { useActiveWorkoutTimers } from "../../hooks/workouts/useActiveWorkoutTimers";

describe("useActiveWorkoutTimers", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should initialize with stopped timers and zero seconds", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());
        expect(result.current.isRunning).toBe(false);
        expect(result.current.workoutSeconds).toBe(0);
        expect(result.current.restSeconds).toBe(0);
    });

    it("should run workout timer when isRunning is set to true", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());

        act(() => {
            result.current.setRunning(true);
        });

        // Advance by 5 seconds
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(result.current.workoutSeconds).toBe(5);
    });

    it("should pause workout timer", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());

        act(() => {
            result.current.setRunning(true);
        });

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        act(() => {
            result.current.setRunning(false);
        });

        // Advance more time
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Should still be at 3
        expect(result.current.workoutSeconds).toBe(3);
    });

    it("should run rest timer", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());

        act(() => {
            result.current.startRestTimer(60);
        });

        expect(result.current.restSeconds).toBe(60);

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(result.current.restSeconds).toBe(55);
    });

    it("should stop rest timer when it reaches 0", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());

        act(() => {
            result.current.startRestTimer(5);
        });

        expect(result.current.restSeconds).toBe(5);

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        // Should be 0
        expect(result.current.restSeconds).toBe(0);
    });

    it("should support resetTimers", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());

        act(() => {
            result.current.setRunning(true);
        });

        act(() => {
            jest.advanceTimersByTime(10000);
            result.current.startRestTimer(60);
        });

        expect(result.current.workoutSeconds).toBe(10);
        expect(result.current.restSeconds).toBe(60);

        act(() => {
            result.current.resetTimers();
        });

        expect(result.current.workoutSeconds).toBe(0);
        expect(result.current.restSeconds).toBe(0);
    });

    it("should continue counting when rest timer is adjusted", () => {
        const { result } = renderHook(() => useActiveWorkoutTimers());

        act(() => {
            result.current.startRestTimer(60);
        });

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(result.current.restSeconds).toBe(55);

        // Adjust timer (+15s)
        act(() => {
            result.current.startRestTimer(result.current.restSeconds + 15);
        });

        expect(result.current.restSeconds).toBe(70);

        // Advance 5 more seconds
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        // If bug exists, it will still be 70 because the interval was cleared and not restarted
        expect(result.current.restSeconds).toBe(65);
    });
});
