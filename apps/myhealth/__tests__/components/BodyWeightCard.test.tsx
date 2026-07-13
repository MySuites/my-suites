import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BodyWeightCard } from '../../components/bodyweight/BodyWeightCard';

// Mock BodyWeightChart to avoid canvas/library rendering issues
jest.mock('../../components/bodyweight/BodyWeightChart', () => ({
  BodyWeightChart: () => null,
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

describe('BodyWeightCard Component (Widget & Modal)', () => {
  const mockHistory = [
    { value: 172.5, label: 'Jun 20', date: '2026-06-20' },
    { value: 173.5, label: 'Jun 21', date: '2026-06-21' },
  ];

  it('renders widget stats correctly on home screen', () => {
    const { getByText, queryByText, queryByTestId } = render(
      <BodyWeightCard
        weight={173.0}
        history={mockHistory}
        onLogWeight={jest.fn()}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        rangeAverage={173.0}
      />
    );

    // Widget layout assertions
    expect(getByText('Body Weight')).toBeTruthy();
    expect(getByText('173')).toBeTruthy(); // weight format
    expect(getByText('Week')).toBeTruthy();
    
    // Quick log button exists
    expect(queryByTestId('quick-log-weight-btn')).toBeTruthy();

    // Modal should NOT be visible initially
    expect(queryByText('Body Weight Trends')).toBeNull();
  });

  it('triggers onLogWeight when quick log button is pressed', () => {
    const onLogWeightMock = jest.fn();
    const { getByTestId } = render(
      <BodyWeightCard
        weight={173.0}
        history={mockHistory}
        onLogWeight={onLogWeightMock}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        rangeAverage={173.0}
      />
    );

    // Tap quick log button
    fireEvent.press(getByTestId('quick-log-weight-btn'));
    expect(onLogWeightMock).toHaveBeenCalled();
  });

  it('taps widget to open modal, triggers range updates, and close modal', () => {
    const onRangeChangeMock = jest.fn();
    const onLogWeightMock = jest.fn();
    const { getByText, getByTestId, queryByTestId, queryByText, getAllByText } = render(
      <BodyWeightCard
        weight={173.0}
        history={mockHistory}
        onLogWeight={onLogWeightMock}
        selectedRange="Week"
        onRangeChange={onRangeChangeMock}
        rangeAverage={173.0}
      />
    );

    // Tap widget to open modal
    fireEvent.press(getByTestId('bodyweight-widget-btn'));

    // Now the Modal is open
    expect(getByText('Body Weight Trends')).toBeTruthy();
    expect(getAllByText('173')).toHaveLength(2); // one in widget, one in modal
    expect(getByText('Week Average')).toBeTruthy();

    // Test SegmentedControl in the Modal triggers range change (e.g. Month)
    fireEvent.press(getByText('M'));
    expect(onRangeChangeMock).toHaveBeenCalledWith('Month');

    // Tap the plus button in the modal to log weight — this should also
    // close the chart modal itself, since having two <Modal>s visible at
    // once is unreliable in RN and previously left the screen touch-frozen
    // after closing the top one.
    fireEvent.press(getByTestId('modal-log-weight-btn'));
    expect(onLogWeightMock).toHaveBeenCalled();
    expect(queryByText('Body Weight Trends')).toBeNull();
  });

  it('closes the chart modal via its own close button', () => {
    const { getByTestId, getByText, queryByText } = render(
      <BodyWeightCard
        weight={173.0}
        history={mockHistory}
        onLogWeight={jest.fn()}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        rangeAverage={173.0}
      />
    );

    fireEvent.press(getByTestId('bodyweight-widget-btn'));
    expect(getByText('Body Weight Trends')).toBeTruthy();

    fireEvent.press(getByTestId('close-modal-btn'));
    expect(queryByText('Body Weight Trends')).toBeNull();
  });

  it('renders empty weight history state inside modal when opened', () => {
    const { getByTestId, getByText } = render(
      <BodyWeightCard
        weight={null}
        history={[]}
        onLogWeight={jest.fn()}
        selectedRange="Week"
        onRangeChange={jest.fn()}
        rangeAverage={null}
      />
    );

    // Tap widget to open modal
    fireEvent.press(getByTestId('bodyweight-widget-btn'));

    // Displays empty weight metrics text
    expect(getByText(/No weight metrics found/)).toBeTruthy();
  });
});
