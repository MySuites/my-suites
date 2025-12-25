import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseCard } from '../../components/exercises/ExerciseCard';
import { Exercise } from '../../hooks/workouts/useWorkoutManager';

// Mock Card
jest.mock('../../components/ui/RaisedCard', () => ({
  RaisedCard: ({ children }: any) => <>{children}</>,
}));

// Mock IconSymbol
jest.mock('../../components/ui/icon-symbol', () => ({
    IconSymbol: () => null
}));

// Mock SetRow
jest.mock('../../components/workouts/SetRow', () => {
    const { TouchableOpacity } = require('react-native');
    
    // Copy of helper function for mock
    const getExerciseFields = (properties?: string[]) => {
        const props = properties || [];
        const lowerProps = props.map(p => p.toLowerCase());
        return { 
            showBodyweight: lowerProps.includes('bodyweight'),
            showWeight: lowerProps.includes('weighted'),
            showReps: lowerProps.includes('reps'),
            showDuration: lowerProps.includes('duration'),
            showDistance: lowerProps.includes('distance')
        };
    };

    return {
        SetRow: ({ index, onCompleteSet }: any) => (
            <TouchableOpacity 
                testID={`set-row-${index}`} 
                onPress={() => onCompleteSet({ weight: "100", reps: "10" })}
            >
                <></>
            </TouchableOpacity>
        ),
        getExerciseFields,
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
        onUncompleteSet: jest.fn(),
        onUpdateSetTarget: jest.fn(),
        onUpdateLog: jest.fn(),
        onAddSet: mockOnAddSet,
        onDeleteSet: mockOnDeleteSet,
        restSeconds: 0,
        theme: mockTheme,
    };

    it('should render exercise name and finish status', () => {
        const { getByText } = render(<ExerciseCard {...defaultProps} />);
        expect(getByText('Bench Press')).toBeTruthy();
    });

    it('should render correct number of SetRows', () => {
        const { getByTestId } = render(<ExerciseCard {...defaultProps} />);
        expect(getByTestId('set-row-0')).toBeTruthy();
        expect(getByTestId('set-row-1')).toBeTruthy();
        expect(getByTestId('set-row-2')).toBeTruthy();
    });

    it('should render Add Set button and call onAddSet', () => {
        const { getByText } = render(<ExerciseCard {...defaultProps} />);
        const addSetBtn = getByText('Add Set');
        fireEvent.press(addSetBtn);
        expect(mockOnAddSet).toHaveBeenCalled();
    });

    it('should show rest timer if isCurrent and restSeconds > 0', () => {
        const { getByText } = render(<ExerciseCard {...defaultProps} restSeconds={60} />);
        // 60s -> "01:00"
        expect(getByText('01:00')).toBeTruthy();
    });

    it('should NOT show rest timer if not current', () => {
        const { queryByText } = render(<ExerciseCard {...defaultProps} isCurrent={false} restSeconds={60} />);
        expect(queryByText('01:00')).toBeNull();
    });

    it('should call onCompleteSet with correct set index', () => {
        const { getByTestId } = render(<ExerciseCard {...defaultProps} />);
        // Simulate completing the second set (index 1)
        const setRow1 = getByTestId('set-row-1');
        fireEvent.press(setRow1);
        
        // Expect onCompleteSet to be called with (index, input)
        expect(mockOnCompleteSet).toHaveBeenCalledWith(1, { weight: "100", reps: "10" });
    });
});
