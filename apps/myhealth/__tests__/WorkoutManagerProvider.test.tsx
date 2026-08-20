import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Button, Text, View, Alert } from 'react-native';
import { WorkoutManagerProvider, useWorkoutManager } from '../providers/WorkoutManagerProvider';


// Mock mocks
// We need to mock the DataRepository
import { DataRepository } from '../providers/DataRepository';

jest.mock('../providers/DataRepository', () => ({
    DataRepository: {
        getWorkouts: jest.fn(() => Promise.resolve([])),
        saveWorkout: jest.fn(),
        deleteWorkout: jest.fn(),
        getHistory: jest.fn(() => Promise.resolve([])),
        saveLog: jest.fn(),
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

    it('updateSavedWorkout merges completed exercise targets back to the saved template', async () => {
        const sourceWorkoutId = 'source-workout-123';
        const initialWorkoutTemplate = {
            id: sourceWorkoutId,
            name: 'Template Workout',
            exercises: [
                {
                    id: 'ex-1',
                    name: 'Bicep Curl',
                    sets: 3,
                    reps: 10,
                    setTargets: [
                        { reps: 10, weight: 20 },
                        { reps: 10, weight: 20 },
                        { reps: 10, weight: 20 }
                    ]
                }
            ]
        };

        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([initialWorkoutTemplate]);

        const TestConsumerWithComplete = () => {
            const { updateSavedWorkout, savedWorkouts } = useWorkoutManager();
            const triggerComplete = () => {
                const completedExercises = [
                    {
                        id: 'ex-1',
                        name: 'Bicep Curl',
                        sets: 3,
                        reps: 10,
                        completedSets: 2,
                        logs: [
                            { reps: 12, weight: 25 },
                            { reps: 12, weight: 25 }
                        ]
                    }
                ];
                updateSavedWorkout(sourceWorkoutId, 'Template Workout', completedExercises as any, () => {});
            };
            return (
                <View>
                    <Text testID="saved-count">{savedWorkouts.length}</Text>
                    <Button title="Complete" onPress={triggerComplete} />
                </View>
            );
        };

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumerWithComplete />
            </WorkoutManagerProvider>
        );

        // Wait for initial load
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('1');
        });

        // Mock saving log and returning updated workouts
        (DataRepository.saveWorkout as jest.Mock).mockImplementation(() => Promise.resolve());
        
        // Execute updateSavedWorkout
        fireEvent.press(getByText('Complete'));

        await waitFor(() => {
            expect(DataRepository.saveWorkout).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: sourceWorkoutId,
                    exercises: [
                        expect.objectContaining({
                            id: 'ex-1',
                            sets: 3,
                            reps: 12,
                            setTargets: [
                                { reps: 12, weight: 25, reps_left: undefined, reps_right: undefined, duration: undefined, distance: undefined, rpe: undefined },
                                { reps: 12, weight: 25, reps_left: undefined, reps_right: undefined, duration: undefined, distance: undefined, rpe: undefined },
                                { reps: 10, weight: 20 }
                            ]
                        })
                    ]
                })
            );
        });
    });

    it('updateSavedWorkout with valuesOnly=true preserves original set count in template', async () => {
        const sourceWorkoutId = 'source-workout-456';
        const initialWorkoutTemplate = {
            id: sourceWorkoutId,
            name: 'Template Workout',
            exercises: [
                {
                    id: 'ex-1',
                    name: 'Bicep Curl',
                    sets: 3,
                    reps: 10,
                    setTargets: [
                        { reps: 10, weight: 20 },
                        { reps: 10, weight: 20 },
                        { reps: 10, weight: 20 }
                    ]
                }
            ]
        };

        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([initialWorkoutTemplate]);

        const TestConsumerValuesOnly = () => {
            const { updateSavedWorkout, savedWorkouts } = useWorkoutManager();
            const triggerValuesOnly = () => {
                // Active workout had 2 sets and 1 completed, but we pass valuesOnly=true
                const activeExercises = [
                    {
                        id: 'ex-1',
                        name: 'Bicep Curl',
                        sets: 2, // Structural change: reduced from 3
                        reps: 10,
                        completedSets: 1,
                        logs: [
                            { reps: 15, weight: 30 } // Only set 1 was completed
                        ]
                    }
                ];
                updateSavedWorkout(sourceWorkoutId, 'Template Workout', activeExercises as any, () => {}, true);
            };
            return (
                <View>
                    <Text testID="saved-count">{savedWorkouts.length}</Text>
                    <Button title="ValuesOnly" onPress={triggerValuesOnly} />
                </View>
            );
        };

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumerValuesOnly />
            </WorkoutManagerProvider>
        );

        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('1');
        });

        (DataRepository.saveWorkout as jest.Mock).mockImplementation(() => Promise.resolve());

        fireEvent.press(getByText('ValuesOnly'));

        await waitFor(() => {
            expect(DataRepository.saveWorkout).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: sourceWorkoutId,
                    exercises: [
                        expect.objectContaining({
                            id: 'ex-1',
                            sets: 3, // Preserved original count
                            reps: 15, // Updated from completed log
                            setTargets: [
                                // Set 1: updated from log
                                { reps: 15, weight: 30, reps_left: undefined, reps_right: undefined, duration: undefined, distance: undefined, rpe: undefined },
                                // Set 2: preserved from original template
                                { reps: 10, weight: 20 },
                                // Set 3: preserved from original template
                                { reps: 10, weight: 20 }
                            ]
                        })
                    ]
                })
            );
        });
    });
});
