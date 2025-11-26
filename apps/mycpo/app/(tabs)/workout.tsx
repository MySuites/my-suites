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
} from "react-native";

import { SafeAreaView } from 'react-native-safe-area-context';

type Exercise = {
	id: string;
	name: string;
	sets: number;
	reps: number;
	completedSets?: number;
};

function formatSeconds(s: number) {
	const mm = Math.floor(s / 60)
		.toString()
		.padStart(2, "0");
	const ss = Math.floor(s % 60)
		.toString()
		.padStart(2, "0");
	return `${mm}:${ss}`;
}

export default function Workout() {
	const [exercises, setExercises] = useState<Exercise[]>(() => [
		{id: "1", name: "Push Ups", sets: 3, reps: 12, completedSets: 0},
		{id: "2", name: "Squats", sets: 3, reps: 10, completedSets: 0},
		{id: "3", name: "Plank (sec)", sets: 3, reps: 45, completedSets: 0},
	]);

	const [isAddModalOpen, setAddModalOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newSets, setNewSets] = useState("3");
	const [newReps, setNewReps] = useState("10");

	const [isRunning, setRunning] = useState(false);
	const [workoutSeconds, setWorkoutSeconds] = useState(0);
	const workoutTimerRef = useRef<number | null>(null as any);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [restSeconds, setRestSeconds] = useState(0);
	const restTimerRef = useRef<number | null>(null as any);

	// Persist to localStorage when available (web). Best-effort only.
	useEffect(() => {
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				window.localStorage.setItem("mycpo_workout_exercises", JSON.stringify(exercises));
			}
		} catch {
			// ignore
		}
	}, [exercises]);

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
		const sets = Math.max(1, Number(newSets) || 1);
		const reps = Math.max(1, Number(newReps) || 1);
		const id = Date.now().toString();
		const ex: Exercise = {id, name: newName || `Exercise ${id}`, sets, reps, completedSets: 0};
		setExercises((e) => [...e, ex]);
		setNewName("");
		setNewSets("3");
		setNewReps("10");
		setAddModalOpen(false);
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
		setExercises((exs) => {
			const copy = exs.map((x) => ({...x}));
			const cur = copy[currentIndex];
			if (!cur) return exs;
			cur.completedSets = (cur.completedSets || 0) + 1;
			// start rest by default 60s
			setRestSeconds(60);
			// if completed all sets, advance to next exercise
			if (cur.completedSets >= cur.sets) {
				const next = Math.min(copy.length - 1, currentIndex + 1);
				setCurrentIndex(next);
			}
			return copy;
		});
	}

	function nextExercise() {
		setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1));
	}

	function prevExercise() {
		setCurrentIndex((i) => Math.max(0, i - 1));
	}

	function exportSummary() {
		const summary = {
			totalTime: workoutSeconds,
			exercises,
			startedAt: new Date().toISOString(),
		};
		const json = JSON.stringify(summary, null, 2);
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
								<Text style={{color: "white"}}>Complete Set</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.actionBtn} onPress={nextExercise} accessibilityLabel="Next exercise">
								<Text>Next ▶</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.restText}>Rest: {restSeconds > 0 ? formatSeconds(restSeconds) : "—"}</Text>
					</View>
				) : (
					<Text style={{color: "#666"}}>No current exercise</Text>
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
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {flex: 1, padding: 16, backgroundColor: "#fff"},
	header: {flexDirection: "row", justifyContent: "space-between", alignItems: "center"},
	title: {fontSize: 28, fontWeight: "700"},
	timer: {fontSize: 14, color: "#666"},
	controlsRow: {flexDirection: "row", gap: 8, marginVertical: 12},
	controlButton: {padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", marginRight: 8},
	controlButtonPrimary: {padding: 10, borderRadius: 8, backgroundColor: "#0a84ff"},
	controlText: {color: "#111"},
	controlTextPrimary: {color: "white", fontWeight: "600"},
	currentContainer: {marginVertical: 8},
	sectionTitle: {fontSize: 18, fontWeight: "600", marginBottom: 8},
	currentCard: {padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#eee", backgroundColor: "#fafafa"},
	currentName: {fontSize: 20, fontWeight: "700"},
	currentInfo: {color: "#444", marginTop: 4},
	currentActions: {flexDirection: "row", justifyContent: "space-between", marginTop: 12},
	actionBtn: {padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd"},
	actionBtnPrimary: {padding: 8, borderRadius: 8, backgroundColor: "#0a84ff"},
	restText: {marginTop: 8, color: "#999"},
	listContainer: {flex: 1, marginTop: 12},
	item: {padding: 12, borderBottomWidth: 1, borderBottomColor: "#f2f2f2", flexDirection: "row", alignItems: "center"},
	itemActive: {backgroundColor: "#f0f8ff"},
	itemName: {fontSize: 16, fontWeight: "600"},
	itemMeta: {color: "#666"},
	itemDone: {marginLeft: 12, color: "#0a84ff", fontWeight: "700"},
	modalBackdrop: {flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)"},
	modalCard: {width: "90%", padding: 16, borderRadius: 12, backgroundColor: "white"},
	modalTitle: {fontSize: 18, fontWeight: "700", marginBottom: 8},
	input: {borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 10, marginBottom: 8},
});

