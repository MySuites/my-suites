import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseCard } from '../../components/exercises/ExerciseCard';
import { Exercise } from '../../providers/WorkoutManagerProvider';
import * as RN from 'react-native';

const mockRN = RN;

// Mock Card
// Local mock for UI to ensure proper text rendering
jest.mock('@mysuite/ui', () => {
    return {
        RaisedCard: (props: any) => { 
            return <mockRN.TouchableOpacity {...props} />;
        },
        HollowedCard: (props: any) => {
            return <mockRN.TouchableOpacity {...props} />;
        },

        IconSymbol: () => null,
        useUITheme: () => ({ primary: 'blue', text: 'black', textMuted: 'gray', danger: 'red', bg: 'white' }),
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
            showDistance: false
        }),
    };
});


describe('ExerciseCard', () => {
    const mockExercise: Exercise = {
        id: 'e1',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        completedSets: 1,
        logs: [],
        properties: ['Weight', 'Reps']
    };

    const mockTheme = { primary: 'blue' };
    const mockOnAddSet = jest.fn();
    const mockOnDeleteSet = jest.fn();
    const mockOnCompleteSet = jest.fn();

    const defaultProps = {
        exercise: mockExercise,
        isCurrent: true,
        onCompleteSet: mockOnCompleteSet,
        onUpdateSetTarget: jest.fn(),
        onAddSet: mockOnAddSet,
        onDeleteSet: mockOnDeleteSet,
        onRemoveExercise: jest.fn(),
        theme: mockTheme,
    };

    it('should render exercise name and finish status', () => {
        const { getByText } = render(<ExerciseCard {...defaultProps} />);
        expect(getByText(/Bench Press/)).toBeTruthy();
    });

    it('should render correct number of SetRows', () => {
        const { getByTestId } = render(<ExerciseCard {...defaultProps} />);
        expect(getByTestId('set-row-0')).toBeTruthy();
        expect(getByTestId('set-row-1')).toBeTruthy();
        expect(getByTestId('set-row-2')).toBeTruthy();
    });

    it('should render Add Set button and call onAddSet', () => {
        // List mode (default props, no horizontalSets) moved Add Set into the
        // "..." menu, whose open button relies on ref.measure() - not mocked
        // here. Pager mode (horizontalSets=true) still has the standalone
        // footer button this test exercises.
        const { getByText } = render(<ExerciseCard {...defaultProps} horizontalSets={true} />);
        const addSetBtn = getByText(/Add Set/i);
        fireEvent.press(addSetBtn);
        expect(mockOnAddSet).toHaveBeenCalled();
    });

    it('should call onCompleteSet with correct set index', () => {
        const { getByTestId } = render(<ExerciseCard {...defaultProps} />);
        // Simulate completing the second set (index 1)
        const setRow1 = getByTestId('set-row-1');
        fireEvent.press(setRow1);
        
        // Expect onCompleteSet to be called with (index)
        expect(mockOnCompleteSet).toHaveBeenCalledWith(1);
    });

    it('should render equipment tag by resolving name if not set', () => {
        const dumbbellExercise = {
            ...mockExercise,
            name: 'Dumbbell Curl',
        };
        const { getByText } = render(<ExerciseCard {...defaultProps} exercise={dumbbellExercise} />);
        expect(getByText(/\(Dumbbell\)/)).toBeTruthy();
    });

    it('should render horizontal sets indicator and delete set button when horizontalSets is true', () => {
        const { queryByText, getByText } = render(<ExerciseCard {...defaultProps} horizontalSets={true} />);
        // Delete Set button is only displayed for horizontal pagination layout
        expect(getByText('Delete Set')).toBeTruthy();
    });
});
