import React, {useState} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Modal,
 	TextInput,
 	Alert,
 	ActivityIndicator,
    ScrollView
} from "react-native";

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../../hooks/useWorkoutManager';

import { 
    createSequenceItem, 
    reorderSequence, 
} from '../../utils/workout-logic';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/workouts/RoutineCard';
import { ActiveRoutineCard } from '../../components/workouts/ActiveRoutineCard';

import { useFloatingButton } from '../../providers/FloatingButtonContext';



export default function Workout() {

	const theme = useTheme();
	const router = useRouter();
    const { setIsHidden } = useFloatingButton();
    
	// consume shared state
    const {
        setExercises,
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
                            setTimeout(() => startWorkout([]), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout([]);
        }
    };



	const [isCreateRoutineOpen, setCreateRoutineOpen] = useState(false);
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
	const [routineDraftName, setRoutineDraftName] = useState("");
	const [routineSequence, setRoutineSequence] = useState<any[]>([]);
	const [isWorkoutsListOpen, setWorkoutsListOpen] = useState(false);
	const [isRoutinesListOpen, setRoutinesListOpen] = useState(false);
    

    

    
    const { 
        savedWorkouts, 
        routines, 
        isSaving, 
        
        activeRoutine,
        startActiveRoutine,
        markRoutineDayComplete,
        clearActiveRoutine,
 
        deleteSavedWorkout, 
        saveRoutineDraft: saveRoutineDraftManager,
        updateRoutine,
        deleteRoutine,
    } = useWorkoutManager();

    // Toggle floating buttons visibility when modals are open
    React.useEffect(() => {
        setIsHidden(isWorkoutsListOpen || isCreateRoutineOpen || isRoutinesListOpen);
    }, [isWorkoutsListOpen, isCreateRoutineOpen, isRoutinesListOpen, setIsHidden]);


	function loadWorkout(id: string) {
        // Allow loading even if not "active" session (but might have default exercises)
        if (hasActiveSession) {
            Alert.alert(
                "Active Session", 
                "Please finish or cancel your current workout before loading a new one.",
                [
                    { text: "OK" }
                ]
            );
            return;
        }

		const w = savedWorkouts.find((x) => x.id === id);
		if (!w) return;
		setExercises(w.exercises || []);
		setWorkoutsListOpen(false);
		Alert.alert('Loaded', `Workout '${w.name}' loaded.`);
	}


    
    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    const timelineDays = activeRoutineObj?.sequence?.slice(dayIndex, dayIndex + 7) || [];
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());


	async function saveRoutineDraft() {
        const onSuccess = () => {
			setRoutineDraftName("");
			setRoutineSequence([]);
            setEditingRoutineId(null);
			setCreateRoutineOpen(false);
		};

        if (editingRoutineId) {
            updateRoutine(editingRoutineId, routineDraftName, routineSequence, onSuccess);
        } else {
            saveRoutineDraftManager(routineDraftName, routineSequence, onSuccess);
        }
	}

    function handleEditRoutine(routine: any) {
        setEditingRoutineId(routine.id);
        setRoutineDraftName(routine.name);
        setRoutineSequence(routine.sequence ? [...routine.sequence] : []);
        setCreateRoutineOpen(true);
    }

    function handleCloseRoutineModal() {
        setCreateRoutineOpen(false);
        setRoutineSequence([]);
        setRoutineDraftName('');
        setEditingRoutineId(null);
    }

	function addDayToSequence(item: any) {
		const newItem = createSequenceItem(item);
		setRoutineSequence((s) => [...s, newItem]);
	}

	function moveSequenceItem(index: number, dir: -1 | 1) {
		setRoutineSequence((s) => reorderSequence(s, index, dir));
	}

	function removeSequenceItem(id: string) {
		setRoutineSequence((s) => s.filter((x) => x.id !== id));
	}






    const handleStartSavedWorkout = (workout: any) => {
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
                            setTimeout(() => startWorkout(workout.exercises), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout(workout.exercises);
        }
    };

    function handleCreateSavedWorkout() {
        router.push('/create-workout');
    }

    function handleEditSavedWorkout(workout: any) {
        router.push({ pathname: '/create-workout', params: { id: workout.id } });
    }

	return (
		<SafeAreaView className="flex-1 bg-background dark:bg-background_dark" edges={['top', 'left', 'right']}>
			<View className="flex-1 px-4 pt-4">
				<View className="flex-row justify-between items-center">
					<Text className="text-2xl font-bold text-apptext dark:text-apptext_dark">Workout</Text>
				</View>

			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView 
				className="flex-1 mt-3"
				contentContainerStyle={{paddingBottom: 120, flexGrow: 1}}
				showsVerticalScrollIndicator={false}
			>
				{/* Controls Row */}
				<View className="flex-row gap-2 my-3">
					<TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={handleStartEmpty} accessibilityLabel="Start empty workout">
						<Text className="text-apptext dark:text-apptext_dark">Start Empty</Text>
					</TouchableOpacity>
					<TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={() => router.push('/workout-history' as any)} accessibilityLabel="History">
						<Text className="text-apptext dark:text-apptext_dark">History</Text>
					</TouchableOpacity>
				</View>
					
                    {/* Saved Workouts Section (Quick Access) */}
                    <View className="flex-row justify-between items-center mb-3">
                         <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">Saved Workouts</Text>
                         <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={handleCreateSavedWorkout}>
                                <Text className="text-primary dark:text-primary_dark">+ New</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setWorkoutsListOpen(true)}>
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
							renderItem={({item}) => (
								<View 
									className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-3 border border-black/5 dark:border-white/10 shadow-sm"
								>
                                    <View className="flex-row justify-between items-center mb-0">
                                        <TouchableOpacity 
                                            className="flex-1 mr-2"
                                            onPress={() => loadWorkout(item.id)}
                                        >
                                            <Text className="font-semibold text-apptext dark:text-apptext_dark text-lg mb-1" numberOfLines={1}>{item.name}</Text>
                                            <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.exercises?.length || 0} Exercises</Text>
                                        </TouchableOpacity>
                                        
                                        <View className="flex-row items-center gap-2">
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    console.log("Edit button pressed for:", item.name);
                                                    handleEditSavedWorkout(item);
                                                }}
                                                className="bg-primary dark:bg-primary_dark px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-semibold">Edit</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity 
                                                onPress={() => handleStartSavedWorkout(item)}
                                                className="bg-primary dark:bg-primary_dark px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-semibold">Start</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
								</View>
							)}
						/>
                    )}

                    <View className="h-6" />

                    {/* Active Routine Section */}
                    {activeRoutineObj ? (
                        <ActiveRoutineCard
                            activeRoutineObj={activeRoutineObj}
                            timelineDays={timelineDays}
                            dayIndex={dayIndex}
                            isDayCompleted={isDayCompleted}
                            onClearRoutine={clearActiveRoutine}
                            onStartWorkout={(exercises) => startWorkout(exercises)}
                            onMarkComplete={markRoutineDayComplete}
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

                    {/* Routines Section */}
                    <View className="flex-row justify-between items-center mb-3 mt-6">
                        <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">My Routines</Text>
                         <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={() => setCreateRoutineOpen(true)}>
                                <Text className="text-primary dark:text-primary_dark">+ New</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setRoutinesListOpen(true)}>
                                <Text className="text-primary dark:text-primary_dark">See All</Text>
                            </TouchableOpacity>
                         </View>
                    </View>
                    
                    {routines.length === 0 ? (
                        <View className="p-4 items-center justify-center border border-dashed border-surface dark:border-surface_dark rounded-xl">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2">No routines yet.</Text>
                            <TouchableOpacity onPress={() => setCreateRoutineOpen(true)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
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
                                />
                            )}
                        />
                    )}
                    
			</ScrollView>
			</View>

			{/* Saved Workouts modal */}
			<Modal visible={isWorkoutsListOpen} animationType="slide" transparent={true}>
				<View className="flex-1 justify-center items-center bg-black/40">
					<View className="w-[90%] p-4 rounded-xl bg-background dark:bg-background_dark max-h-[80%]">
						<Text className="text-lg font-bold mb-2 text-apptext dark:text-apptext_dark">Saved Workouts</Text>
						{savedWorkouts.length === 0 ? (
							<Text className="text-gray-500 dark:text-gray-400">No saved workouts</Text>
						) : (
							<FlatList
								data={savedWorkouts}
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<View className="flex-row items-center justify-between py-2">
										<View>
											<Text className="text-apptext dark:text-apptext_dark font-semibold">{item.name}</Text>
											<Text className="text-gray-500 dark:text-gray-400 text-xs">{new Date(item.createdAt).toLocaleString()}</Text>
										</View>
										<View className="flex-row">
											<TouchableOpacity onPress={() => loadWorkout(item.id)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark mr-2 bg-background dark:bg-background_dark"> 
												<Text className="text-apptext dark:text-apptext_dark">Load</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => deleteSavedWorkout(item.id)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
												<Text className="text-apptext dark:text-apptext_dark">Delete</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}
						<View className="flex-row justify-end mt-3">
							<TouchableOpacity onPress={() => setWorkoutsListOpen(false)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
								<Text className="text-apptext dark:text-apptext_dark">Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Create/Edit routine (schedule) modal */}
			<Modal visible={isCreateRoutineOpen} animationType="slide" transparent={true}>
				<View className="flex-1 justify-center items-center bg-black/40">
					<View className="w-[90%] p-4 rounded-xl bg-background dark:bg-background_dark max-h-[85%]">
						<Text className="text-lg font-bold mb-2 text-apptext dark:text-apptext_dark">{editingRoutineId ? 'Edit Routine' : 'Create Routine'}</Text>
						<TextInput placeholder="Routine name" value={routineDraftName} onChangeText={setRoutineDraftName} className="border border-surface dark:border-surface_dark rounded-lg p-2.5 mb-2 text-apptext dark:text-apptext_dark" placeholderTextColor="#9CA3AF" />
						<Text className="text-gray-500 dark:text-gray-400 mb-2">Add days from saved workouts or add Rest days.</Text>
						<View className="flex-row gap-2 mb-2">
							<FlatList
								data={savedWorkouts}
								horizontal
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<TouchableOpacity onPress={() => addDayToSequence(item)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark mr-2 bg-background dark:bg-background_dark"> 
										<Text className="text-apptext dark:text-apptext_dark">{item.name}</Text>
									</TouchableOpacity>
								)}
							/>
							<TouchableOpacity onPress={() => addDayToSequence('rest')} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
								<Text className="text-apptext dark:text-apptext_dark">Rest</Text>
							</TouchableOpacity>
						</View>

						{routineSequence.length === 0 ? (
							<Text className="text-gray-500 dark:text-gray-400">No days added</Text>
						) : (
							<FlatList
								data={routineSequence}
								keyExtractor={(i) => i.id}
								renderItem={({item, index}) => (
									<View className="flex-row items-center justify-between py-1.5">
										<View>
											<Text className="text-apptext dark:text-apptext_dark font-semibold">{index + 1}. {item.name}</Text>
											<Text className="text-gray-500 dark:text-gray-400 text-xs">{item.type === 'rest' ? 'Rest day' : `Workout: ${item.name}`}</Text>
										</View>
										<View className="flex-row">
											<TouchableOpacity onPress={() => moveSequenceItem(index, -1)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark mr-1.5 bg-background dark:bg-background_dark"> 
												<Text className="text-apptext dark:text-apptext_dark">↑</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => moveSequenceItem(index, 1)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark mr-1.5 bg-background dark:bg-background_dark"> 
												<Text className="text-apptext dark:text-apptext_dark">↓</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => removeSequenceItem(item.id)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark"> 
												<Text className="text-apptext dark:text-apptext_dark">Remove</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}

						<View className="flex-row justify-between items-center mt-3">
                            {editingRoutineId ? (
                                <TouchableOpacity 
                                    onPress={() => {
                                        // Close modal after delete
                                        deleteRoutine(editingRoutineId, () => {
                                             handleCloseRoutineModal();
                                        });
                                    }} 
                                    style={{borderColor: theme.options?.destructiveColor || '#ff4444'}}
									className="p-2.5 rounded-lg border bg-background dark:bg-background_dark"
                                >
                                    <Text style={{color: theme.options?.destructiveColor || '#ff4444'}}>Delete</Text>
                                </TouchableOpacity>
                            ) : (
                                <View />
                            )}

                             <View className="flex-row">
                                <TouchableOpacity onPress={handleCloseRoutineModal} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark mr-2 bg-background dark:bg-background_dark"> 
                                    <Text className="text-apptext dark:text-apptext_dark">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={isSaving} onPress={saveRoutineDraft} className={`p-2.5 rounded-lg bg-primary dark:bg-primary_dark ${isSaving ? 'opacity-60' : ''}`}>
                                    {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{editingRoutineId ? 'Save Changes' : 'Create Routine'}</Text>}
                                </TouchableOpacity>
                            </View>
						</View>
					</View>
				</View>
			</Modal>

            {/* Routines List Modal */}
            <Modal visible={isRoutinesListOpen} animationType="slide" transparent={true}>
                <View className="flex-1 justify-center items-center bg-black/40">
                    <View className="w-[90%] p-4 rounded-xl bg-background dark:bg-background_dark max-h-[80%]">
                        <Text className="text-lg font-bold mb-2 text-apptext dark:text-apptext_dark">My Routines</Text>
                        {routines.length === 0 ? (
                            <Text className="text-gray-500 dark:text-gray-400">No routines found.</Text>
                        ) : (
                            <FlatList
                                data={routines}
                                keyExtractor={(i) => i.id}
                                renderItem={({item}) => (
                                    <View className="flex-row items-center justify-between py-2 border-b border-surface dark:border-surface_dark">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-apptext dark:text-apptext_dark font-semibold text-base" numberOfLines={1}>{item.name}</Text>
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs">{item.sequence?.length || 0} Days</Text>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    startActiveRoutine(item.id);
                                                    setRoutinesListOpen(false);
                                                }}
                                                className="bg-primary dark:bg-primary_dark px-3 py-1.5 rounded-lg"
                                            > 
                                                <Text className="text-white text-xs font-semibold">Active</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => deleteRoutine(item.id)}
                                                className="p-1.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark justify-center"
                                            >
                                                <Text className="text-red-500 font-bold text-xs">Del</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                        <View className="flex-row justify-end mt-3">
                            <TouchableOpacity onPress={() => setRoutinesListOpen(false)} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
                                <Text className="text-apptext dark:text-apptext_dark">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>





		</SafeAreaView>

	);
}



