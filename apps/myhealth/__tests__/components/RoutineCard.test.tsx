import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoutineCard } from '../../components/routines/RoutineCard';

// Mock Card since it might contain complex animations or gestures
jest.mock('../../components/ui/RaisedCard', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    RaisedCard: ({ children, onDelete, onEdit }: any) => (
      <View testID="raised-card">
          {onDelete && <TouchableOpacity testID="card-delete-btn" onPress={onDelete}><Text>Delete</Text></TouchableOpacity>}
          {onEdit && <TouchableOpacity testID="card-edit-btn" onPress={onEdit}><Text>Edit</Text></TouchableOpacity>}
          {children}
      </View>
    ),
  };
});

describe('RoutineCard', () => {
    const mockRoutine = {
        id: 'r1',
        name: 'My Routine',
        sequence: [
            { type: 'workout' },
            { type: 'rest' },
            { type: 'workout' },
        ],
        createdAt: '2024-01-01',
    };

    const mockOnPress = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnEdit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render routine name and stats', () => {
        const { getByText } = render(
            <RoutineCard 
                routine={mockRoutine} 
                onPress={mockOnPress} 
            />
        );

        expect(getByText('My Routine')).toBeTruthy();
        expect(getByText('3 Days • 2 Workouts')).toBeTruthy();
    });

    it('should call onPress when main area is pressed', () => {
        const { getByText } = render(
            <RoutineCard 
                routine={mockRoutine} 
                onPress={mockOnPress} 
            />
        );

        fireEvent.press(getByText('My Routine'));
        expect(mockOnPress).toHaveBeenCalled();
    });

    it('should call onPress when "Set Active" button is pressed', () => {
         const { getByText } = render(
            <RoutineCard 
                routine={mockRoutine} 
                onPress={mockOnPress} 
            />
        );

        fireEvent.press(getByText('Set Active'));
        expect(mockOnPress).toHaveBeenCalled();
    });

    it('should pass onDelete and onEdit to Card', () => {
        const { getByTestId } = render(
            <RoutineCard 
                routine={mockRoutine} 
                onPress={mockOnPress}
                onDelete={mockOnDelete}
                onEdit={mockOnEdit}
            />
        );

        fireEvent.press(getByTestId('card-delete-btn'));
        expect(mockOnDelete).toHaveBeenCalled();

        fireEvent.press(getByTestId('card-edit-btn'));
        expect(mockOnEdit).toHaveBeenCalled();
    });
});
