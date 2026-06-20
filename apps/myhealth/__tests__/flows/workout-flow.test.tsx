import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActiveWorkoutProvider, useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import { Button, Text, View } from 'react-native';

// Mock dependencies
jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => ({
        saveCompletedWorkout: jest.fn(),
        createCustomExercise: jest.fn(),
    }),
    fetchLastExercisePerformance: jest.fn(() => Promise.resolve({ data: null })),
    createExercise: jest.requireActual('../../providers/WorkoutManagerProvider').createExercise // If needed, or mock it
}));

// Mock hook explicitly if not covered by provider mock
jest.mock('../../hooks/workouts/useActiveWorkoutPersistence', () => ({
    useActiveWorkoutPersistence: () => ({
        clearPersistence: jest.fn(),
        isLoaded: true,
    })
}));

// Helper component to drive the workout flow
const WorkoutFlowTestComponent = () => {
    const { 
        startWorkout, 
        addExercise, 
        completeSet, 
        exercises,
        finishWorkout,
        hasActiveSession,
        workoutName
    } = useActiveWorkout();

    const { isRunning } = useActiveWorkoutTimer();

    return (
        <View>
            <Text testID="status">{hasActiveSession ? 'Active' : 'Inactive'}</Text>
            <Text testID="running-state">{isRunning ? 'Running' : 'Stopped'}</Text>
            <Text testID="workout-name">{workoutName}</Text>
            <Text testID="exercise-count">{exercises.length}</Text>
            
            {exercises.map((ex, i) => (
                <View key={ex.id || i} testID={`exercise-${i}`}>
                    <Text>{ex.name}: {ex.completedSets}/{ex.sets}</Text>
                </View>
            ))}

            <Button title="Start New Workout" onPress={() => startWorkout([], 'New Workout')} />
            <Button title="Add Bench Press" onPress={() => addExercise('Bench Press', '3', '10')} />
            <Button title="Complete Set 1" onPress={() => completeSet(0, 0, { weight: 100, reps: 10 })} />
            <Button title="Finish Workout" onPress={() => finishWorkout('Great workout!')} />
        </View>
    );
};

describe('Workout Flow Integration', () => {
    it('successfully completes a full workout lifecycle', async () => {
        const { getByText, getByTestId } = render(
            <ActiveWorkoutProvider>
                <WorkoutFlowTestComponent />
            </ActiveWorkoutProvider>
        );

        // 1. Initial State
        await waitFor(() => {
            expect(getByTestId('status').children[0]).toBe('Inactive');
        });

        // 2. Start Workout
        fireEvent.press(getByText('Start New Workout'));
        
        await waitFor(() => {
            expect(getByTestId('status').children[0]).toBe('Active');
            expect(getByTestId('running-state').children[0]).toBe('Running');
            expect(getByTestId('workout-name').children[0]).toBe('New Workout');
            // Should start empty as requested
            expect(getByTestId('exercise-count').children[0]).toBe('0'); 
        });

        // 3. Add Exercise
        fireEvent.press(getByText('Add Bench Press'));
        
        await waitFor(() => {
            expect(getByTestId('exercise-count').children[0]).toBe('1');
            expect(getByTestId('exercise-0')).toHaveTextContent('Bench Press: 0/3');
        });

        // 4. Complete Set
        fireEvent.press(getByText('Complete Set 1'));
        
        await waitFor(() => {
            expect(getByTestId('exercise-0')).toHaveTextContent('Bench Press: 1/3');
        });

        // 5. Finish Workout
        fireEvent.press(getByText('Finish Workout'));

        await waitFor(() => {
            expect(getByTestId('status').children[0]).toBe('Inactive');
            expect(getByTestId('running-state').children[0]).toBe('Stopped');
        });
    });
});
