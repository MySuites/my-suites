import { renderHook, act } from '@testing-library/react-native';
import { useRoutineManager } from '../../hooks/routines/useRoutineManager';

const mockRoutines = [
  {
    id: 'routine-1',
    name: 'Test Routine',
    sequence: [
      { day: 'Day 1' },
      { day: 'Day 2' },
      { day: 'Day 3' },
    ],
  },
];

describe('useRoutineManager', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize with no active routine', () => {
        const { result } = renderHook(() => useRoutineManager(mockRoutines));
        expect(result.current.activeRoutine).toBeNull();
    });

    it('should start an active routine', () => {
        const { result } = renderHook(() => useRoutineManager(mockRoutines));

        act(() => {
            result.current.startActiveRoutine('routine-1');
        });

        expect(result.current.activeRoutine).toEqual({
            id: 'routine-1',
            dayIndex: 0,
            lastUpdatedDate: '2024-01-01T12:00:00.000Z',
        });
    });

    it('should set active routine index manually', () => {
        const { result } = renderHook(() => useRoutineManager(mockRoutines));

        act(() => {
            result.current.startActiveRoutine('routine-1');
        });

        act(() => {
            result.current.setActiveRoutineIndex(2);
        });

        expect(result.current.activeRoutine?.dayIndex).toBe(2);
        expect(result.current.activeRoutine?.lastCompletedDate).toBeUndefined();
    });

    it('should mark routine day as complete', () => {
        const { result } = renderHook(() => useRoutineManager(mockRoutines));

        act(() => {
            result.current.startActiveRoutine('routine-1');
        });

        act(() => {
            result.current.markRoutineDayComplete();
        });

        expect(result.current.activeRoutine?.lastCompletedDate).toBe('2024-01-01T12:00:00.000Z');
        // Day index should NOT change immediately
        expect(result.current.activeRoutine?.dayIndex).toBe(0);
    });

    it('should auto-advance routine day if completed yesterday', () => {
        const { result } = renderHook(() => useRoutineManager(mockRoutines));
        
        // 1. Simulate loading a state from "yesterday"
        const yesterday = new Date('2023-12-31T12:00:00Z');
        const today = new Date('2024-01-01T12:00:00Z');
        jest.setSystemTime(today);

        act(() => {
             // We inject a state that looks like it was completed in the past
            result.current.setRoutineState({
                id: 'routine-1',
                dayIndex: 0,
                lastCompletedDate: yesterday.toISOString()
            });
        });

        // The useEffect should run immediately after state update and advance the day
        expect(result.current.activeRoutine?.dayIndex).toBe(1);
        expect(result.current.activeRoutine?.lastCompletedDate).toBeUndefined();
    });

    it('should loop around routine sequence when auto-advancing', () => {
         const { result } = renderHook(() => useRoutineManager(mockRoutines));

         const yesterday = new Date('2023-12-31T12:00:00Z');
         const today = new Date('2024-01-01T12:00:00Z');
         jest.setSystemTime(today);
 
         act(() => {
             // Simulate state on last day, completed yesterday
             result.current.setRoutineState({
                 id: 'routine-1',
                 dayIndex: 2, // Last day
                 lastCompletedDate: yesterday.toISOString()
             });
         });
 
         // Should wrap back to 0
         expect(result.current.activeRoutine?.dayIndex).toBe(0);
    });

    it('should clear active routine', () => {
        const { result } = renderHook(() => useRoutineManager(mockRoutines));

        act(() => {
            result.current.startActiveRoutine('routine-1');
        });
        
        act(() => {
            result.current.clearActiveRoutine();
        });

        expect(result.current.activeRoutine).toBeNull();
    });
});
