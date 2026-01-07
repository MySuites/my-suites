import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EndWorkoutScreen from '../../app/workouts/end';
import * as RN from 'react-native';

const mockRN = RN;
const { Alert } = RN;

// Mocks
const mockFinishWorkout = jest.fn();
const mockCancelWorkout = jest.fn();
const mockUpdateSavedWorkout = jest.fn();
const mockSaveWorkout = jest.fn();
const mockRouterDismiss = jest.fn();

// Values we can mutate in tests
let mockActiveWorkoutState: any = {};
let mockWorkoutManagerState: any = {};

jest.mock('expo-router', () => ({
    useRouter: () => ({ dismiss: mockRouterDismiss }),
}));

jest.mock('../../providers/ActiveWorkoutProvider', () => ({
    useActiveWorkout: () => mockActiveWorkoutState
}));

jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => mockWorkoutManagerState
}));

jest.mock('@mysuite/ui', () => {
    const MockIcon = (props: any) => <mockRN.View {...props} testID="icon-symbol" />;
    return {

        useUITheme: () => ({ primary: 'blue', textMuted: 'gray', danger: 'red', bg: 'white' }),
        IconSymbol: () => null,
        RaisedCard: (props: any) => { 
            const { TouchableOpacity } = require('react-native');
            return <TouchableOpacity {...props} />;
        },
    };
});

jest.mock('../../components/ui/BackButton', () => ({
    BackButton: () => <mockRN.Text>Back</mockRN.Text>
}));

jest.mock('../../components/workouts/WorkoutNamePrompt', () => {
    // Simple mock that calls onSave immediately for testing if signaled
    return {
        WorkoutNamePrompt: ({ visible, onSave, onClose }: any) => visible ? (
            <mockRN.View testID="name-prompt">
                <mockRN.Button title="Save Prompt" onPress={() => onSave("New Template Name")} />
                <mockRN.Button title="Cancel Prompt" onPress={onClose} />
            </mockRN.View>
        ) : null
    }
});

describe('End Workout Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default Mock State
        mockActiveWorkoutState = {
            workoutName: "Test Workout",
            workoutSeconds: 3661, // 1h 1m 1s
            exercises: [
                { id: '1', name: 'Push Ups', completedSets: 3, sets: 3, reps: 10 },
                { id: '2', name: 'Squats', completedSets: 2, sets: 3, reps: 10 } // 5 total sets, 2 exercises
            ],
            finishWorkout: mockFinishWorkout,
            cancelWorkout: mockCancelWorkout,
            sourceWorkoutId: null,
        };

        mockWorkoutManagerState = {
            savedWorkouts: [],
            updateSavedWorkout: mockUpdateSavedWorkout,
            saveWorkout: mockSaveWorkout,
        };

        // Spy on Alert
        jest.spyOn(Alert, 'alert');
    });

    it('renders workout summary correctly', () => {
        const { getByText } = render(<EndWorkoutScreen />);
        
        // Time formatting check (3661s = 1h 1m 1s)
        expect(getByText('1h 1m 1s')).toBeTruthy();
        // Stats
        expect(getByText('5')).toBeTruthy(); // Total Sets
        expect(getByText('2')).toBeTruthy(); // Total Exercises (filtered > 0)
        
        // Exercise list
        expect(getByText('Push Ups')).toBeTruthy();
        expect(getByText('3 / 3 sets')).toBeTruthy();
    });

    it('can discard workout', () => {
        const { getByText } = render(<EndWorkoutScreen />);
        fireEvent.press(getByText('Discard Workout'));
        
        expect(mockCancelWorkout).toHaveBeenCalled();
        expect(mockRouterDismiss).toHaveBeenCalled();
    });

    it('saves history immediately if no template source and user chooses "History Only"', () => {
        const { getByTestId } = render(<EndWorkoutScreen />);
        
        const saveButton = getByTestId('save-workout-btn');
        
        fireEvent.press(saveButton);

        // Alert should appear because totalExercises > 0 and sourceWorkoutId is null
        expect(Alert.alert).toHaveBeenCalledWith(
            "Save as Template?",
            expect.any(String),
            expect.any(Array)
        );

        // Simulate choosing "History Only" (index 0)
        const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
        const buttons = alertCall[2];
        const historyAction = buttons.find((b: any) => b.text === 'History Only');
        
        act(() => {
            historyAction.onPress();
        });

        expect(mockFinishWorkout).toHaveBeenCalled();
        expect(mockSaveWorkout).not.toHaveBeenCalled();
        expect(mockRouterDismiss).toHaveBeenCalled();
    });

    it('prompts and saves as new template if user chooses to', async () => {
        const { getByTestId, getByText } = render(<EndWorkoutScreen />);
        const saveButton = getByTestId('save-workout-btn');
        fireEvent.press(saveButton);

        const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
        const buttons = alertCall[2];
        const templateAction = buttons.find((b: any) => b.text === 'Save as Template');
        
        act(() => {
            templateAction.onPress();
        });

        // Prompt shows up
        await waitFor(() => expect(getByTestId('name-prompt')).toBeTruthy());
        
        // Save prompt
        fireEvent.press(getByText('Save Prompt'));

        await waitFor(() => {
            expect(mockSaveWorkout).toHaveBeenCalledWith(
                "New Template Name", 
                expect.any(Array), // The strict exercises with 0 sets
                expect.any(Function)
            );
            expect(mockFinishWorkout).toHaveBeenCalled();
            expect(mockRouterDismiss).toHaveBeenCalled();
        });
    });

    it('prompts to update template if source exists and changes detected', async () => {
        // Setup state: Source exists, and we changed something (e.g. added an exercise or sets differ)
        // Original: Push Ups x3
        // Current: Push Ups x3, Squats x2 (So it is different)
        mockActiveWorkoutState.sourceWorkoutId = 'source-id';
        mockWorkoutManagerState.savedWorkouts = [{
            id: 'source-id',
            name: 'Original Routine',
            exercises: [
                { id: '1', name: 'Push Ups', sets: 3, reps: 10, completedSets: 0 }
            ]
        }];
        // Current exercises has Squats, so it IS different.

        const { getByTestId } = render(<EndWorkoutScreen />);
        const saveButton = getByTestId('save-workout-btn');
        fireEvent.press(saveButton);

        expect(Alert.alert).toHaveBeenCalledWith(
            "Update Template?",
            expect.any(String),
            expect.any(Array)
        );

        // Click Yes
        const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
        const buttons = alertCall[2];
        const updateAction = buttons.find((b: any) => b.text === 'Yes, Update Template');
        
        await act(async () => {
            await updateAction.onPress();
        });

        expect(mockUpdateSavedWorkout).toHaveBeenCalledWith(
            'source-id',
            'Original Routine',
            expect.any(Array),
            expect.any(Function)
        );
        expect(mockFinishWorkout).toHaveBeenCalled();
    });
});
