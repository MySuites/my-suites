

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

import { useAuth } from '@mycsuite/auth'; // Added useAuth
import { IconSymbol } from '../../components/ui/icon-symbol'; // Added IconSymbol
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useWorkoutManager, fetchExercises } from '../../hooks/useWorkoutManager';

import { 
    createSequenceItem, 
    reorderSequence, 
} from '../../utils/workout-logic';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/workouts/RoutineCard';
import { ActiveRoutineCard } from '../../components/workouts/ActiveRoutineCard';

import { useFloatingButton } from '../../providers/FloatingButtonContext';

// --- Component ---

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
    
    // Edit Workout State
    const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
    const [workoutDraftName, setWorkoutDraftName] = useState("");
    const [workoutDraftExercises, setWorkoutDraftExercises] = useState<any[]>([]);
    const [isEditWorkoutModalOpen, setEditWorkoutModalOpen] = useState(false);
    
    // Add Exercise State (Edit Modal)
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
    
    const { user } = useAuth();
    
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
        updateSavedWorkout,
        saveWorkout, // Added saveWorkout
    } = useWorkoutManager();

    // Toggle floating buttons visibility when modals are open
    React.useEffect(() => {
        setIsHidden(isWorkoutsListOpen || isCreateRoutineOpen || isEditWorkoutModalOpen || isRoutinesListOpen);
    }, [isWorkoutsListOpen, isCreateRoutineOpen, isEditWorkoutModalOpen, isRoutinesListOpen, setIsHidden]);


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
        setEditingWorkoutId(null);
        setWorkoutDraftName("");
        setWorkoutDraftExercises([]);
        setEditWorkoutModalOpen(true);
    }

    function handleEditSavedWorkout(workout: any) {
        setEditingWorkoutId(workout.id);
        setWorkoutDraftName(workout.name);
        // Exercises array from saved workout
        setWorkoutDraftExercises(workout.exercises ? [...workout.exercises] : []);
        setEditWorkoutModalOpen(true);
    }

    function handleCloseWorkoutModal() {
        setEditWorkoutModalOpen(false);
        setWorkoutDraftExercises([]);
        setWorkoutDraftName('');
        setEditingWorkoutId(null);
        setIsAddingExercise(false);
        setExerciseSearchQuery("");
    }

    function removeWorkoutDraftExercise(index: number) {
        setWorkoutDraftExercises(prev => prev.filter((_, i) => i !== index));
    }

    function moveWorkoutDraftExercise(index: number, dir: -1 | 1) {
        const newArr = [...workoutDraftExercises];
        if (index + dir < 0 || index + dir >= newArr.length) return;
        const temp = newArr[index];
        newArr[index] = newArr[index + dir];
        newArr[index + dir] = temp;
        setWorkoutDraftExercises(newArr);
    }

    async function handleSaveWorkoutDraft() {
        const onSuccess = () => {
             handleCloseWorkoutModal();
        };

        if (editingWorkoutId) {
            updateSavedWorkout(editingWorkoutId, workoutDraftName, workoutDraftExercises, onSuccess);
        } else {
            saveWorkout(workoutDraftName, workoutDraftExercises, onSuccess);
        }
    }

    async function fetchAvailableExercises() {
        if (!user) return;
        setIsLoadingExercises(true);
        try {
             // Assuming fetchExercises is available and imported
             const { data } = await fetchExercises(user);
             setAvailableExercises(data || []);
        } catch (e) {
            console.error("Failed to fetch exercises", e);
        } finally {
            setIsLoadingExercises(false);
        }
    }

    function handleOpenAddExercise() {
        setIsAddingExercise(true);
        fetchAvailableExercises();
    }

    function handleAddExerciseToDraft(exercise: any) {
        // Add with default values
        const newExercise = {
            id: exercise.id, // Keep original ID reference if needed
            name: exercise.name,
            sets: 3,
            reps: 10,
            category: exercise.category,
            setTargets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 }))
        };
        setWorkoutDraftExercises(prev => [...prev, newExercise]);
        setIsAddingExercise(false);
        setExerciseSearchQuery("");
    }

    // Helper to update specific set in draft
    function updateSetTarget(exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
            // Ensure setTargets exists
            if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            const newTargets = [...ex.setTargets];
            newTargets[setIndex] = { ...newTargets[setIndex], [field]: Number(value) || 0 };
            ex.setTargets = newTargets;
            
            if (field === 'reps' && setIndex === 0) {
                ex.reps = Number(value) || 0;
            }
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    function addSetToDraft(exerciseIndex: number) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
             if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            // Add new set copying previous one or default
            const lastSet = ex.setTargets[ex.setTargets.length - 1] || { reps: 10, weight: 0 };
            ex.setTargets = [...ex.setTargets, { ...lastSet }];
            ex.sets = ex.setTargets.length;
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    function removeSetFromDraft(exerciseIndex: number, setIndex: number) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
             if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            if (ex.setTargets.length <= 1) {
                return newArr;
            }
            ex.setTargets = ex.setTargets.filter((_: any, i: number) => i !== setIndex);
            ex.sets = ex.setTargets.length;
            
            if (setIndex === 0 && ex.setTargets.length > 0) {
                 ex.reps = ex.setTargets[0].reps;
            }
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    // New State for expanded exercise in draft
    const [expandedDraftExerciseIndex, setExpandedDraftExerciseIndex] = useState<number | null>(null);

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
                        <Text className="text-gray-500 dark:text-gray-400">No saved workouts.</Text>
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
                                    // onLongPress={() => deleteRoutine(item.id)} // Moved to routines screen
                                    // onDelete={() => deleteRoutine(item.id)} // Moved to routines screen
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




            {/* Edit Saved Workout Modal */}
            <Modal visible={isEditWorkoutModalOpen} animationType="slide" transparent={true}>
                <View className="flex-1 justify-center items-center bg-black/40">
                    <View className="w-[90%] p-4 rounded-xl bg-background dark:bg-background_dark max-h-[85%] flex-1">
                        {isAddingExercise ? (
                            // --- Add Exercise View ---
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-lg font-bold text-apptext dark:text-apptext_dark">Add Exercise</Text>
                                    <TouchableOpacity onPress={() => setIsAddingExercise(false)}>
                                        <Text className="text-primary dark:text-primary_dark">Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <View className="flex-row items-center bg-surface dark:bg-surface_dark rounded-lg px-2.5 h-10 mb-4 border border-black/5 dark:border-white/10">
                                    <IconSymbol name="magnifyingglass" size={20} color={theme.icon || '#888'} />
                                    <TextInput
                                        className="flex-1 ml-2 text-base h-full text-apptext dark:text-apptext_dark"
                                        placeholder="Search exercises..."
                                        placeholderTextColor={theme.icon || '#888'}
                                        value={exerciseSearchQuery}
                                        onChangeText={setExerciseSearchQuery}
                                        autoCorrect={false}
                                    />
                                    {exerciseSearchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setExerciseSearchQuery('')}>
                                             <IconSymbol name="xmark.circle.fill" size={20} color={theme.icon || '#888'} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {isLoadingExercises ? (
                                    <ActivityIndicator size="large" color={theme.primary} className="mt-4" />
                                ) : (
                                    <FlatList
                                        data={availableExercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))}
                                        keyExtractor={(item) => item.id}
                                        className="flex-1"
                                        renderItem={({ item }) => (
                                            <TouchableOpacity 
                                                className="flex-row items-center justify-between py-3 border-b border-surface dark:border-surface_dark"
                                                onPress={() => handleAddExerciseToDraft(item)}
                                            >
                                                <View>
                                                    <Text className="text-apptext dark:text-apptext_dark font-medium">{item.name}</Text>
                                                    <Text className="text-gray-500 dark:text-gray-400 text-xs">{item.category}</Text> 
                                                </View>
                                                <IconSymbol name="plus.circle" size={24} color={theme.primary} />
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <Text className="text-center text-gray-500 mt-4">No exercises found.</Text>
                                        }
                                    />
                                )}
                            </View>
                        ) : (
                            // --- Edit Workout View ---
                            <>
                                <Text className="text-lg font-bold mb-2 text-apptext dark:text-apptext_dark">{editingWorkoutId ? 'Edit Workout' : 'Create Workout'}</Text>
                                <TextInput 
                                    placeholder="Workout name" 
                                    value={workoutDraftName} 
                                    onChangeText={setWorkoutDraftName} 
                                    className="border border-surface dark:border-surface_dark rounded-lg p-2.5 mb-4 text-apptext dark:text-apptext_dark" 
                                    placeholderTextColor="#9CA3AF" 
                                />
                                
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="font-semibold text-apptext dark:text-apptext_dark">Exercises</Text>
                                    <TouchableOpacity onPress={handleOpenAddExercise}>
                                        <Text className="text-primary dark:text-primary_dark">+ Add Exercise</Text>
                                    </TouchableOpacity>
                                </View>
        

                                {workoutDraftExercises.length === 0 ? (
                                    <View className="flex-1 justify-center items-center py-8 border border-dashed border-surface dark:border-surface_dark rounded-lg mb-4">
                                        <Text className="text-gray-500 dark:text-gray-400 mb-2">No exercises</Text>
                                        <TouchableOpacity onPress={handleOpenAddExercise}>
                                            <Text className="text-primary dark:text-primary_dark">Add Exercise</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={workoutDraftExercises}
                                        keyExtractor={(item, index) => `${index}-${item.name}`} 
                                        className="flex-1 mb-4"
                                        renderItem={({item, index}) => {
                                            const isExpanded = expandedDraftExerciseIndex === index;
                                            // Initialize targets for display if missing
                                            const currentTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || 0, weight: 0 }));

                                            return (
                                            <View className="border-b border-surface dark:border-surface_dark">
                                                <TouchableOpacity 
                                                    onPress={() => setExpandedDraftExerciseIndex(isExpanded ? null : index)}
                                                    className="flex-row items-center justify-between py-3"
                                                >
                                                    <View className="flex-1 mr-2">
                                                        <Text className="text-apptext dark:text-apptext_dark font-medium text-base">{item.name}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-xs">
                                                            {item.sets} Sets {'•'} {item.reps} Reps {isExpanded ? '(Tap to collapse)' : '(Tap to edit sets)'}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-row items-center">
                                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); moveWorkoutDraftExercise(index, -1); }} className="p-2"> 
                                                            <Text className="text-apptext dark:text-apptext_dark">↑</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); moveWorkoutDraftExercise(index, 1); }} className="p-2"> 
                                                            <Text className="text-apptext dark:text-apptext_dark">↓</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); removeWorkoutDraftExercise(index); }} className="p-2 ml-1"> 
                                                            <Text className="text-red-500 font-bold">×</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </TouchableOpacity>
                                                
                                                {/* Expanded Set Editor */}
                                                {isExpanded && (
                                                    <View className="pl-4 pr-2 pb-3">
                                                        <View className="flex-row mb-2">
                                                            <Text className="w-10 text-xs text-gray-500 font-semibold text-center">Set</Text>
                                                            <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>
                                                            <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Weight</Text>
                                                            <View className="w-8" />
                                                        </View>
                                                        {currentTargets.map((set: any, setIdx: number) => (
                                                            <View key={setIdx} className="flex-row items-center mb-2">
                                                                <Text className="w-10 text-apptext dark:text-apptext_dark text-center font-medium">{setIdx + 1}</Text>
                                                                <View className="flex-1 flex-row justify-center">
                                                                     <TextInput 
                                                                        value={String(set.reps || 0)} 
                                                                        keyboardType="numeric"
                                                                        onChangeText={(v) => updateSetTarget(index, setIdx, 'reps', v)}
                                                                        className="bg-surface dark:bg-surfacemodal_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                                        selectTextOnFocus
                                                                    />
                                                                </View>
                                                                <View className="flex-1 flex-row justify-center">
                                                                     <TextInput 
                                                                        value={String(set.weight || 0)} 
                                                                        keyboardType="numeric"
                                                                        onChangeText={(v) => updateSetTarget(index, setIdx, 'weight', v)}
                                                                        className="bg-surface dark:bg-surfacemodal_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                                        selectTextOnFocus
                                                                    />
                                                                </View>
                                                                <TouchableOpacity 
                                                                    onPress={() => removeSetFromDraft(index, setIdx)}
                                                                    className="w-8 items-center justify-center bg-gray-100 dark:bg-white/5 rounded h-8 ml-2"
                                                                >
                                                                    <IconSymbol name="minus" size={12} color="#ff4444" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        ))}
                                                        <TouchableOpacity 
                                                            onPress={() => addSetToDraft(index)}
                                                            className="flex-row items-center justify-center p-2 mt-1 bg-surface dark:bg-white/5 rounded-lg border border-dashed border-black/10 dark:border-white/10"
                                                        >
                                                            <IconSymbol name="plus" size={14} color={theme.primary} />
                                                            <Text className="ml-2 text-sm text-primary dark:text-primary_dark font-medium">Add Set</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        )}}
                                    />
                                )}
        
                                <View className="flex-row justify-between items-center w-full pt-2 border-t border-surface dark:border-surface_dark mt-auto">
                                     {editingWorkoutId ? (
                                        <TouchableOpacity 
                                            onPress={() => {
                                                deleteSavedWorkout(editingWorkoutId, () => {
                                                     handleCloseWorkoutModal();
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
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity onPress={handleCloseWorkoutModal} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark"> 
                                            <Text className="text-apptext dark:text-apptext_dark">Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity disabled={isSaving} onPress={handleSaveWorkoutDraft} className={`p-2.5 rounded-lg bg-primary dark:bg-primary_dark ${isSaving ? 'opacity-60' : ''}`}>
                                            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{editingWorkoutId ? 'Save Changes' : 'Create Workout'}</Text>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
		</SafeAreaView>

	);
}



