import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockScrollToEnd = jest.fn();

const originalUseRef = React.useRef;
jest.spyOn(React, 'useRef').mockImplementation((initialValue) => {
    const ref = originalUseRef(initialValue);
    
    // Intercept the ref object so we can dynamically inject scrollToEnd on its current value
    if (ref && !(ref as any)._intercepted) {
        (ref as any)._intercepted = true;
        let internalVal = ref.current;
        Object.defineProperty(ref, 'current', {
            get() {
                if (internalVal && typeof internalVal === 'object') {
                    // Override scrollToEnd unconditionally to use our test spy
                    (internalVal as any).scrollToEnd = mockScrollToEnd;
                    (internalVal as any).scrollTo = jest.fn();
                }
                return internalVal;
            },
            set(val) {
                internalVal = val;
            },
            configurable: true,
        });
    }
    return ref;
});

// Mock dependencies
jest.mock('../../providers/ActiveWorkoutProvider', () => ({
    useActiveWorkout: () => ({
        startWorkout: jest.fn(),
        finishWorkout: jest.fn(),
        cancelWorkout: jest.fn(),
        hasActiveSession: false,
    }),
}));

jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => ({
        savedWorkouts: [],
        routines: [],
        activeRoutine: null,
        setActiveRoutineIndex: jest.fn(),
        deleteSavedWorkout: jest.fn(),
        workoutHistory: [],
    }),
}));

jest.mock('../../hooks/routines/useRoutineManager', () => ({
    useRoutineTimeline: () => [],
}));

jest.mock('../../components/routines/ActiveRoutineCard', () => ({
    ActiveRoutineCard: () => null,
}));

jest.mock('../../components/workouts/SavedWorkoutItem', () => ({
    SavedWorkoutItem: () => null,
}));

jest.mock('../../components/ui/ScreenHeader', () => ({
    ScreenHeader: () => null,
}));

// Require Workout dynamically after the spy is defined
const Workout = require('../../app/(tabs)/workout').default;

describe('Workout Tab Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders Recent Activity section and Today button', () => {
        const { getByText } = render(<Workout />);
        expect(getByText('Recent Activity')).toBeTruthy();
        expect(getByText('Today')).toBeTruthy();
    });

    it('taps Today button and triggers scroll view scrollToEnd', () => {
        const { getByText } = render(<Workout />);
        const todayButton = getByText('Today');
        
        fireEvent.press(todayButton);
        
        // The scrollToEnd should be called when Today is pressed
        expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: true });
    });
});
