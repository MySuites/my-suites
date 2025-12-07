"use client"

import React, {useEffect, useRef, useState} from "react";
import {
 	View,
 	Text,
 	StyleSheet,
 	FlatList,
 	TouchableOpacity,
 	Modal,
 	TextInput,
 	Alert,
 	ActivityIndicator,
} from "react-native";

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { formatSeconds } from '../../utils/formatting';
import { useWorkoutManager, Exercise } from '../../hooks/useWorkoutManager';

import { 
    createExercise, 
    createSequenceItem, 
    reorderSequence, 
    calculateNextWorkoutState, 
    generateSummary 
} from './workout.logic';

// --- Component ---

export default function Workout() {

	const theme = useTheme();
	const router = useRouter();
	const [exercises, setExercises] = useState<Exercise[]>(() => [
		{id: "1", name: "Push Ups", sets: 3, reps: 12, completedSets: 0},
		{id: "2", name: "Squats", sets: 3, reps: 10, completedSets: 0},
		{id: "3", name: "Plank (sec)", sets: 3, reps: 45, completedSets: 0},
	]);

	const [isAddModalOpen, setAddModalOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newSets, setNewSets] = useState("3");
	const [newReps, setNewReps] = useState("10");

	// Saved workouts (templates) and routines (schedules)
	const [isSaveWorkoutModalOpen, setSaveModalOpen] = useState(false);
	const [workoutName, setRoutineName] = useState("");
	const [isLoadModalOpen, setLoadModalOpen] = useState(false);

	// Create routine (schedule) modal
	const [isCreateRoutineOpen, setCreateRoutineOpen] = useState(false);
	const [routineDraftName, setRoutineDraftName] = useState("");
	const [routineSequence, setRoutineSequence] = useState<any[]>([]);
	const [isWorkoutsListOpen, setWorkoutsListOpen] = useState(false);
    
    const { 
        savedWorkouts, 
        routines, 
        isSaving, 
        saveWorkout: saveWorkoutManager, 
        deleteSavedWorkout, 
        saveRoutineDraft: saveRoutineDraftManager, 
        deleteRoutine 
    } = useWorkoutManager();

	const [isRunning, setRunning] = useState(false);
	const [workoutSeconds, setWorkoutSeconds] = useState(0);
	const workoutTimerRef = useRef<number | null>(null as any);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [restSeconds, setRestSeconds] = useState(0);
	const restTimerRef = useRef<number | null>(null as any);

	// Effect: Persist current exercises state to localStorage for data persistence across reloads (web only).
	useEffect(() => {
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				window.localStorage.setItem("mycpo_workout_exercises", JSON.stringify(exercises));
			}
		} catch {
			// ignore
		}
	}, [exercises]);

    // Effect: Manage the workout timer interval. Increments workoutSeconds every second while isRunning is true.
	useEffect(() => {
		if (isRunning) {
			workoutTimerRef.current = setInterval(() => {
				setWorkoutSeconds((s) => s + 1);
			}, 1000) as any;
		} else if (workoutTimerRef.current) {
			clearInterval(workoutTimerRef.current as any);
			workoutTimerRef.current = null;
		}

		return () => {
			if (workoutTimerRef.current) clearInterval(workoutTimerRef.current as any);
		};
	}, [isRunning]);

    // Effect: Manage the rest timer countdown. Decrements restSeconds every second until it reaches 0.
	useEffect(() => {
		if (restSeconds > 0) {
			restTimerRef.current = setInterval(() => {
				setRestSeconds((r) => {
					if (r <= 1) {
						clearInterval(restTimerRef.current as any);
						restTimerRef.current = null;
						return 0;
					}
					return r - 1;
				});
			}, 1000) as any;
		}

		return () => {
			if (restTimerRef.current) clearInterval(restTimerRef.current as any);
		};
	}, [restSeconds]);

	function addExercise() {
        const ex = createExercise(newName, newSets, newReps);
		setExercises((e) => [...e, ex]);
		setNewName("");
		setNewSets("3");
		setNewReps("10");
		setAddModalOpen(false);
	}

	async function saveWorkout() {
        saveWorkoutManager(workoutName, exercises, () => {
            setRoutineName("");
            setSaveModalOpen(false);
        });
	}

	function loadWorkout(id: string) {
		const w = savedWorkouts.find((x) => x.id === id);
		if (!w) return;
		setExercises(w.exercises || []);
		setWorkoutsListOpen(false);
		Alert.alert('Loaded', `Workout '${w.name}' loaded.`);
	}

	function loadRoutine(id: string) {
	const r = routines.find((x) => x.id === id);
	if (!r) return;
	// load first day's workout into current exercises for quick preview
	if (r.sequence && r.sequence.length > 0) {
		const first = r.sequence[0];
		if (first.type === 'workout' && first.workout) {
			setExercises(first.workout.exercises || []);
		}
	}
	setLoadModalOpen(false);
	Alert.alert("Loaded", `Routine '${r.name}' loaded (first day shown).`);
	}

	async function saveRoutineDraft() {
		saveRoutineDraftManager(routineDraftName, routineSequence, () => {
			setRoutineDraftName("");
			setRoutineSequence([]);
			setCreateRoutineOpen(false);
		});
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

	function startWorkout() {
		if (exercises.length === 0) {
			Alert.alert("No exercises", "Please add at least one exercise.");
			return;
		}
		setRunning(true);
	}

	function pauseWorkout() {
		setRunning(false);
	}

	function resetWorkout() {
		setRunning(false);
		setWorkoutSeconds(0);
		setRestSeconds(0);
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0})));
	}

	function completeSet() {
        const { updatedExercises, nextIndex, shouldRest } = calculateNextWorkoutState(exercises, currentIndex);
        setExercises(updatedExercises);
        setCurrentIndex(nextIndex);
        if (shouldRest) {
            setRestSeconds(60);
        }
	}

	function nextExercise() {
		setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1));
	}

	function prevExercise() {
		setCurrentIndex((i) => Math.max(0, i - 1));
	}

	function exportSummary() {
        const json = generateSummary(workoutSeconds, exercises);
		// Try to copy to clipboard or open share — best-effort
		try {
			if (typeof navigator !== "undefined" && (navigator as any).clipboard) {
				(navigator as any).clipboard.writeText(json);
				Alert.alert("Summary copied", "Workout summary JSON copied to clipboard.");
				return;
			}
		} catch {
			// fall through
		}

		Alert.alert("Workout Summary", json.slice(0, 1000));
	}

	const current = exercises[currentIndex];

	const styles = makeStyles(theme);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Workout</Text>
				<Text style={styles.timer}>Total: {formatSeconds(workoutSeconds)}</Text>
			</View>

			<View style={styles.controlsRow}>
				<TouchableOpacity style={styles.controlButton} onPress={() => setAddModalOpen(true)} accessibilityLabel="Add exercise">
					<Text style={styles.controlText}>+ Add</Text>
				</TouchableOpacity>
				{!isRunning ? (
					<TouchableOpacity style={styles.controlButtonPrimary} onPress={startWorkout} accessibilityLabel="Start workout">
						<Text style={styles.controlTextPrimary}>Start</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity style={styles.controlButton} onPress={pauseWorkout} accessibilityLabel="Pause workout">
						<Text style={styles.controlText}>Pause</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity style={styles.controlButton} onPress={resetWorkout} accessibilityLabel="Reset workout">
					<Text style={styles.controlText}>Reset</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.controlButton} onPress={exportSummary} accessibilityLabel="Export summary">
					<Text style={styles.controlText}>Export</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.controlButton} onPress={() => setSaveModalOpen(true)} accessibilityLabel="Save workout">
					<Text style={styles.controlText}>Save</Text>
				</TouchableOpacity>
					<TouchableOpacity style={styles.controlButton} onPress={() => setWorkoutsListOpen(true)} accessibilityLabel="Workouts">
						<Text style={styles.controlText}>Workouts</Text>
					</TouchableOpacity>
				<TouchableOpacity style={styles.controlButton} onPress={() => setCreateRoutineOpen(true)} accessibilityLabel="Create routine">
					<Text style={styles.controlText}>Create Routine</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.controlButton} onPress={() => setLoadModalOpen(true)} accessibilityLabel="Load routine">
					<Text style={styles.controlText}>Load</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.controlButton} onPress={() => router.push('/workout-history' as any)} accessibilityLabel="History">
					<Text style={styles.controlText}>History</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.currentContainer}>
				<Text style={styles.sectionTitle}>Current</Text>
				{current ? (
					<View style={styles.currentCard}>
						<Text style={styles.currentName}>{current.name}</Text>
						<Text style={styles.currentInfo}>
							Sets: {current.completedSets || 0} / {current.sets} • Reps: {current.reps}
						</Text>

						<View style={styles.currentActions}>
							<TouchableOpacity style={styles.actionBtn} onPress={prevExercise} accessibilityLabel="Previous exercise">
								<Text>◀ Prev</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.actionBtnPrimary} onPress={completeSet} accessibilityLabel="Complete set">
								<Text style={styles.controlTextPrimary}>Complete Set</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.actionBtn} onPress={nextExercise} accessibilityLabel="Next exercise">
								<Text>Next ▶</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.restText}>Rest: {restSeconds > 0 ? formatSeconds(restSeconds) : "—"}</Text>
					</View>
				) : (
					<Text style={{color: theme.icon}}>No current exercise</Text>
				)}
			</View>

			<View style={styles.listContainer}>
				<Text style={styles.sectionTitle}>Exercises</Text>
				<FlatList
					data={exercises}
					keyExtractor={(i) => i.id}
					renderItem={({item, index}) => (
						<View style={[styles.item, index === currentIndex ? styles.itemActive : null]}>
							<View style={{flex: 1}}>
								<Text style={styles.itemName}>{item.name}</Text>
									<Text style={styles.itemMeta}>Sets: {item.sets} • Reps: {item.reps}</Text>
							</View>
							<Text style={styles.itemDone}>{(item.completedSets || 0)}/{item.sets}</Text>
						</View>
					)}
				/>
			</View>

			<Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
					<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Add Exercise</Text>
						<TextInput placeholder="Name" value={newName} onChangeText={setNewName} style={styles.input} />
						<TextInput placeholder="Sets" value={newSets} onChangeText={setNewSets} style={styles.input} keyboardType="number-pad" />
						<TextInput placeholder="Reps" value={newReps} onChangeText={setNewReps} style={styles.input} keyboardType="number-pad" />

						<View style={{flexDirection: "row", justifyContent: "flex-end"}}>
							<TouchableOpacity onPress={() => setAddModalOpen(false)} style={[styles.controlButton, {marginRight: 8}]}> 
								<Text>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={addExercise} style={styles.controlButtonPrimary}>
								<Text style={styles.controlTextPrimary}>Add</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Saved Workouts modal */}
			<Modal visible={isWorkoutsListOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, {maxHeight: '80%'}]}>
						<Text style={styles.modalTitle}>Saved Workouts</Text>
						{savedWorkouts.length === 0 ? (
							<Text style={{color: theme.icon}}>No saved workouts</Text>
						) : (
							<FlatList
								data={savedWorkouts}
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8}}>
										<View>
											<Text style={{color: theme.text, fontWeight: '600'}}>{item.name}</Text>
											<Text style={{color: theme.icon, fontSize: 12}}>{new Date(item.createdAt).toLocaleString()}</Text>
										</View>
										<View style={{flexDirection: 'row'}}>
											<TouchableOpacity onPress={() => loadWorkout(item.id)} style={[styles.controlButton, {marginRight: 8}]}> 
												<Text style={styles.controlText}>Load</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => deleteSavedWorkout(item.id)} style={styles.controlButton}>
												<Text style={styles.controlText}>Delete</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}
						<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12}}>
							<TouchableOpacity onPress={() => setWorkoutsListOpen(false)} style={styles.controlButton}>
								<Text style={styles.controlText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Create routine (schedule) modal */}
			<Modal visible={isCreateRoutineOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, {maxHeight: '85%'}]}>
						<Text style={styles.modalTitle}>Create Routine</Text>
						<TextInput placeholder="Routine name" value={routineDraftName} onChangeText={setRoutineDraftName} style={styles.input} />
						<Text style={{color: theme.icon, marginBottom: 8}}>Add days from saved workouts or add Rest days.</Text>
						<View style={{flexDirection: 'row', gap: 8, marginBottom: 8}}>
							<FlatList
								data={savedWorkouts}
								horizontal
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<TouchableOpacity onPress={() => addDayToSequence(item)} style={[styles.controlButton, {marginRight: 8}]}> 
										<Text style={styles.controlText}>{item.name}</Text>
									</TouchableOpacity>
								)}
							/>
							<TouchableOpacity onPress={() => addDayToSequence('rest')} style={styles.controlButton}>
								<Text style={styles.controlText}>Rest</Text>
							</TouchableOpacity>
						</View>

						{routineSequence.length === 0 ? (
							<Text style={{color: theme.icon}}>No days added</Text>
						) : (
							<FlatList
								data={routineSequence}
								keyExtractor={(i) => i.id}
								renderItem={({item, index}) => (
									<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6}}>
										<View>
											<Text style={{color: theme.text, fontWeight: '600'}}>{index + 1}. {item.name}</Text>
											<Text style={{color: theme.icon, fontSize: 12}}>{item.type === 'rest' ? 'Rest day' : `Workout: ${item.name}`}</Text>
										</View>
										<View style={{flexDirection: 'row'}}>
											<TouchableOpacity onPress={() => moveSequenceItem(index, -1)} style={[styles.controlButton, {marginRight: 6}]}> 
												<Text style={styles.controlText}>↑</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => moveSequenceItem(index, 1)} style={[styles.controlButton, {marginRight: 6}]}> 
												<Text style={styles.controlText}>↓</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => removeSequenceItem(item.id)} style={styles.controlButton}> 
												<Text style={styles.controlText}>Remove</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}

						<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12}}>
							<TouchableOpacity onPress={() => { setCreateRoutineOpen(false); setRoutineSequence([]); setRoutineDraftName(''); }} style={[styles.controlButton, {marginRight: 8}]}> 
								<Text>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity disabled={isSaving} onPress={saveRoutineDraft} style={[styles.controlButtonPrimary, isSaving ? styles.controlButtonDisabled : null]}>
								{isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.controlTextPrimary}>Save Routine</Text>}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Save workout modal */}
			<Modal visible={isSaveWorkoutModalOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Save Workout</Text>
						<TextInput placeholder="Workout name" value={workoutName} onChangeText={setRoutineName} style={styles.input} />
						<View style={{flexDirection: "row", justifyContent: "flex-end"}}>
							<TouchableOpacity onPress={() => setSaveModalOpen(false)} style={[styles.controlButton, {marginRight: 8}]}> 
								<Text>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity disabled={isSaving} onPress={saveWorkout} style={[styles.controlButtonPrimary, isSaving ? styles.controlButtonDisabled : null]}>
								{isSaving ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Text style={styles.controlTextPrimary}>Save</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Load routine modal */}
			<Modal visible={isLoadModalOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, {maxHeight: '80%'}]}>
						<Text style={styles.modalTitle}>Saved Routines</Text>
						{routines.length === 0 ? (
							<Text style={{color: theme.icon}}>No saved routines</Text>
						) : (
							<FlatList
								data={routines}
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8}}>
										<View>
											<Text style={{color: theme.text, fontWeight: '600'}}>{item.name}</Text>
											<Text style={{color: theme.icon, fontSize: 12}}>{new Date(item.createdAt).toLocaleString()}</Text>
										</View>
										<View style={{flexDirection: 'row'}}>
											<TouchableOpacity onPress={() => loadRoutine(item.id)} style={[styles.controlButton, {marginRight: 8}]}>
												<Text style={styles.controlText}>Load</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => deleteRoutine(item.id)} style={styles.controlButton}>
												<Text style={styles.controlText}>Delete</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}
						<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12}}>
							<TouchableOpacity onPress={() => setLoadModalOpen(false)} style={styles.controlButton}>
								<Text style={styles.controlText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>

	);
}

const makeStyles = (theme: any) =>
	StyleSheet.create({
		container: {flex: 1, padding: 16, backgroundColor: theme.background},
		header: {flexDirection: "row", justifyContent: "space-between", alignItems: "center"},
		title: {fontSize: 28, fontWeight: "700", color: theme.text},
		timer: {fontSize: 14, color: theme.icon},
		controlsRow: {flexDirection: "row", gap: 8, marginVertical: 12},
		controlButton: {padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.surface, marginRight: 8, backgroundColor: theme.background},
		controlButtonDisabled: {opacity: 0.6},
		controlButtonPrimary: {padding: 10, borderRadius: 8, backgroundColor: theme.primary},
		controlText: {color: theme.text},
		controlTextPrimary: {color: '#fff', fontWeight: "600"},
		currentContainer: {marginVertical: 8},
		sectionTitle: {fontSize: 18, fontWeight: "600", marginBottom: 8, color: theme.text},
		currentCard: {padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.surface, backgroundColor: theme.surface},
		currentName: {fontSize: 20, fontWeight: "700", color: theme.text},
		currentInfo: {color: theme.icon, marginTop: 4},
		currentActions: {flexDirection: "row", justifyContent: "space-between", marginTop: 12},
		actionBtn: {padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.surface},
		actionBtnPrimary: {padding: 8, borderRadius: 8, backgroundColor: theme.primary},
		restText: {marginTop: 8, color: theme.icon},
		listContainer: {flex: 1, marginTop: 12},
		item: {padding: 12, borderBottomWidth: 1, borderBottomColor: theme.surface, flexDirection: "row", alignItems: "center"},
		itemActive: {backgroundColor: theme.surface},
		itemName: {fontSize: 16, fontWeight: "600", color: theme.text},
		itemMeta: {color: theme.icon},
		itemDone: {marginLeft: 12, color: theme.primary, fontWeight: "700"},
		modalBackdrop: {flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)"},
		modalCard: {width: "90%", padding: 16, borderRadius: 12, backgroundColor: theme.background},
		modalTitle: {fontSize: 18, fontWeight: "700", marginBottom: 8, color: theme.text},
		input: {borderWidth: 1, borderColor: theme.surface, borderRadius: 8, padding: 10, marginBottom: 8, color: theme.text},
	});

