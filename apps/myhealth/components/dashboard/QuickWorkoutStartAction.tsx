import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RaisedCard } from '@mysuite/ui';

export function QuickWorkoutStartAction() {
    const router = useRouter();
    const { 
        routines, 
        activeRoutine, 
    } = useWorkoutManager();
    
    const {
        startWorkout,
        hasActiveSession,
    } = useActiveWorkout();

    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    
    // Helper to get today's item
    const getTodaysItem = () => {
        if (!activeRoutineObj?.sequence) return null;
        const index = dayIndex % activeRoutineObj.sequence.length;
        return activeRoutineObj.sequence[index];
    };

    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());

    const todaysItem = getTodaysItem();
    
    const handleStart = () => {
        if (!todaysItem || todaysItem.type === 'rest') return;

        if (hasActiveSession) {
            Alert.alert("Active Workout", "You already have an active workout inside.");
            return;
        }

        const workout = todaysItem.workout;
        if (workout) {
             startWorkout(workout.exercises || [], todaysItem.name || workout.name, activeRoutineObj?.id);
        }
    };

    if (!activeRoutineObj) {
        return (
            <View className="px-4 mt-4">
                <RaisedCard className="p-4">
                    <Text className="text-lg font-bold text-light dark:text-dark mb-2">No Active Routine</Text>
                    <Text className="text-gray-500 mb-4">Set a routine to get quick access to your daily workouts.</Text>
                    <RaisedCard 
                        onPress={() => router.push('/routines' as any)}
                        className="items-center justify-center"
                    >
                        <Text className="text-center text-primary font-bold text-lg">Choose Routine</Text>
                    </RaisedCard>
                </RaisedCard>
            </View>
        );
    }

    if (isDayCompleted) {
        return (
            <View className="px-4 mt-4">
                <RaisedCard className="p-4">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-lg font-bold text-light dark:text-dark">Daily Goal Completed</Text>
                            <Text className="text-gray-500">Great job!</Text>
                        </View>
                        <View className="bg-green-500/20 px-3 py-1 rounded-full">
                            <Text className="text-green-600 font-bold">Done</Text>
                        </View>
                    </View>
                </RaisedCard>
            </View>
        );
    }

    if (todaysItem?.type === 'rest') {
         return (
            <View className="px-4 mt-4">
                <RaisedCard className="p-4">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-lg font-bold text-light dark:text-dark">Rest Day</Text>
                            <Text className="text-gray-500">Take it easy today.</Text>
                        </View>
                        <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                            <Text className="text-blue-600 font-bold">Zzz</Text>
                        </View>
                    </View>
                </RaisedCard>
            </View>
        );
    }

    return (
        <View className="px-4 mt-4">
            <RaisedCard className="p-4">
                <Text className="text-sm font-semibold text-primary dark:text-primary-dark uppercase tracking-wider mb-1">Today&apos;s Workout</Text>
                <Text className="text-2xl font-bold text-light dark:text-dark mb-4">{todaysItem?.name || todaysItem?.workout?.name || "Workout"}</Text>
                
                <RaisedCard
                    onPress={handleStart}
                    className="w-full items-center justify-center"
                >
                    <Text className="text-center text-primary font-bold text-lg">Start Workout</Text>
                </RaisedCard>
            </RaisedCard>
        </View>
    );
}
