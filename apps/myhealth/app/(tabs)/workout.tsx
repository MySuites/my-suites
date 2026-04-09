import React, {useState} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Alert,
    ScrollView,
} from "react-native";

import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function Workout() {
	const router = useRouter();
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    
	// consume shared state
    const {
        startWorkout,
        finishWorkout,
        cancelWorkout,
        hasActiveSession,
    } = useActiveWorkout();

    const handleStartEmpty = (routineId?: string) => {
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
                            setTimeout(() => startWorkout([], "Empty Workout", routineId), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout([], "Empty Workout", routineId);
        }
    };
    const [menuVisible, setMenuVisible] = useState(false);
    const [activeSwipedCardId, setActiveSwipedCardId] = useState<string | null>(null);

    const { 
        savedWorkouts, 
        routines, 
        activeRoutine,
        setActiveRoutineIndex,
        deleteSavedWorkout,
    } = useWorkoutManager();

    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    
    const timelineDays = useRoutineTimeline(activeRoutineObj, dayIndex, 'week');
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());


    function handleEditSavedWorkout(workout: SavedWorkout) {
        console.log("handleEditSavedWorkout called with:", workout);
        router.push({ pathname: '/workouts/details', params: { id: workout.id } });
    }

    function handleStartSavedWorkout(workout: SavedWorkout, routineId?: string) {
        let exercisesToStart = workout.exercises;
        let fresh;
        
        if (workout.id) {
            fresh = savedWorkouts.find(w => w.id === workout.id);
        }
        if (!fresh && workout.name) {
            fresh = savedWorkouts.find(w => w.name.trim() === workout.name.trim());
        }
        if (fresh && fresh.exercises && fresh.exercises.length > 0) {
            exercisesToStart = fresh.exercises;
        }

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
                            setTimeout(() => startWorkout(exercisesToStart, workout.name, routineId, workout.id), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout(exercisesToStart, workout.name, routineId, workout.id);
        }
    }

	return (
		<View className="flex-1 bg-light dark:bg-dark">
			<ScreenHeader 
                title="Workout" 
                leftAction={<SettingsButton />} 
                rightAction={
                    <RaisedCard 
                        onPress={() => setMenuVisible(!menuVisible)}
                        style={{ borderRadius: 9999 }}
                        className="w-12 p-0 items-center justify-center"
                    >
                        <IconSymbol 
                            name="line.3.horizontal" 
                            size={24} 
                            color={theme.primary} 
                        />
                    </RaisedCard>
                } 
            />

			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView 
				className="flex-1"
				contentContainerStyle={{paddingBottom: 100 + insets.bottom, paddingTop: 100}}
				showsVerticalScrollIndicator={false}
			>		
                <View className="px-4 my-6">
                    {/* Saved Workouts Header */}
                    <View className="flex-row justify-between items-end mb-3">
                        <Text className="text-lg font-semibold text-light dark:text-dark">Saved Workouts</Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/workouts/saved')}
                            className="py-1.5 rounded-lg active:opacity-50"
                        >
                            <Text className="text-black dark:text-white text-sm">See all</Text>
                        </TouchableOpacity>
                    </View>

                    {savedWorkouts.length === 0 ? (
                        <HollowedCard className="p-8">
                            <Text className="text-base text-light-muted dark:text-dark-muted text-center">
                                Create a workout to save your favorite exercises and sets.
                            </Text>
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
                </View>
                {/* Active Routine Section */}
                <View className="px-4">
                    <View className="flex-row justify-between items-end mb-3">
                        <Text className="text-lg font-semibold text-light dark:text-dark">
                            Active Routine{activeRoutineObj ? `: ${activeRoutineObj.name}` : ''}
                        </Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/routines')}
                            className="py-1.5 rounded-lg active:opacity-50"
                        >
                            <Text className="text-black dark:text-white text-sm">See all</Text>
                        </TouchableOpacity>
                    </View>
                    {activeRoutineObj ? (
                        <ActiveRoutineCard
                            activeRoutineObj={activeRoutineObj}
                            timelineDays={timelineDays}
                            dayIndex={dayIndex}
                            isDayCompleted={isDayCompleted}
                             onStartWorkout={(exercises, name, workoutId) => {
                                handleStartSavedWorkout({ id: workoutId as string, name: name || "", exercises: exercises, createdAt: new Date().toISOString() }, activeRoutineObj.id);
                            }}
                            onJumpToDay={setActiveRoutineIndex}
                            onMenuPress={() => router.push('/routines')}
                        />
                    ) : (
                        <HollowedCard className="p-8 mb-8">
                            <Text className="text-base text-light-muted dark:text-dark-muted text-center">
                                Select a routine to start tracking your progress.
                            </Text>
                        </HollowedCard>
                    )}
                </View>
			</ScrollView>
                
                {/* Menu Overlay */}
                {menuVisible && (
                    <>
                        <TouchableOpacity 
                            activeOpacity={1} 
                            onPress={() => setMenuVisible(false)}
                            className="absolute top-0 bottom-0 left-0 right-0 z-50 bg-black/20"
                        />
                        <RaisedCard 
                            className="absolute top-28 right-4 z-[60] w-48 p-2 bg-light dark:bg-dark-lighter origin-top-right rounded-xl"
                            style={{ 
                                shadowColor: '#000', 
                                shadowOffset: { width: 0, height: 4 }, 
                                shadowOpacity: 0.15, 
                                shadowRadius: 12, 
                                elevation: 5 
                            }}
                        >
                            <TouchableOpacity 
                                onPress={() => { setMenuVisible(false); router.push('/exercises' as any); }}
                                className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                            >
                                <IconSymbol name="dumbbell.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                                <Text className="text-light dark:text-dark font-medium">Exercises</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={() => { setMenuVisible(false); router.push('/workouts/history' as any); }}
                                className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                            >
                                <IconSymbol name="clock.fill" size={20} color={theme.text} style={{ marginRight: 12 }} />
                                <Text className="text-light dark:text-dark font-medium">History</Text>
                            </TouchableOpacity>

                            <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                            
                            <TouchableOpacity 
                                onPress={() => { setMenuVisible(false); handleStartEmpty(activeRoutineObj?.id); }}
                                className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                            >
                                <IconSymbol name="plus" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                                <Text className="text-primary font-medium">Start Empty</Text>
                            </TouchableOpacity>
                        </RaisedCard>
                    </>
                )}

                {/* Quick Start Floating Button */}
                {!hasActiveSession && (
                     <View 
                        className="absolute self-center"
                        style={{ bottom: insets.bottom, width: 'auto', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
                     >
                        <RaisedCard
                            onPress={() => {
                                // Logic: If routine & today has workout -> Start that. Else -> Empty.
                                if (activeRoutineObj && !isDayCompleted) {
                                     const todayItem = timelineDays[0];
                                     
                                     if (todayItem && todayItem.type === 'workout') {
                                         if (todayItem.workout) {
                                             handleStartSavedWorkout(todayItem.workout, activeRoutineObj.id);
                                             return;
                                         }
                                         
                                         if (todayItem.workoutId) {
                                              const workout = savedWorkouts.find(w => w.id === todayItem.workoutId);
                                              if (workout) {
                                                  handleStartSavedWorkout(workout, activeRoutineObj.id);
                                                  return;
                                              }
                                         }
                                     }
                                }
                                
                                // Fallback: Start Empty
                                handleStartEmpty(activeRoutineObj?.id);
                            }}
                            className="items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                            style={{ borderRadius: 9999 }}
                        >
                            <View className="flex-row items-center justify-center">
                                <IconSymbol name="play.fill" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text className="text-lg font-bold text-white">
                                    {(() => {
                                        if (activeRoutineObj && !isDayCompleted) {
                                            const todayItem = timelineDays[0];
                                            if (todayItem && todayItem.type === 'workout') {
                                                if (todayItem.workout && todayItem.workout.name) {
                                                    return `${todayItem.workout.name}`;
                                                }
                                                if (todayItem.workoutId) {
                                                    const workout = savedWorkouts.find(w => w.id === todayItem.workoutId);
                                                    if (workout && workout.name) {
                                                        return `${workout.name}`;
                                                    }
                                                }
                                                return "Start Workout";
                                            }
                                        }
                                        return "Empty Workout";
                                    })()}
                                </Text>
                            </View>
                        </RaisedCard>
                     </View>
                )}
		</View>
	);
}
export default Workout;
