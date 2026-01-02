import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActiveRoutineCard } from '../../components/routines/ActiveRoutineCard';
import * as RN from 'react-native';

const mockRN = RN;

// Mocks
const mockOnClearRoutine = jest.fn();
const mockOnStartWorkout = jest.fn();
const mockOnJumpToDay = jest.fn();
const mockOnMenuPress = jest.fn();

jest.mock('@mysuite/ui', () => {
    return {
        RaisedCard: ({ children }: any) => <mockRN.View testID="raised-card">{children}</mockRN.View>,
        RaisedButton: ({ onPress, children, title, ...props }: any) => (
            <mockRN.TouchableOpacity onPress={onPress} {...props}>
                {title ? <mockRN.Text>{title}</mockRN.Text> : children}
            </mockRN.TouchableOpacity>
        ),
        IconSymbol: ({ name }: any) => <mockRN.Text>{name}</mockRN.Text>,
        useUITheme: () => ({ primary: 'blue' }),
    };
});

jest.mock('../../components/ui/SegmentedControl', () => ({
    SegmentedControl: () => null
}));

jest.mock('../../components/routines/ActiveRoutineTimelineItem', () => ({
    ActiveRoutineTimelineItem: ({ item }: any) => {
        return <mockRN.Text>Day: {item.name}</mockRN.Text>;
    }
}));

describe('ActiveRoutineCard', () => {
    const mockRoutine = { id: 'r1', name: 'My Routine', sequence: [{}, {}, {}] };
    const mockTimeline = [{ name: 'Day 1' }, { name: 'Day 2' }];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders routine name and timeline', () => {
        const { getByText, getAllByText } = render(
            <ActiveRoutineCard
                activeRoutineObj={mockRoutine}
                timelineDays={mockTimeline}
                dayIndex={0}
                isDayCompleted={false}
                onClearRoutine={mockOnClearRoutine}
                onStartWorkout={mockOnStartWorkout}
                onJumpToDay={mockOnJumpToDay}
                onMenuPress={mockOnMenuPress}
            />
        );

        expect(getByText('My Routine')).toBeTruthy();
        expect(getByText('stop.fill')).toBeTruthy();
        expect(getAllByText(/Day:/).length).toBe(2);
    });

    it('handles interaction events', () => {
        const { getByText } = render(
            <ActiveRoutineCard
                activeRoutineObj={mockRoutine}
                timelineDays={mockTimeline}
                dayIndex={0}
                isDayCompleted={false}
                onClearRoutine={mockOnClearRoutine}
                onStartWorkout={mockOnStartWorkout}
                onJumpToDay={mockOnJumpToDay}
                onMenuPress={mockOnMenuPress}
            />
        );

        fireEvent.press(getByText('stop.fill'));
        expect(mockOnClearRoutine).toHaveBeenCalled();

        fireEvent.press(getByText('stop.fill'));
        expect(mockOnClearRoutine).toHaveBeenCalled();

        fireEvent.press(getByText('line.3.horizontal'));
        expect(mockOnMenuPress).toHaveBeenCalled();
    });

});
