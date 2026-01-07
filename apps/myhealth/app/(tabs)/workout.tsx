import React, {useState} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Alert,
    ScrollView,
} from "react-native";


import { useRouter } from 'expo-router';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { ActiveRoutineCard } from '../../components/routines/ActiveRoutineCard';
import { SavedWorkoutItem } from '../../components/workouts/SavedWorkoutItem';
import { useRoutineTimeline } from '../../hooks/routines/useRoutineManager';
import { HollowedCard, RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

import { SavedWorkout } from '../../types';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SettingsButton } from '../../components/ui/SettingsButton';

export default function Workout() {
	const router = useRouter();
    const theme = useUITheme();
    
	// consume shared state
    const {
        startWorkout,
        finishWorkout,
        cancelWorkout,
        hasActiveSession,
    } = useActiveWorkout();

    const handleStartEmpty = () => {
        if (hasActiveSession) {
            Alert.alert(
                "Active Workout",
                "You have an active workout. What would you like to do?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Stop Current",
                        onPress: () => finishWorkout()
                    },
                    {
                        text: "Replace",
                        style: "destructive",
                        onPress: () => {
                            cancelWorkout();
                            // Small timeout to ensure state clears before starting new
                            setTimeout(() => startWorkout([], "Empty Workout"), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout([], "Empty Workout");
        }
    };
    const [activeSwipedCardId, setActiveSwipedCardId] = useState<string | null>(null);

    const { 
        savedWorkouts, 
        routines, 
        activeRoutine,
        setActiveRoutineIndex,
        clearActiveRoutine,
        deleteSavedWorkout,
    } = useWorkoutManager();

    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    
    const timelineDays = useRoutineTimeline(activeRoutineObj, dayIndex, 'week');
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());

    function handleCreateSavedWorkout() {
        router.push('/workouts/editor');
    }

    function handleEditSavedWorkout(workout: SavedWorkout) {
        router.push({ pathname: '/workouts/editor', params: { id: workout.id } });
    }

    function handleStartSavedWorkout(workout: SavedWorkout) {
        if (hasActiveSession) {
            Alert.alert(
                "Active Workout",
                "You have an active workout. What would you like to do?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Stop Current",
                        onPress: () => finishWorkout()
                    },
                    {
                        text: "Replace",
                        style: "destructive",
                        onPress: () => {
                            cancelWorkout();
                            setTimeout(() => startWorkout(workout.exercises, workout.name, undefined, workout.id), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout(workout.exercises, workout.name, undefined, workout.id);
        }
    }

	return (
		<View className="flex-1 bg-light dark:bg-dark">
			<ScreenHeader title="Workout" leftAction={<SettingsButton />} />

			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView 
				className="flex-1"
				contentContainerStyle={{paddingBottom: 20, flexGrow: 1, paddingTop: 100}}
				showsVerticalScrollIndicator={false}
			>
				{/* Controls Row */}
				<View className="flex-row gap-2 my-6 px-4">
                    <RaisedCard 
                        onPress={() => router.push('/exercises' as any)} 
                        accessibilityLabel="Exercises"
                        className="flex-1 mr-0 p-2.5 my-0 items-center justify-center"
                    >
                        <Text className="text-light dark:text-dark text-center font-semibold">Exercises</Text>
                    </RaisedCard>
					<RaisedCard 
                        onPress={handleStartEmpty} 
                        accessibilityLabel="Start empty workout"
                        className="flex-1 mr-0 p-2.5 my-0 items-center justify-center"
                    >
                        <Text className="text-light dark:text-dark text-center font-semibold">Start Empty</Text>
                    </RaisedCard>
					<RaisedCard 
                        onPress={() => router.push('/workouts/history' as any)} 
                        accessibilityLabel="History"
                        className="flex-1 mr-0 p-2.5 my-0 items-center justify-center"
                    >
                        <Text className="text-light dark:text-dark text-center font-semibold">History</Text>
                    </RaisedCard>
				</View>
					
                <View className="px-4 mb-2">
                    <RaisedCard className="p-4">
                        {/* Saved Workouts Header */}
                        <View className="flex-row justify-between items-center mb-3">
                             <Text className="text-lg font-semibold mb-2 text-light dark:text-dark">Saved Workouts</Text>
                             <View className="flex-row items-center gap-4">
                                <RaisedCard 
                                    onPress={handleCreateSavedWorkout}
                                    style={{ borderRadius: 9999 }}
                                    className="w-12 h-12 p-0 my-0 items-center justify-center"
                                >
                                    <IconSymbol 
                                        name="square.and.pencil" 
                                        size={24} 
                                        color={theme.primary} 
                                    />
                                </RaisedCard>
                                <RaisedCard 
                                    onPress={() => router.push('/workouts/saved')}
                                    style={{ borderRadius: 9999 }}
                                    className="w-12 h-12 p-0 my-0 items-center justify-center"
                                >
                                    <IconSymbol 
                                        name="line.3.horizontal" 
                                        size={24} 
                                        color={theme.primary} 
                                    />
                                </RaisedCard>
                             </View>
                        </View>

                        {savedWorkouts.length === 0 ? (
                            <HollowedCard className="p-2">
                                <View>
                                    <Text className="text-light-muted dark:text-dark-muted text-center">
                                        Create a workout to save your favorite exercises and sets.
                                    </Text>
                                </View>
                            </HollowedCard>
                        ) : (
                            <FlatList
                                data={savedWorkouts}
                                scrollEnabled={false}
                                keyExtractor={(i) => i.id}
                                style={{ overflow: 'visible' }}
                                ItemSeparatorComponent={() => <View />}
                                renderItem={({item}) => (
                                    <SavedWorkoutItem
                                        item={item}
                                        onEdit={() => handleEditSavedWorkout(item)}
                                        onStart={() => handleStartSavedWorkout(item)}
                                        onDelete={() => deleteSavedWorkout(item.id, { skipConfirmation: true })}
                                        swipeGroupId={item.id}
                                        activeSwipeId={activeSwipedCardId}
                                        onSwipeStart={setActiveSwipedCardId}
                                    />
                                )}
                            />
                        )}
                    </RaisedCard>
                </View>

                    <View className="h-6" />

                    {/* Active Routine Section */}
                    <View>
                        {activeRoutineObj ? (
                            <View className="px-4">
                                <ActiveRoutineCard
                                    activeRoutineObj={activeRoutineObj}
                                    timelineDays={timelineDays}
                                    dayIndex={dayIndex}
                                    isDayCompleted={isDayCompleted}
                                    onClearRoutine={clearActiveRoutine}
                                    onStartWorkout={(exercises, name, workoutId) => {
                                        console.log("Workout.tsx: onStartWorkout called. ID:", workoutId);
                                        
                                        let exercisesToStart = exercises;
                                        // Try to find fresh version from saved workouts if ID exists
                                        let fresh;
                                        
                                        if (workoutId) {
                                            fresh = savedWorkouts.find(w => w.id === workoutId);
                                        }

                                        // Fallback to name match if ID failed
                                        if (!fresh && name) {
                                            fresh = savedWorkouts.find(w => w.name.trim() === name.trim());
                                        }

                                        if (fresh && fresh.exercises && fresh.exercises.length > 0) {
                                            exercisesToStart = fresh.exercises;
                                        }

                                        startWorkout(exercisesToStart, name, activeRoutineObj.id);
                                    }}
                                    onJumpToDay={setActiveRoutineIndex}
                                    onMenuPress={() => router.push('/routines')}
                                />
                            </View>
                        ) : (
                            <View className="mb-6 px-4">
                                <RaisedCard className="p-4">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-lg font-semibold mb-2 text-light dark:text-dark">No Active Routine</Text>
                                        <RaisedCard 
                                            onPress={() => router.push('/routines')}
                                            style={{ borderRadius: 9999 }}
                                            className="w-12 h-12 p-0 my-0 items-center justify-center"
                                        >
                                            <IconSymbol 
                                                name="line.3.horizontal" 
                                                size={24} 
                                                color={theme.primary} 
                                            />
                                        </RaisedCard>
                                    </View>
                                    <HollowedCard className="p-4">
                                        <View className="p-5 items-center">
                                            <Text className="text-light-muted dark:text-dark-muted text-center mb-4">
                                                Select a routine below to start tracking your progress.
                                            </Text>
                                            <TouchableOpacity onPress={() => router.push('/routines' as any)} className="p-2.5 rounded-lg bg-primary dark:bg-primary-dark">
                                                <Text className="text-white font-semibold">Choose Routine</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </HollowedCard>
                                </RaisedCard>
                            </View>
                        )}
                    </View>     
			</ScrollView>
		</View>
	);
}