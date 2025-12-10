import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Exercise } from '../hooks/useWorkoutManager'; 
import { createExercise, generateSummary } from '../app/(tabs)/workout.logic';

// Define the shape of our context
interface ActiveWorkoutContextType {
    exercises: Exercise[];
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
    isRunning: boolean;
    workoutSeconds: number;
    restSeconds: number;
    currentIndex: number;
    workoutName: string;
    setWorkoutName: (name: string) => void;
    startWorkout: () => void;
    pauseWorkout: () => void;
    resetWorkout: () => void;
    completeSet: (index: number, input?: { weight?: number; reps?: number; duration?: number; distance?: number }) => void;
    nextExercise: () => void;
    prevExercise: () => void;
    addExercise: (name: string, sets: string, reps: string) => void;
    updateExercise: (index: number, updates: Partial<Exercise>) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
    exportSummary: () => void;
    finishWorkout: () => void;
    cancelWorkout: () => void;
    hasActiveSession: boolean;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
    // State
    const [exercises, setExercises] = useState<Exercise[]>(() => [
		{id: "1", name: "Push Ups", sets: 3, reps: 12, completedSets: 0},
		{id: "2", name: "Squats", sets: 3, reps: 10, completedSets: 0},
		{id: "3", name: "Plank (sec)", sets: 3, reps: 45, completedSets: 0},
	]);
    const [workoutName, setWorkoutName] = useState("Current Workout");
    const [hasActiveSession, setHasActiveSession] = useState(false);
    
    const [isRunning, setRunning] = useState(false);
	const [workoutSeconds, setWorkoutSeconds] = useState(0);
	const workoutTimerRef = useRef<number | null>(null as any);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [restSeconds, setRestSeconds] = useState(0);
	const restTimerRef = useRef<number | null>(null as any);

    // Effects
    // Persist to local storage
    useEffect(() => {
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				window.localStorage.setItem("mycpo_workout_exercises", JSON.stringify(exercises));
			}
		} catch {
			// ignore
		}
	}, [exercises]);

    // Load from local storage (initial load handled by useState initializer usually, but strict mode might need checking. 
    // The original code passed an initializer that just returned the default. 
    // Let's match the original behavior or improve. 
    // Original: useState<Exercise[]>(() => [defaults]). 
    // It didn't seem to load from localStorage on mount in the original code shown? 
    // Wait, let me check the original code again in the view_file output.
    // Line 36: useState(() => [...defaults])
    // Line 77: useEffect to save.
    // It seems the original code actually DIDN'T load from local storage? Or maybe I missed it.
    // Checking the `hooks/useWorkoutManager.ts`... that loads saved workouts (templates), not the active one.
    // The `useEffect` on line 77 saves to `mycpo_workout_exercises`.
    // I don't see a `useEffect` that BUILDS the state from `mycpo_workout_exercises`.
    // Ah, if I look closely at the original `useState` for exercises...
    // Line 36: `useState<Exercise[]>(() => [ ... ])`.
    // It doesn't seem to read from localStorage. That might be a bug or intended to be ephemeral.
    // However, I see `useWorkoutManager` loading `mycpo_saved_workouts`.
    // Wait, if I want to persist the ACTIVE workout state, I should probably try to load it.
    // But to be safe and match "refactor" rules (preserve behavior), I will stick to what was there, 
    // UNLESS I see it reading it. I don't see it reading it.
    // BUT, the useEffect writes to it. Maybe I should implement the read to be helpful?
    // Let's stick to the current behavior: Default list. 
    // Actually, looking at the code, it writes but doesn't read. That's weird.
    // I will add the read to be nice, or just leave it. 
    // Let's stick to the extracted logic.

    // Timer Logic
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

    // Rest Timer Logic
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


    // Actions
    const startWorkout = useCallback(() => {
		if (exercises.length === 0) {
			Alert.alert("No exercises", "Please add at least one exercise.");
			return;
		}
		setRunning(true);
        setHasActiveSession(true);
        setIsExpanded(true);
	}, [exercises]);

    const pauseWorkout = useCallback(() => {
		setRunning(false);
	}, []);

    const resetWorkout = useCallback(() => {
		// Keep running (or start if paused) as per user request to "continue counting" after reset
		setRunning(true);
        // Ensure session determines visibility
        setHasActiveSession(true); 
        
		setWorkoutSeconds(0);
		setRestSeconds(0);
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
	}, []);

    // completeSet removed as we use handleCompleteSet below

    // Re-implementing functions to use current state
    const addExercise = (name: string, sets: string, reps: string) => {
        const ex = createExercise(name, sets, reps);
        // Ensure type compatibility by setting completedSets and logs explicitly if missing
		setExercises((e) => [...e, { ...ex, completedSets: 0, logs: [] }]);
	};

    const nextExercise = () => {
		setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1));
	};

	const prevExercise = () => {
		setCurrentIndex((i) => Math.max(0, i - 1));
	};

    const updateExercise = (index: number, updates: Partial<Exercise>) => {
        setExercises(current => 
            current.map((ex, i) => i === index ? { ...ex, ...updates } : ex)
        );
    };

    const handleCompleteSet = (targetIndex?: number, input?: { weight?: number; reps?: number; duration?: number; distance?: number }) => {
        const indexToComplete = targetIndex ?? currentIndex;
        
        setExercises(currentExercises => {
            return currentExercises.map((ex, idx) => {
                if (idx === indexToComplete) {
                    const currentSets = ex.completedSets || 0;
                    const logs = ex.logs || [];
                    
                    // Inputs are already numbers
                    const weight = input?.weight;
                    const reps = input?.reps; 
                    // Fallback to target reps if not provided
                    const finalReps = reps !== undefined ? reps : ex.reps;
                    
                    const newLog: any = {
                        id: Date.now().toString(),
                        weight,
                        reps: finalReps,
                        // duration...
                    };

                    return { 
                        ...ex, 
                        completedSets: currentSets + 1,
                        logs: [...logs, newLog]
                    };
                }
                return ex;
            });
        });

        // Rest timer logic remains...
        setRestSeconds(60); 
    };

    const exportSummary = () => {
        const json = generateSummary(workoutSeconds, exercises);
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


    // Overlay expansion state
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => setIsExpanded(prev => !prev);

    const handleFinishWorkout = useCallback(() => {
        // Here we actually stop everything
		setRunning(false);
		setWorkoutSeconds(0);
		setRestSeconds(0);
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
        
        setHasActiveSession(false);
        setIsExpanded(false);
    }, []);

    const handleCancelWorkout = useCallback(() => {
        // Cancel is effectively the same as finish for now (discard/reset)
        // But we separate it for future distinction (Finish = Save potentially)
        setRunning(false);
        setWorkoutSeconds(0);
        setRestSeconds(0);
        setCurrentIndex(0);
        setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
        
        setHasActiveSession(false);
        setIsExpanded(false);
    }, []);

    const value = {
        exercises,
        setExercises,
        isRunning,
        workoutSeconds,
        restSeconds,
        currentIndex,
        workoutName,
        startWorkout,
        pauseWorkout,
        resetWorkout,
        completeSet: handleCompleteSet,
        nextExercise,
        prevExercise,
        addExercise,
        updateExercise,
        exportSummary,
        finishWorkout: handleFinishWorkout,
        cancelWorkout: handleCancelWorkout,
        isExpanded,
        hasActiveSession,
        toggleExpanded,
        setExpanded: setIsExpanded,
        setWorkoutName,
    };

    return (
        <ActiveWorkoutContext.Provider value={value}>
            {children}
        </ActiveWorkoutContext.Provider>
    );
}

export function useActiveWorkout() {
    const context = useContext(ActiveWorkoutContext);
    if (context === undefined) {
        throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
    }
    return context;
}
