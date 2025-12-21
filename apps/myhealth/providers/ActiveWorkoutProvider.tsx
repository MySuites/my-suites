import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Exercise, useWorkoutManager } from '../hooks/useWorkoutManager'; 
import { createExercise } from '../utils/workout-logic';

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
    startWorkout: (exercisesToStart?: Exercise[], name?: string) => void;
    pauseWorkout: () => void;
    resetWorkout: () => void;
    completeSet: (index: number, input?: { weight?: number; reps?: number; duration?: number; distance?: number }) => void;
    nextExercise: () => void;
    prevExercise: () => void;
    addExercise: (name: string, sets: string, reps: string, type?: string) => void;
    updateExercise: (index: number, updates: Partial<Exercise>) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
    finishWorkout: (note?: string) => void;
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
				window.localStorage.setItem("myhealth_workout_exercises", JSON.stringify(exercises));
                window.localStorage.setItem("myhealth_workout_seconds", workoutSeconds.toString());
                window.localStorage.setItem("myhealth_workout_name", workoutName);
                window.localStorage.setItem("myhealth_workout_running", JSON.stringify(isRunning));
			}
		} catch {
			// ignore
		}
	}, [exercises, workoutSeconds, workoutName, isRunning]);

    // Load from local storage
    useEffect(() => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                const sec = window.localStorage.getItem("myhealth_workout_seconds");
                if (sec) setWorkoutSeconds(parseInt(sec, 10));
                
                const name = window.localStorage.getItem("myhealth_workout_name");
                if (name) setWorkoutName(name);

                const running = window.localStorage.getItem("myhealth_workout_running");
                if (running) {
                    setRunning(JSON.parse(running));
                    if (JSON.parse(running)) setHasActiveSession(true);
                }
            }
        } catch {
            // ignore
        }
    }, []);




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


    // Actions
    const startWorkout = useCallback((exercisesToStart?: Exercise[], name?: string) => {
		// Allow empty workouts
		// if (targetExercises.length === 0) { ... }
        if (exercisesToStart) {
            setExercises(exercisesToStart);
        }
        if (name) {
            setWorkoutName(name);
        } else {
             setWorkoutName("Current Workout");
        }
		setRunning(true);
        setHasActiveSession(true);
        setIsExpanded(true);
	}, []);

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




    const addExercise = (name: string, sets: string, reps: string, type?: string) => {
        const ex = createExercise(name, sets, reps, type);
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
                        duration: input?.duration,
                        distance: input?.distance,
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





    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => setIsExpanded(prev => !prev);

    const { saveCompletedWorkout } = useWorkoutManager();

    const handleFinishWorkout = useCallback((note?: string) => {
        // Save the workout
        saveCompletedWorkout(workoutName, exercises, workoutSeconds, undefined, note);

        // Reset state
		setRunning(false);
		setWorkoutSeconds(0);
		setRestSeconds(0);
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
        
        setHasActiveSession(false);
        setIsExpanded(false);

        // Clear persistence
        try {
             if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem("myhealth_workout_exercises");
                window.localStorage.removeItem("myhealth_workout_seconds");
                window.localStorage.removeItem("myhealth_workout_name");
                window.localStorage.removeItem("myhealth_workout_running");
            }
        } catch {}
    }, [workoutName, exercises, workoutSeconds, saveCompletedWorkout]);

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

        // Clear persistence
        try {
             if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem("myhealth_workout_exercises");
                window.localStorage.removeItem("myhealth_workout_seconds");
                window.localStorage.removeItem("myhealth_workout_name");
                window.localStorage.removeItem("myhealth_workout_running");
            }
        } catch {}
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
