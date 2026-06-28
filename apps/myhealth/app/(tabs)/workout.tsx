import React, {useState, useMemo, useRef} from "react";
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
import { BurgerMenu } from '../../components/ui/BurgerMenu';

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
        workoutHistory,
    } = useWorkoutManager();

    const scrollViewRef = useRef<ScrollView>(null);

    // Calendar rolling last 30 days helper
    const last30Days = useMemo(() => {
        const list = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            list.push(d);
        }
        return list;
    }, []);

    const completedDates = useMemo(() => {
        const set = new Set<string>();
        (workoutHistory || []).forEach(log => {
            if (log.workoutDate) {
                try {
                    const dateStr = new Date(log.workoutDate).toDateString();
                    set.add(dateStr);
                } catch {}
            }
        });
        return set;
    }, [workoutHistory]);

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
                {/* Calendar View */}
                <View className="px-4 mt-4">
                    <RaisedCard className="p-4" style={{ borderRadius: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                                Recent Activity
                            </Text>
                            <TouchableOpacity 
                                onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                                style={{ 
                                    paddingHorizontal: 10, 
                                    paddingVertical: 4, 
                                    borderRadius: 12, 
                                    backgroundColor: (theme.bgLight || 'rgba(0,0,0,0.05)') 
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>
                                    Today
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView 
                            ref={scrollViewRef}
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                            contentContainerStyle={{ gap: 16, paddingRight: 4 }}
                        >
                            {last30Days.map((day, idx) => {
                                const toDateStr = day.toDateString();
                                const isToday = toDateStr === new Date().toDateString();
                                const isCompleted = completedDates.has(toDateStr);
                                const weekday = day.toLocaleDateString('default', { weekday: 'short' });

                                return (
                                    <View key={idx} style={{ alignItems: 'center', gap: 6, width: 34 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.text, opacity: isToday ? 1 : 0.4 }}>
                                            {weekday}
                                        </Text>
                                        <View 
                                            style={{ 
                                                width: 34, 
                                                height: 34, 
                                                justifyContent: 'center', 
                                                alignItems: 'center',
                                                borderRadius: 17,
                                                backgroundColor: isCompleted 
                                                    ? theme.primary 
                                                    : 'transparent',
                                                borderWidth: isToday ? 1 : 0,
                                                borderColor: isCompleted ? 'transparent' : theme.primary,
                                            }}
                                        >
                                            <Text style={{ 
                                                fontSize: 13, 
                                                fontWeight: isToday || isCompleted ? '700' : '400',
                                                color: isCompleted 
                                                    ? '#FFFFFF' 
                                                    : isToday 
                                                        ? theme.primary 
                                                        : theme.text 
                                            }}>
                                                {day.getDate()}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </RaisedCard>
                </View>

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
                            data={savedWorkouts.slice(0, 4)}
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
                
            <BurgerMenu 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onStartEmpty={() => handleStartEmpty(activeRoutineObj?.id)}
            />

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
