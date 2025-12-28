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
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/routines/RoutineCard';
import { ActiveRoutineCard } from '../../components/routines/ActiveRoutineCard';
import { SavedWorkoutItem } from '../../components/workouts/SavedWorkoutItem';
import { WorkoutPreviewModal } from '../../components/workouts/WorkoutPreviewModal';
import { useRoutineTimeline } from '../../hooks/routines/useRoutineTimeline';
import { HollowedCard, RaisedButton, RaisedCard, useUITheme } from '@mysuite/ui';

import { SavedWorkout, Routine } from '../../types';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { IconSymbol } from '../../components/ui/icon-symbol';

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


    const [previewWorkout, setPreviewWorkout] = useState<SavedWorkout | null>(null);
    const [routineViewMode, setRoutineViewMode] = useState<'next_3' | 'next_7' | 'week'>('week');
    const [activeSwipedCardId, setActiveSwipedCardId] = useState<string | null>(null);

    const { 
        savedWorkouts, 
        routines, 
        activeRoutine,
        startActiveRoutine,
        markRoutineDayComplete,
        setActiveRoutineIndex,
        clearActiveRoutine,
        deleteSavedWorkout,
        deleteRoutine,
    } = useWorkoutManager();

    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    
    const timelineDays = useRoutineTimeline(activeRoutineObj, dayIndex, routineViewMode);
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());


    function handleCreateRoutine() {
        router.push('/routines/create');
    }

    function handleEditRoutine(routine: Routine) {
        router.push({
            pathname: '/routines/create',
            params: { 
                id: routine.id,
                editing: 'true' 
            }
        });
    }

    function handleCreateSavedWorkout() {
        router.push('/workouts/create');
    }

    function handleEditSavedWorkout(workout: SavedWorkout) {
        router.push({ pathname: '/workouts/create', params: { id: workout.id } });
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
			<ScreenHeader title="Workout" />

			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView 
				className="flex-1"
				contentContainerStyle={{paddingBottom: 120, flexGrow: 1}}
				showsVerticalScrollIndicator={false}
			>
				{/* Controls Row */}
				<View className="flex-row gap-2 my-3 px-4">
                    <RaisedButton 
                        title="Exercises" 
                        onPress={() => router.push('/exercises' as any)} 
                        accessibilityLabel="Exercises"
                        className="flex-1 mr-0 p-2.5 my-0"
                        textClassName="text-light dark:text-dark text-center"
                    />
					<RaisedButton 
                        title="Start Empty" 
                        onPress={handleStartEmpty} 
                        accessibilityLabel="Start empty workout"
                        className="flex-1 mr-0 p-2.5 my-0"
                        textClassName="text-light dark:text-dark text-center"
                    />
					<RaisedButton 
                        title="History" 
                        onPress={() => router.push('/workouts/history' as any)} 
                        accessibilityLabel="History"
                        className="flex-1 mr-0 p-2.5 my-0"
                        textClassName="text-light dark:text-dark text-center"
                    />
				</View>
					
                <View className="px-4 mb-2">
                    <RaisedCard className="p-4">
                        {/* Saved Workouts Header */}
                        <View className="flex-row justify-between items-center mb-3">
                             <Text className="text-lg font-semibold mb-2 text-light dark:text-dark">Saved Workouts</Text>
                             <View className="flex-row items-center gap-4">
                                <RaisedButton 
                                    onPress={handleCreateSavedWorkout}
                                    borderRadius={20}
                                    className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                                >
                                    <IconSymbol 
                                        name="plus" 
                                        size={20} 
                                        color={theme.primary} 
                                    />
                                </RaisedButton>
                                <RaisedButton 
                                    onPress={() => router.push('/workouts/saved')}
                                    borderRadius={20}
                                    className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                                >
                                    <IconSymbol 
                                        name="line.3.horizontal" 
                                        size={20} 
                                        color={theme.primary} 
                                    />
                                </RaisedButton>
                             </View>
                        </View>

                        {savedWorkouts.length === 0 ? (
                            <View className="items-center justify-center border border-dashed border-light-darker dark:border-highlight-dark rounded-xl p-4">
                                <Text className="text-light-muted dark:text-dark-muted mb-2">No saved workouts.</Text>
                                <TouchableOpacity onPress={handleCreateSavedWorkout} className="p-2.5 rounded-lg border border-light-darker dark:border-highlight-dark bg-light dark:bg-dark">
                                    <Text className="text-light dark:text-dark">Create a Workout</Text>
                                </TouchableOpacity>
                            </View>
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
                                    onMarkComplete={markRoutineDayComplete}
                                    onJumpToDay={setActiveRoutineIndex}
                                    onWorkoutPress={setPreviewWorkout}
                                    viewMode={routineViewMode}
                                    onViewModeChange={setRoutineViewMode}
                                    onMenuPress={() => router.push('/routines')}
                                />
                            </View>
                        ) : (
                            <View className="mb-6 px-4">
                                <RaisedCard className="p-4">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-lg font-semibold mb-2 text-light dark:text-dark">Active Routine</Text>
                                        <RaisedButton 
                                            onPress={() => router.push('/routines')}
                                            borderRadius={20}
                                            className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                                        >
                                            <IconSymbol 
                                                name="line.3.horizontal" 
                                                size={20} 
                                                color={theme.primary} 
                                            />
                                        </RaisedButton>
                                    </View>
                                    <HollowedCard className="p-4">
                                        <View className="p-5 items-center">
                                            <Text className="text-base font-semibold text-light dark:text-dark mb-2">
                                                No active routine
                                            </Text>
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

                    {/* Routines Section */}
                    <View className="px-4 mb-2 mt-6">
                        <RaisedCard className="p-4">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-lg font-semibold mb-2 text-light dark:text-dark">My Routines</Text>
                                 <View className="flex-row items-center gap-4">
                                    <RaisedButton 
                                        onPress={handleCreateRoutine}
                                        borderRadius={20}
                                        className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                                    >
                                        <IconSymbol 
                                            name="plus" 
                                            size={20} 
                                            color={theme.primary} 
                                        />
                                    </RaisedButton>
                                    <RaisedButton 
                                        onPress={() => router.push('/routines')}
                                        borderRadius={20}
                                        className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                                    >
                                        <IconSymbol 
                                            name="line.3.horizontal" 
                                            size={20} 
                                            color={theme.primary} 
                                        />
                                    </RaisedButton>
                                 </View>
                            </View>
                            
                            {routines.length === 0 ? (
                                <View className="items-center justify-center border border-dashed border-light-darker dark:border-highlight-dark rounded-xl p-4">
                                    <Text className="text-light-muted dark:text-dark-muted mb-2">No routines yet.</Text>
                                    <TouchableOpacity onPress={handleCreateRoutine} className="p-2.5 rounded-lg border border-light-darker dark:border-highlight-dark bg-light dark:bg-dark">
                                        <Text className="text-light dark:text-dark">Create a Routine</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                 <FlatList
                                    data={routines.slice(0, 5)}
                                    scrollEnabled={false}
                                    keyExtractor={(i) => i.id}
                                    style={{ overflow: 'visible' }}
                                    ItemSeparatorComponent={() => <View />}
                                    renderItem={({item}) => (
                                        <RoutineCard 
                                            routine={item} 
                                            onPress={() => startActiveRoutine(item.id)}
                                            onEdit={() => handleEditRoutine(item)}
                                            onDelete={() => deleteRoutine(item.id)}
                                            swipeGroupId={item.id}
                                            activeSwipeId={activeSwipedCardId}
                                            onSwipeStart={setActiveSwipedCardId}
                                        />
                                    )}
                                />
                            )}
                        </RaisedCard>
                    </View>
                    
			</ScrollView>

             {/* Workout Preview Modal */}
             <WorkoutPreviewModal
                visible={!!previewWorkout}
                workout={previewWorkout}
                onClose={() => setPreviewWorkout(null)}
            />
		</View>
	);
}