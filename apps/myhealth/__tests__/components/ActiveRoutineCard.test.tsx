import React from 'react';
import { render } from '@testing-library/react-native';
import { ActiveRoutineCard } from '../../components/routines/ActiveRoutineCard';
import * as RN from 'react-native';

const mockRN = RN;

// Mocks
const mockOnStartWorkout = jest.fn();
const mockOnJumpToDay = jest.fn();
const mockOnMenuPress = jest.fn();

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

    it('renders timeline items', () => {
        const { getAllByText } = render(
            <ActiveRoutineCard
                activeRoutineObj={mockRoutine}
                timelineDays={mockTimeline}
                dayIndex={0}
                isDayCompleted={false}
                onStartWorkout={mockOnStartWorkout}
                onJumpToDay={mockOnJumpToDay}
                onMenuPress={mockOnMenuPress}
            />
        );

        expect(getAllByText(/Day:/).length).toBe(2);
    });
});
