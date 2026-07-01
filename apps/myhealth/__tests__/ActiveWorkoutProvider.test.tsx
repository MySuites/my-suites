import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActiveWorkoutProvider, useActiveWorkout, useActiveWorkoutTimer } from '../providers/ActiveWorkoutProvider';
import { Button, Text, View, Alert } from 'react-native';
import { NotificationService } from '../services/NotificationService';

const mockReact = React;

// Simple component to consume context for testing
const TestComponent = () => {
    const { 
        exercises, 
        startWorkout,
        addExercise,
        completeSet,
        finishWorkout,
        cancelWorkout
    } = useActiveWorkout();
    
    const { isRunning, workoutSeconds } = useActiveWorkoutTimer();

    return (
        <View>
            <Text testID="running-state">{isRunning ? 'Running' : 'Stopped'}</Text>
            <Text testID="timer">{workoutSeconds}</Text>
            <Text testID="exercise-count">{exercises.length}</Text>
            {exercises.map((ex, i) => (
                <View key={ex.id} testID={`exercise-${i}`}>
                    <Text>{ex.name}: {ex.completedSets}/{ex.sets}</Text>
                </View>
            ))}
            <Button title="Start" onPress={() => startWorkout(([] as any))} />
            <Button title="Add Ex" onPress={() => addExercise('New Ex', '3', '12')} />
            <Button title="Complete Set" onPress={() => completeSet(0, 0)} />
            <Button title="Finish" onPress={() => finishWorkout('My Note')} />
            <Button title="Cancel" onPress={() => cancelWorkout()} />
        </View>
    );
};


// Mock logic
jest.mock('../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => ({
        saveCompletedWorkout: jest.fn(),
        createCustomExercise: jest.fn(),
    })
}));

jest.mock('../services/NotificationService', () => ({
    NotificationService: {
        getPermissions: jest.fn(() => Promise.resolve(true)),
        requestPermissions: jest.fn(() => Promise.resolve(true)),
        scheduleWorkoutTimeoutReminder: jest.fn(() => Promise.resolve('mock-timeout-id')),
        cancelWorkoutTimeoutReminder: jest.fn(() => Promise.resolve()),
        registerForegroundHandler: jest.fn(),
    }
}));

jest.mock('../hooks/workouts/useActiveWorkoutPersistence', () => {
    return {
        useActiveWorkoutPersistence: ({ setExercises }: any) => {
            mockReact.useEffect(() => {
                setExercises([
                    { id: '1', name: 'Push Ups', sets: 3, reps: 10, completedSets: 0, completedIndices: [] },
                    { id: '2', name: 'Squats', sets: 3, reps: 10, completedSets: 0, completedIndices: [] },
                    { id: '3', name: 'Pull Ups', sets: 3, reps: 10, completedSets: 0, completedIndices: [] },
                ]);
            }, [setExercises]);
            return {
                isLoaded: true,
                clearPersistence: jest.fn(),
            };
        }
    };
});

describe('ActiveWorkoutProvider', () => {
    // Mock Alert
    jest.spyOn(Alert, 'alert');

    it('initializes with default exercises', () => {
        const { getByTestId } = render(
            <ActiveWorkoutProvider>
                <TestComponent />
            </ActiveWorkoutProvider>
        );
        // Default is 3 exercises
        expect(getByTestId('exercise-count').children[0]).toBe('3');
        expect(getByTestId('running-state').children[0]).toBe('Stopped');
    });

    it('starts workout when Start button is pressed', () => {
        const { getByText, getByTestId } = render(
            <ActiveWorkoutProvider>
                <TestComponent />
            </ActiveWorkoutProvider>
        );
        fireEvent.press(getByText('Start'));
        expect(getByTestId('running-state').children[0]).toBe('Running');
    });

    it('adds an exercise correctly', () => {
        const { getByText, getByTestId } = render(
            <ActiveWorkoutProvider>
                <TestComponent />
            </ActiveWorkoutProvider>
        );
        fireEvent.press(getByText('Add Ex'));
        expect(getByTestId('exercise-count').children[0]).toBe('4');
    });

    it('completes a set correctly', () => {
        const { getByText, getByTestId } = render(
            <ActiveWorkoutProvider>
                <TestComponent />
            </ActiveWorkoutProvider>
        );
        const firstEx = getByTestId('exercise-0');
        expect(firstEx).toHaveTextContent('Push Ups: 0/3');

        fireEvent.press(getByText('Complete Set'));

        expect(getByTestId('exercise-0')).toHaveTextContent('Push Ups: 1/3');
    });

    it('schedules timeout notification when starting workout, and cancels on finish/cancel', async () => {
        jest.clearAllMocks();
        const { getByText } = render(
            <ActiveWorkoutProvider>
                <TestComponent />
            </ActiveWorkoutProvider>
        );

        // Start workout
        fireEvent.press(getByText('Start'));
        expect(NotificationService.scheduleWorkoutTimeoutReminder).toHaveBeenCalled();

        // Finish workout
        fireEvent.press(getByText('Finish'));
        expect(NotificationService.cancelWorkoutTimeoutReminder).toHaveBeenCalled();

        // Start workout again
        fireEvent.press(getByText('Start'));
        expect(NotificationService.scheduleWorkoutTimeoutReminder).toHaveBeenCalledTimes(2);

        // Cancel workout
        fireEvent.press(getByText('Cancel'));
        expect(NotificationService.cancelWorkoutTimeoutReminder).toHaveBeenCalledTimes(2);
    });
});
