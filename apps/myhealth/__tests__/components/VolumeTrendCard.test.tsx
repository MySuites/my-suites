import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VolumeTrendCard } from '../../components/workouts/VolumeTrendCard';

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

describe('VolumeTrendCard Component (Widget & Modal)', () => {
  const mockHistory = [
    { value: 5000, label: 'Jun 20', date: '2026-06-20' },
    { value: 6000, label: 'Jun 21', date: '2026-06-21' },
  ];

  it('renders widget summary stats correctly on home screen', () => {
    const { getByText, queryByText } = render(
      <VolumeTrendCard
        history={mockHistory}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        rangeAverage={5500}
        rangeTotal={11000}
        workoutCount={2}
      />
    );

    // Widget should display "Workout Volume" and average volume
    expect(getByText('Workout Volume')).toBeTruthy();
    expect(getByText('5,500')).toBeTruthy();
    expect(getByText('Week')).toBeTruthy();

    // Chart overlay / Modal header should NOT be visible initially (modal is visible=false by default)
    expect(queryByText('Volume Trends')).toBeNull();
  });

  it('taps widget to open modal, shows selectors, and taps close button to close it', () => {
    const onRangeChangeMock = jest.fn();
    const { getByText, queryByTestId, queryByText } = render(
      <VolumeTrendCard
        history={mockHistory}
        selectedRange="Week"
        onRangeChange={onRangeChangeMock}
        rangeAverage={5500}
        rangeTotal={11000}
        workoutCount={2}
      />
    );

    // Click the widget to open modal (taps on "Workout Volume")
    fireEvent.press(getByText('Workout Volume'));

    // Now the Modal is open and shows "Volume Trends" title
    expect(getByText('Volume Trends')).toBeTruthy();
    expect(getByText('This Week Avg / Workout')).toBeTruthy();
    expect(getByText('Total: 11,000 lbs (2 workouts)')).toBeTruthy();

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
    expect(queryByText('Volume Trends')).toBeNull();
  });

  it('renders empty workout history state inside modal when opened', () => {
    const { getByText, queryByText } = render(
      <VolumeTrendCard
        history={[]}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        rangeAverage={null}
        rangeTotal={null}
        workoutCount={0}
      />
    );

    // Click the widget to open modal
    fireEvent.press(getByText('Workout Volume'));

    // Now the Modal is open and shows "Volume Trends" and empty history text
    expect(getByText('Volume Trends')).toBeTruthy();
    expect(getByText(/No workout volume data found/)).toBeTruthy();
  });
});
