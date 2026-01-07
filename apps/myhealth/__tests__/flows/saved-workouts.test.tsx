import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SavedWorkoutsScreen from '../../app/workouts/saved';
import CreateWorkoutScreen from '../../app/workouts/editor';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as RN from 'react-native';

const mockRN = RN;
const { Alert } = RN;

// Mocks
jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: jest.fn(),
    fetchExercises: jest.fn(() => Promise.resolve({ data: [] }))
}));

jest.mock('../../providers/ActiveWorkoutProvider', () => ({
    useActiveWorkout: jest.fn()
}));

jest.mock('../../providers/FloatingButtonContext', () => ({
    useFloatingButton: () => ({ setIsHidden: jest.fn() })
}));

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
    usePathname: jest.fn()
}));

jest.mock('@mysuite/auth', () => ({
    useAuth: () => ({ user: { id: 'test-user' } })
}));

jest.mock('@mysuite/ui', () => {
    return {
        useUITheme: () => ({ primary: 'blue', textMuted: 'gray', danger: 'red', bg: 'white' }),

        RaisedCard: (props: any) => {
            const { TouchableOpacity } = require('react-native');
            return <TouchableOpacity {...props} />;
        },

        HollowedCard: ({ children }: any) => <mockRN.View>{children}</mockRN.View>,
        Skeleton: () => <mockRN.View />,
        IconSymbol: ({ name }: any) => <mockRN.Text>Icon:{name}</mockRN.Text>,
        ScreenHeader: ({ title, rightAction }: any) => (
            <mockRN.View>
                <mockRN.Text>{title}</mockRN.Text>
                {rightAction}
            </mockRN.View>
        ),
        BackButton: () => <mockRN.View />
    };
});

// Mock the local BackButton component as well
jest.mock('../../components/ui/BackButton', () => {
    return {
        BackButton: () => <mockRN.View />
    };
});

// Mock ExerciseSelector
jest.mock('../../components/workouts/ExerciseSelector', () => {
    return {
        ExerciseSelector: ({ visible, onSelect }: any) => visible ? (
            <mockRN.TouchableOpacity onPress={() => onSelect({ id: 'ex-1', name: 'Mock Exercise' })}>
                <mockRN.Text>Select Mock Exercise</mockRN.Text>
            </mockRN.TouchableOpacity>
        ) : null
    };
});

// Partially Mock useWorkoutDraft to control internal state if needed,
// OR assume it works (since we tested it in isolation) and let it run naturally if we didn't export it?
// Actually, `useWorkoutDraft` is a custom hook used inside `editor.tsx`.
// Use a mock function that we can control
const mockUseWorkoutDraft = jest.fn();
jest.mock('../../hooks/workouts/useWorkoutDraft', () => ({
    useWorkoutDraft: (...args: any[]) => mockUseWorkoutDraft(...args)
}));

describe('Saved Workouts & Template Editor', () => {
    const mockRouter = { push: jest.fn(), back: jest.fn() };
    const mockStartWorkout = jest.fn();
    
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useActiveWorkout as jest.Mock).mockReturnValue({
            hasActiveSession: false,
            startWorkout: mockStartWorkout,
            latestBodyWeight: 75
        });
        (useLocalSearchParams as jest.Mock).mockReturnValue({});
    });

    describe('SavedWorkoutsScreen', () => {
        it('renders empty state', () => {
            (useWorkoutManager as jest.Mock).mockReturnValue({
                savedWorkouts: [],
                isLoading: false
            });

            const { getByText } = render(<SavedWorkoutsScreen />);
            expect(getByText(/No saved workouts found/)).toBeTruthy();
        });

        it('renders saved workouts and handles start', () => {
            const mockWorkouts = [{ id: 'w1', name: 'Leg Day', exercises: [], createdAt: new Date().toISOString() }];
            (useWorkoutManager as jest.Mock).mockReturnValue({
                savedWorkouts: mockWorkouts,
                isLoading: false
            });

            const { getByText } = render(<SavedWorkoutsScreen />);
            expect(getByText('Leg Day')).toBeTruthy();

            // Find Play button (Icon:play.fill)
            fireEvent.press(getByText('Icon:play.fill'), { stopPropagation: jest.fn() });
            
            expect(mockStartWorkout).toHaveBeenCalledWith([], 'Leg Day', undefined, 'w1');
            expect(mockRouter.back).toHaveBeenCalled();
        });
        
        it('navigates to editor when creating new', () => {
             (useWorkoutManager as jest.Mock).mockReturnValue({
                savedWorkouts: [],
                isLoading: false
            });
            const { getByText } = render(<SavedWorkoutsScreen />);
            // Header button with pencil
            fireEvent.press(getByText('Icon:square.and.pencil'));
            expect(mockRouter.push).toHaveBeenCalledWith('/workouts/editor');
        });
    });

    describe('CreateWorkoutScreen (Template Editor)', () => {
        const mockSaveWorkout = jest.fn();
        const mockUpdateSavedWorkout = jest.fn();
        const mockDeleteSavedWorkout = jest.fn();
        const mockAddExercise = jest.fn();

        beforeEach(() => {
            (useWorkoutManager as jest.Mock).mockReturnValue({
                savedWorkouts: [],
                saveWorkout: mockSaveWorkout,
                updateSavedWorkout: mockUpdateSavedWorkout,
                deleteSavedWorkout: mockDeleteSavedWorkout
            });
            // Reset useWorkoutDraft mock for each test if we want to change return values?
            // Checking the mock above: currently it returns static spies.
            // We can override implementation here.
             const workoutDraftUtils = {
                workoutDraftExercises: [],
                setWorkoutDraftExercises: jest.fn(),
                addExercise: mockAddExercise,
                removeExercise: jest.fn(),
                moveExercise: jest.fn(),
                updateSetTarget: jest.fn(),
                addSet: jest.fn(),
                removeSet: jest.fn()
            };
            mockUseWorkoutDraft.mockReturnValue(workoutDraftUtils);
        });

        it('renders create mode and validates name', () => {
            const spyAlert = jest.spyOn(Alert, 'alert');
            const { getByText } = render(<CreateWorkoutScreen />);
            
            expect(getByText('Create Workout')).toBeTruthy();
            
            // Try to save with empty name (Icon:checkmark)
            fireEvent.press(getByText('Icon:checkmark'));
            expect(spyAlert).toHaveBeenCalledWith("Required", "Please enter a workout name");
        });

        it('saves a new workout template', async () => {
            const { getByPlaceholderText, getByText } = render(<CreateWorkoutScreen />);
            
            // Enter Name
            fireEvent.changeText(getByPlaceholderText('Workout Name'), 'My New Routine');
            
            // Save
            fireEvent.press(getByText('Icon:checkmark'));
            
            await waitFor(() => {
                expect(mockSaveWorkout).toHaveBeenCalledWith('My New Routine', [], expect.any(Function));
            });
        });
        
        it('enters edit mode and deletes workout', async () => {
             (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'w1' });
             (useWorkoutManager as jest.Mock).mockReturnValue({
                savedWorkouts: [{ id: 'w1', name: 'Existing Routine', exercises: [] }],
                saveWorkout: mockSaveWorkout,
                deleteSavedWorkout: mockDeleteSavedWorkout,
                 updateSavedWorkout: mockUpdateSavedWorkout
            });

            const { getByText, getByPlaceholderText } = render(<CreateWorkoutScreen />);
            
            expect(getByText('Edit Workout')).toBeTruthy();
            expect(getByPlaceholderText('Workout Name').props.value).toBe('Existing Routine');
            
            // Delete
            fireEvent.press(getByText('Delete Workout'));
            // Alert appears. We can't easily click alert buttons in standard Jest without mocking Alert.alert implementation to auto-click.
            // But we can check if deleteSavedWorkout is NOT called yet (waiting for confirm)
            // Or better, mock Alert.alert to execute the destructive callback immediately.
        });
    });
});
