import React, {useState, useMemo, useRef, useCallback} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Alert,
    ScrollView,
    Modal,
    Pressable,
} from "react-native";

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { ActiveRoutineCard } from '../../components/routines/ActiveRoutineCard';
import { SavedWorkoutItem } from '../../components/workouts/SavedWorkoutItem';
import { useRoutineTimeline } from '../../hooks/routines/useRoutineManager';
import { HollowedCard, RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

import { SavedWorkout } from '../../types';
import { BottomActionBar } from '../../components/ui/BottomNavBar';
import { DashboardButton } from '../../components/ui/DashboardButton';
import { BottomNavButton } from '../../components/ui/BottomNavButton';
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
    // Tabs stay mounted when you switch away — without this, leaving the
    // burger menu open and navigating elsewhere means it's still open when
    // you come back.
    useFocusEffect(useCallback(() => () => setMenuVisible(false), []));
    const [activeSwipedCardId, setActiveSwipedCardId] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isDayModalVisible, setIsDayModalVisible] = useState(false);

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
        (workoutHistory || []).forEach((log: any) => {
            if (log.workoutDate) {
                try {
                    const dateStr = new Date(log.workoutDate).toDateString();
                    set.add(dateStr);
                } catch {}
            }
        });
        return set;
    }, [workoutHistory]);

    const workoutsOnSelectedDay = useMemo(() => {
        if (!selectedDay) return [];
        const dateStringStr = selectedDay.toDateString();
        return (workoutHistory || []).filter((log: any) => {
            try {
                return new Date(log.workoutDate).toDateString() === dateStringStr;
            } catch {
                return false;
            }
        });
    }, [selectedDay, workoutHistory]);

    // Derived state for current routine
    const activeRoutineObj = routines.find((r: any) => r.id === activeRoutine?.id);
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
            fresh = savedWorkouts.find((w: any) => w.id === workout.id);
        }
        if (!fresh && workout.name) {
            fresh = savedWorkouts.find((w: any) => w.name.trim() === workout.name.trim());
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
			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView
				className="flex-1"
				contentContainerStyle={{paddingBottom: 100 + insets.bottom, paddingTop: 130}}
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
                                    <TouchableOpacity 
                                        key={idx} 
                                        onPress={() => {
                                            setSelectedDay(day);
                                            setIsDayModalVisible(true);
                                        }}
                                        style={{ alignItems: 'center', gap: 6, width: 34 }}
                                    >
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
                                    </TouchableOpacity>
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

                    <View className="mb-3 px-4">
                        <View
                            className="flex-row h-20 rounded-xl overflow-hidden"
                            style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: theme.primary }}
                        >
                            <TouchableOpacity
                                onPress={() => handleStartEmpty(activeRoutineObj?.id)}
                                className="flex-1 justify-center px-4"
                                style={{ borderRightWidth: 2, borderStyle: 'dashed', borderRightColor: theme.primary }}
                            >
                                <Text style={{ color: theme.primary }} className="font-semibold text-lg" numberOfLines={2}>
                                    Start Empty Workout
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleStartEmpty(activeRoutineObj?.id)}
                                className="w-[20%] items-center justify-center"
                            >
                                <IconSymbol name="plus" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
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

            <BottomActionBar>
                <DashboardButton dimmed={menuVisible} />
                <BottomNavButton
                    icon="dumbbell.fill"
                    label="Exercises"
                    onPress={() => router.navigate('/(tabs)/exercises' as any)}
                />
                <BottomNavButton
                    icon="clock.fill"
                    label="History"
                    onPress={() => router.navigate('/(tabs)/history' as any)}
                />
                <BottomNavButton
                    icon="line.3.horizontal"
                    label="Menu"
                    active={menuVisible}
                    boldWhenActive={false}
                    onPress={() => setMenuVisible(!menuVisible)}
                />
            </BottomActionBar>

            <BurgerMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />

            <Modal
                visible={isDayModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDayModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 justify-center items-center bg-black/50 px-4"
                    onPress={() => setIsDayModalVisible(false)}
                >
                    <Pressable 
                        className="w-full max-w-md p-5 rounded-2xl bg-light dark:bg-dark-lighter"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-xs font-bold uppercase text-primary dark:text-primary-dark">
                                    {selectedDay ? selectedDay.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                                </Text>
                                <Text className="text-xl font-bold text-light dark:text-dark">
                                    Completed Workouts
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setIsDayModalVisible(false)}
                                className="w-8 h-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
                            >
                                <IconSymbol name="xmark" size={16} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* List */}
                        <ScrollView 
                            style={{ maxHeight: 300 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {workoutsOnSelectedDay.length > 0 ? (
                                workoutsOnSelectedDay.map((log: any, idx: number) => (
                                    <TouchableOpacity
                                        key={log.id || idx}
                                        onPress={() => {
                                            setIsDayModalVisible(false);
                                            router.push({
                                                pathname: '/workouts/details' as any,
                                                params: { logId: log.id }
                                            });
                                        }}
                                        className="p-3 mb-2 rounded-xl bg-black/5 dark:bg-white/5 active:bg-black/10 dark:active:bg-white/10 flex-row justify-between items-center"
                                    >
                                        <View className="flex-1 mr-3">
                                            <Text className="text-base font-semibold text-light dark:text-dark">
                                                {log.workoutName || 'Untitled Workout'}
                                            </Text>
                                            {log.exercises && log.exercises.length > 0 && (
                                                <Text className="text-xs text-light-muted dark:text-dark-muted mt-1" numberOfLines={1}>
                                                    {log.exercises.map((ex: any) => ex.name).join(', ')}
                                                </Text>
                                            )}
                                        </View>
                                        <IconSymbol name="chevron.right" size={16} color={theme.primary} />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="py-8 items-center justify-center">
                                    <Text className="text-sm text-light-muted dark:text-dark-muted text-center mb-4">
                                        No workouts logged for this day.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsDayModalVisible(false);
                                            handleStartEmpty(activeRoutineObj?.id);
                                        }}
                                        className="py-2.5 px-5 rounded-full bg-primary dark:bg-primary-dark"
                                    >
                                        <Text className="text-white font-semibold text-sm">
                                            Start Empty Workout
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
		</View>
	);
}
export default Workout;
