import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActiveWorkoutProvider, useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { ActiveWorkoutOverlay } from '../../components/workouts/ActiveWorkoutOverlay';
import * as RN from 'react-native';

const mockRN = RN;

// Mock Expo Router
const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
};
jest.mock('expo-router', () => ({
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({}),
    router: mockRouter,
}));

// Mock @mysuite/ui
jest.mock('@mysuite/ui', () => {
    return {
        RaisedCard: (props: any) => { 
            return <mockRN.TouchableOpacity {...props} />;
        },
        HollowedCard: (props: any) => {
            return <mockRN.TouchableOpacity {...props} />;
        },
        IconSymbol: ({ name }: any) => <mockRN.Text testID={`icon-${name}`}>{name}</mockRN.Text>,
        useUITheme: () => ({ primary: 'blue', text: 'black', textMuted: 'gray', danger: 'red', bg: 'white' }),
    };
});

// Mock react-native-draggable-flatlist
jest.mock('react-native-draggable-flatlist', () => {
    const MockList = (props: any) => {
        const renderItemWrapper = ({ item, index }: any) => {
            return props.renderItem({
                item,
                index,
                drag: () => {},
                isActive: false,
                getIndex: () => index,
            });
        };
        return (
            <mockRN.View testID="draggable-list">
                <mockRN.FlatList 
                    {...props} 
                    renderItem={renderItemWrapper}
                />
            </mockRN.View>
        );
    };
    const ScaleDecorator = ({ children }: any) => <>{children}</>;
    ScaleDecorator.displayName = 'ScaleDecorator';
    return {
        __esModule: true,
        default: MockList,
        ScaleDecorator: ScaleDecorator,
        RenderItemParams: {},
    };
});

// Mock SetRow
jest.mock('../../components/workouts/SetRow', () => {
    return {
        SetRow: ({ index, onCompleteSet }: any) => (
            <mockRN.TouchableOpacity 
                testID={`set-row-${index}`} 
                onPress={() => onCompleteSet({ weight: "100", reps: "10" })}
            >
                <></>
            </mockRN.TouchableOpacity>
        ),
        getExerciseFields: () => ({
            showBodyweight: false,
            showWeight: true,
            showReps: true,
            showDuration: false,
            showDistance: false,
            showRPE: false
        }),
    };
});

// Mock other providers/hooks
jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => ({
        saveCompletedWorkout: jest.fn(),
        createCustomExercise: jest.fn(),
        isRpeEnabled: false,
    }),
    fetchLastExercisePerformance: jest.fn(() => Promise.resolve({ data: null })),
}));

jest.mock('../../hooks/workouts/useActiveWorkoutPersistence', () => ({
    useActiveWorkoutPersistence: () => ({
        clearPersistence: jest.fn(),
        isLoaded: true,
    })
}));

// Helper to start session in tests
const TestDriver = () => {
    const { startWorkout, addExercise } = useActiveWorkout();
    return (
        <mockRN.View>
            <mockRN.TouchableOpacity 
                testID="start-workout-btn"
                onPress={() => {
                    startWorkout([], 'Test Workout');
                    // Add dummy exercises to toggle to focused screen
                    addExercise('Bench Press', '3', '10');
                    addExercise('Squat', '3', '10');
                }}
            />
        </mockRN.View>
    );
};

describe('ActiveWorkoutOverlay and Screen Toggling', () => {
    it('toggles view state between Detail view and Focused view', async () => {
        const { queryByTestId, getByTestId, queryByText, getByText } = render(
            <ActiveWorkoutProvider>
                <mockRN.View style={{ flex: 1 }}>
                    <TestDriver />
                    <ActiveWorkoutOverlay />
                </mockRN.View>
            </ActiveWorkoutProvider>
        );

        // 1. Initially overlay is null (no active workout)
        expect(queryByTestId('draggable-list')).toBeNull();

        // 2. Start workout
        fireEvent.press(getByTestId('start-workout-btn'));

        // 3. Confirm active screen is active by default (no draggable list)
        expect(queryByTestId('draggable-list')).toBeNull();
        expect(queryByText(/Bench Press/)).toBeTruthy();

        // 4. Toggle to Detail screen using toggle-detail-btn (list icon)
        const toggleBtn = getByTestId('toggle-detail-btn');
        fireEvent.press(toggleBtn);

        // 5. In Detail view, the draggable checklist is visible
        expect(getByTestId('draggable-list')).toBeTruthy();

        // 6. Toggle back to Active view using toggle-focused-btn (lightning bolt / button)
        const backToFocusedBtn = getByTestId('toggle-focused-btn');
        fireEvent.press(backToFocusedBtn);

        // 7. Draggable checklist is hidden again
        expect(queryByTestId('draggable-list')).toBeNull();
    });
});
