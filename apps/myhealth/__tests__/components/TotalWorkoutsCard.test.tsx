import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TotalWorkoutsCard } from '../../components/workouts/TotalWorkoutsCard';

// Mock TimeSeriesChart to avoid canvas/library rendering issues
jest.mock('../../components/ui/TimeSeriesChart', () => ({
  TimeSeriesChart: () => null,
}));

// Mock @mysuite/ui locally to forward props for RaisedCard and HollowedCard
jest.mock('@mysuite/ui', () => ({
  useUITheme: () => ({
    primary: 'blue',
    textMuted: 'gray',
    icon: 'gray',
    background: 'white',
    bgLight: 'lightgray',
  }),
  RaisedCard: ({ children, ...props }: any) => {
    const React = require('react');
    const RN = require('react-native');
    return <RN.TouchableOpacity {...props}>{children}</RN.TouchableOpacity>;
  },
  HollowedCard: ({ children, ...props }: any) => {
    const React = require('react');
    const RN = require('react-native');
    return <RN.View {...props}>{children}</RN.View>;
  },
  IconSymbol: () => null,
}));

describe('TotalWorkoutsCard Component (Widget & Modal)', () => {
  const mockHistory = [
    { value: 1, label: 'Jun 20', date: '2026-06-20' },
    { value: 1, label: 'Jun 21', date: '2026-06-21' },
  ];

  it('renders widget summary stats correctly on home screen', () => {
    const { getByText, queryByText } = render(
      <TotalWorkoutsCard
        history={mockHistory}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        workoutCount={2}
      />
    );

    // Widget should display "Total Workouts" and counts
    expect(getByText('Total Workouts')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Week')).toBeTruthy();

    // Chart overlay / Modal header should NOT be visible initially
    expect(queryByText('Workout Frequency')).toBeNull();
  });

  it('taps widget to open modal, shows selectors, and taps close button to close it', () => {
    const onRangeChangeMock = jest.fn();
    const { getByText, queryByTestId, queryByText, getAllByText } = render(
      <TotalWorkoutsCard
        history={mockHistory}
        selectedRange="Week"
        onRangeChange={onRangeChangeMock}
        workoutCount={2}
      />
    );

    // Click the widget to open modal (taps on "Total Workouts")
    fireEvent.press(getByText('Total Workouts'));

    // Now the Modal is open and shows "Workout Frequency" title
    expect(getByText('Workout Frequency')).toBeTruthy();
    expect(getAllByText('2')).toHaveLength(2);
    expect(getByText('This Week Total')).toBeTruthy();

    // Test SegmentedControl in the Modal triggers range change
    fireEvent.press(getByText('M'));
    expect(onRangeChangeMock).toHaveBeenCalledWith('Month');

    // Tap on the close button to dismiss the modal (X icon via testID)
    const closeBtn = queryByTestId('close-modal-btn');
    expect(closeBtn).toBeTruthy();
    
    if (closeBtn) {
        fireEvent.press(closeBtn);
    }

    // Now the Modal should be closed again
    expect(queryByText('Workout Frequency')).toBeNull();
  });

  it('renders empty workout history state inside modal when opened', () => {
    const { getByText, queryByText } = render(
      <TotalWorkoutsCard
        history={[]}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        workoutCount={0}
      />
    );

    // Click the widget to open modal
    fireEvent.press(getByText('Total Workouts'));

    // Now the Modal is open and shows "Workout Frequency" and empty history text
    expect(getByText('Workout Frequency')).toBeTruthy();
    expect(getByText(/No workout data found/)).toBeTruthy();
  });
});
