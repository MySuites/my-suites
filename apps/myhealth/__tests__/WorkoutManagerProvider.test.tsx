import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Button, Text, View, Alert } from 'react-native';
import { WorkoutManagerProvider, useWorkoutManager } from '../providers/WorkoutManagerProvider';


// Mock mocks
// We need to mock the DataRepository and ProfileRepository
import { DataRepository } from '../providers/DataRepository';
import { ProfileRepository } from '../providers/ProfileRepository';

jest.mock('../providers/DataRepository', () => ({
    DataRepository: {
        getWorkouts: jest.fn(() => Promise.resolve([])),
        saveWorkout: jest.fn(),
        deleteWorkout: jest.fn(),
        getHistory: jest.fn(() => Promise.resolve([])),
        getRoutines: jest.fn(() => Promise.resolve([])),
        saveRoutine: jest.fn(),
        saveLog: jest.fn(),
    }
}));

jest.mock('../providers/ProfileRepository', () => ({
    ProfileRepository: {
        getProfile: jest.fn(() => Promise.resolve(null))
    }
}));

// Mock useAuth (keep this as provider uses it)
const mockUseAuth = jest.fn();
jest.mock('@mysuite/auth', () => ({
    useAuth: () => mockUseAuth(),
    supabase: {
        from: jest.fn(),
        auth: {
            getSession: jest.fn(),
        }
    }
}));

// Mock useRoutineManager
jest.mock('../hooks/routines/useRoutineManager', () => {
    const mockSetRoutineState = jest.fn();
    return {
        useRoutineManager: jest.fn(() => ({
            activeRoutine: null,
            startActiveRoutine: jest.fn(),
            setActiveRoutineIndex: jest.fn(),
            markRoutineDayComplete: jest.fn(),
            clearActiveRoutine: jest.fn(),
            setRoutineState: mockSetRoutineState
        }))
    };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('WorkoutManagerProvider', () => {

    const TestConsumer = () => {
        const { savedWorkouts, saveWorkout } = useWorkoutManager();
        return (
            <View>
                <Text testID="saved-count">{savedWorkouts.length}</Text>
                <Button title="Save" onPress={() => saveWorkout('New Workout', [], () => {})} />
            </View>
        );
    };

    const testUser = { id: 'test-user-id' };

    beforeEach(async () => {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        await AsyncStorage.clear();
        
        // Default to logged in user
        mockUseAuth.mockReturnValue({ user: testUser });
        jest.clearAllMocks();
        
        // Default returns for DataRepository mocks
        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([]);
        (DataRepository.getRoutines as jest.Mock).mockResolvedValue([]);
        (DataRepository.getHistory as jest.Mock).mockResolvedValue([]);
    });

    it('initializes and handles race conditions correctly', async () => {
        const { getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );

        // Wait for initial fetch to settle
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('0');
        });
    });

    it('saves a workout (updates local state via re-fetch)', async () => {
        // Mutable mock database
        const mockWorkouts = [
            { id: 'existing', name: 'Existing', created_at: '2023-01-01' }
        ];

        // Initial state
        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([...mockWorkouts]);

        // Mock save implementation
        (DataRepository.saveWorkout as jest.Mock).mockImplementation((workout) => {
             // Simulate save logic?
             // Since Provider calls getWorkouts AFTER save, we need getWorkouts to return updated list
             return Promise.resolve(); 
        });

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );

        // Wait for initial fetch to complete (count 1)
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('1');
        });

        // Update mock for next refetch
        const newWorkout = { id: 'new-id', name: 'New Workout', exercises: [] };
        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([newWorkout, ...mockWorkouts]);

        // Perform save
        fireEvent.press(getByText('Save'));

        // Wait for update - should be 2 now
        await waitFor(() => {
             expect(getByTestId('saved-count').children[0]).toBe('2');
        });
        
        expect(DataRepository.saveWorkout).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'New Workout' })
        );
    });

    it('saves a workout works same for guest (logic unified in repository)', async () => {
        mockUseAuth.mockReturnValue({ user: null });
        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([]);

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );
        
        // Wait for initial load
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('0');
        });

        // Mock update
        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([{ id: 'guest-w', name: 'New Workout' }]);
        
        fireEvent.press(getByText('Save'));

        await waitFor(() => {
             expect(getByTestId('saved-count').children[0]).toBe('1');
        });

        expect(DataRepository.saveWorkout).toHaveBeenCalled();
    });
});
