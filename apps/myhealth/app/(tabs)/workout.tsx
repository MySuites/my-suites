import React, {useState} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Alert,
    ScrollView,
    Modal,
} from "react-native";

import { ThemedView } from '../../components/ui/ThemedView';
import { useRouter } from 'expo-router';
import { useWorkoutManager } from '../../hooks/useWorkoutManager';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/workouts/RoutineCard';
import { ActiveRoutineCard } from '../../components/workouts/ActiveRoutineCard';

import { SavedWorkout, Routine } from '../../types';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';

export default function Workout() {
	const router = useRouter();
    
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

    const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
    const [previewWorkout, setPreviewWorkout] = useState<SavedWorkout | null>(null);
    const [routineViewMode, setRoutineViewMode] = useState<'next_3' | 'next_7' | 'week'>('week');

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
    const timelineDays = React.useMemo(() => {
        if (!activeRoutineObj?.sequence) return [];
        const seq = activeRoutineObj.sequence;
        const total = seq.length;
        if (total === 0) return [];

        const result = [];
        // Show up to 7 visible days (skipping future rest days)
        let i = 0;
        
        // Limits based on mode
        const countLimit = routineViewMode === 'next_3' ? 3 : routineViewMode === 'next_7' ? 7 : 7; // Week uses day limit, not count limit primarily
        const dayLimit = routineViewMode === 'week' ? 7 : 30; // Next 3/7 look ahead further

        // Safety break at 30 days to prevent infinite loops if routine is weird
        while (result.length < countLimit && i < dayLimit) {
            const index = (dayIndex + i) % total;
            const item = seq[index];
            
            // Allow today (i=0) even if rest, otherwise skip rest days
            if (i === 0 || item.type !== 'rest') {
                const d = new Date();
                d.setDate(d.getDate() + i);
                result.push({ 
                    ...item, 
                    originalIndex: index,
                    date: d
                });
            }
            i++;
        }
        return result;
    }, [activeRoutineObj, dayIndex, routineViewMode]);
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());


    function handleCreateRoutine() {
        router.push('/create-routine');
    }

    function handleEditRoutine(routine: Routine) {
        router.push({
            pathname: '/create-routine',
            params: { 
                id: routine.id,
                editing: 'true' 
            }
        });
    }

    function handleCreateSavedWorkout() {
        router.push('/create-workout');
    }

    function handleEditSavedWorkout(workout: SavedWorkout) {
        router.push({ pathname: '/create-workout', params: { id: workout.id } });
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
                            setTimeout(() => startWorkout(workout.exercises, workout.name), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout(workout.exercises, workout.name);
        }
    }

    const SavedWorkoutItem = ({ 
        item, 
        isExpanded, 
        onPress, 
        onEdit, 
        onStart,
        onDelete 
    }: { 
        item: any, 
        isExpanded: boolean, 
        onPress: () => void, 
        onEdit: () => void, 
        onStart: () => void,
        onDelete: () => void
    }) => {
        return (
            <Card 
                onPress={onPress}
                activeOpacity={0.9}
                className="p-0 mb-0 border border-black/5 dark:border-white/10"
                onDelete={onDelete}
                onEdit={onEdit}
            >
                <View className={`flex-row justify-between items-center ${isExpanded ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                    <TouchableOpacity 
                        className="flex-1 mr-2"
                        onPress={onPress}
                    >
                        <Text className="font-semibold text-apptext dark:text-apptext_dark text-lg mb-0.5" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.exercises?.length || 0} Exercises</Text>
                    </TouchableOpacity>
                    
                    <View className="flex-row items-center">
                        <TouchableOpacity 
                            onPress={onStart}
                            className="bg-primary dark:bg-primary_dark px-3 py-1.5 rounded-lg"
                        >
                            <Text className="text-white font-semibold">Start</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {isExpanded && (
                    <View className="bg-background/50 dark:bg-background_dark/50 px-4 py-2 rounded-b-xl">
                        {item.exercises && item.exercises.length > 0 ? (
                            item.exercises.map((ex: any, idx: number) => (
                                <View key={idx} className="py-2 flex-row justify-between border-b border-black/5 dark:border-white/5 last:border-0">
                                    <Text className="text-apptext dark:text-apptext_dark font-medium">{ex.name}</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm">{ex.sets} x {ex.reps}</Text>
                                </View>
                            ))
                        ) : (
                            <Text className="text-gray-500 dark:text-gray-400 py-2 italic text-center">No exercises</Text>
                        )}
                    </View>
                )}
            </Card>
        );
    };

	return (
		<ThemedView className="flex-1">
			<ScreenHeader title="Workout" />

			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView 
				className="flex-1"
				contentContainerStyle={{paddingBottom: 120, flexGrow: 1}}
				showsVerticalScrollIndicator={false}
			>
				{/* Controls Row */}
				<View className="flex-row gap-2 my-3 px-4">
                    <TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={() => router.push('/exercises' as any)} accessibilityLabel="Exercises">
						<Text className="text-apptext dark:text-apptext_dark text-center">Exercises</Text>
					</TouchableOpacity>
					<TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={handleStartEmpty} accessibilityLabel="Start empty workout">
						<Text className="text-apptext dark:text-apptext_dark text-center">Start Empty</Text>
					</TouchableOpacity>
					<TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={() => router.push('/workout-history' as any)} accessibilityLabel="History">
						<Text className="text-apptext dark:text-apptext_dark text-center">History</Text>
					</TouchableOpacity>
				</View>
					
                <View className="px-4">
                    {/* Saved Workouts Section (Quick Access) */}
                    <View className="flex-row justify-between items-center mb-3">
                         <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">Saved Workouts</Text>
                         <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={handleCreateSavedWorkout}>
                                <Text className="text-primary dark:text-primary_dark">+ New</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/saved-workouts')}>
                                <Text className="text-primary dark:text-primary_dark">See All</Text>
                            </TouchableOpacity>
                         </View>
                    </View>
                     {savedWorkouts.length === 0 ? (
                        <View className="p-4 items-center justify-center border border-dashed border-surface dark:border-surface_dark rounded-xl">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2">No saved workouts.</Text>
                            <TouchableOpacity onPress={handleCreateSavedWorkout} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
                                <Text className="text-apptext dark:text-apptext_dark">Create a Workout</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
						<FlatList
							data={savedWorkouts}
							scrollEnabled={false}
							keyExtractor={(i) => i.id}
                            ItemSeparatorComponent={() => <View className="h-2" />}
							renderItem={({item}) => {
                                const isExpanded = expandedWorkoutId === item.id;
                                return (
                                    <SavedWorkoutItem
                                        item={item}
                                        isExpanded={isExpanded}
                                        onPress={() => setExpandedWorkoutId(isExpanded ? null : item.id)}
                                        onEdit={() => handleEditSavedWorkout(item)}
                                        onStart={() => handleStartSavedWorkout(item)}
                                        onDelete={() => deleteSavedWorkout(item.id, { skipConfirmation: true })}
                                    />
                                );
                            }}
						/>
                    )}
                </View>

                    <View className="h-6" />

                    {/* Active Routine Section */}
                    <View className="px-4">
                        {activeRoutineObj ? (
                            <ActiveRoutineCard
                                activeRoutineObj={activeRoutineObj}
                                timelineDays={timelineDays}
                                dayIndex={dayIndex}
                                isDayCompleted={isDayCompleted}
                                onClearRoutine={clearActiveRoutine}
                                onStartWorkout={(exercises, name, workoutId) => {
                                    console.log("Workout.tsx: onStartWorkout called. ID:", workoutId);
                                    console.log("Workout.tsx: SavedWorkouts IDs:", savedWorkouts.map(w => w.id));
                                    
                                    let exercisesToStart = exercises;
                                    // Try to find fresh version from saved workouts if ID exists
                                    let fresh;
                                    
                                    if (workoutId) {
                                        fresh = savedWorkouts.find(w => w.id === workoutId);
                                        if (fresh) {
                                             console.log("Workout.tsx: Found fresh workout by ID.");
                                        } else {
                                            console.log("Workout.tsx: Fresh workout NOT FOUND for ID:", workoutId);
                                        }
                                    }

                                    // Fallback to name match if ID failed
                                    if (!fresh && name) {
                                        console.log("Workout.tsx: Attempting name fallback for:", name);
                                        fresh = savedWorkouts.find(w => w.name.trim() === name.trim());
                                        if (fresh) {
                                            console.log("Workout.tsx: Found fresh workout by NAME.");
                                        }
                                    }

                                    if (fresh && fresh.exercises && fresh.exercises.length > 0) {
                                        exercisesToStart = fresh.exercises;
                                        // Also update the name to match the fresh workout (in case of subtle changes)
                                        // But keep routine context.
                                    }

                                    startWorkout(exercisesToStart, name, activeRoutineObj.id);
                                }}
                                onMarkComplete={markRoutineDayComplete}
                                onJumpToDay={setActiveRoutineIndex}
                                onWorkoutPress={setPreviewWorkout}
                                viewMode={routineViewMode}
                                onViewModeChange={setRoutineViewMode}
                            />
                        ) : (
                            <View className="mb-6">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">Active Routine</Text>
                                </View>
                                <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm">
                                    <View className="p-5 items-center">
                                        <Text className="text-base font-semibold text-apptext dark:text-apptext_dark mb-2">
                                            No active routine
                                        </Text>
                                        <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
                                            Select a routine below to start tracking your progress.
                                        </Text>
                                        <TouchableOpacity onPress={() => router.push('/routines' as any)} className="p-2.5 rounded-lg bg-primary dark:bg-primary_dark">
                                            <Text className="text-white font-semibold">Choose Routine</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Routines Section */}
                    <View className="px-4">
                        <View className="flex-row justify-between items-center mb-3 mt-6">
                            <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">My Routines</Text>
                             <View className="flex-row items-center gap-4">
                                <TouchableOpacity onPress={handleCreateRoutine}>
                                    <Text className="text-primary dark:text-primary_dark">+ New</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => router.push('/routines')}>
                                    <Text className="text-primary dark:text-primary_dark">See All</Text>
                                </TouchableOpacity>
                             </View>
                        </View>
                        
                        {routines.length === 0 ? (
                            <View className="p-4 items-center justify-center border border-dashed border-surface dark:border-surface_dark rounded-xl">
                                <Text className="text-gray-500 dark:text-gray-400 mb-2">No routines yet.</Text>
                                <TouchableOpacity onPress={handleCreateRoutine} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
                                    <Text className="text-apptext dark:text-apptext_dark">Create a Routine</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={routines.slice(0, 5)}
                                scrollEnabled={false}
                                keyExtractor={(i) => i.id}
                                renderItem={({item}) => (
                                    <RoutineCard 
                                        routine={item} 
                                        onPress={() => startActiveRoutine(item.id)}
                                        onEdit={() => handleEditRoutine(item)}
                                        onDelete={() => deleteRoutine(item.id)}
                                    />
                                )}
                            />
                        )}
                    </View>
                    
			</ScrollView>

             {/* Workout Preview Modal */}
             <Modal
                transparent={true}
                visible={!!previewWorkout}
                animationType="slide"
                onRequestClose={() => setPreviewWorkout(null)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-background dark:bg-background_dark h-[60%] rounded-t-3xl overflow-hidden">
                        <View className="p-4 border-b border-border dark:border-border_dark flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-apptext dark:text-apptext_dark">
                                {previewWorkout?.name || "Workout Details"}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setPreviewWorkout(null)}
                                className="bg-surface dark:bg-surface_dark p-2 rounded-full"
                            >
                                <Text className="text-apptext dark:text-apptext_dark font-bold">Close</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-4">
                            {previewWorkout?.exercises?.map((ex, idx) => (
                                <View key={idx} className="mb-4 bg-surface dark:bg-surface_dark p-3 rounded-xl">
                                    <Text className="text-lg font-semibold text-apptext dark:text-apptext_dark">
                                        {ex.name}
                                    </Text>
                                    <Text className="text-gray-500">
                                        {ex.sets} Sets
                                    </Text>
                                    {ex.setTargets && ex.setTargets.length > 0 ? (
                                        <View className="mt-2 pl-2 border-l-2 border-primary dark:border-primary_dark">
                                            {ex.setTargets.map((set, sIdx) => (
                                                <Text key={sIdx} className="text-apptext dark:text-apptext_dark">
                                                    Set {sIdx + 1}: {set.weight ? `${set.weight}lbs x ` : ""}{set.reps || 0} reps
                                                </Text>
                                            ))}
                                        </View>
                                    ) : (
                                         <Text className="text-gray-500 mt-1">Target: {ex.reps} reps</Text>
                                    )}
                                </View>
                            ))}
                            <View className="h-10" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
		</ThemedView>
	);
}