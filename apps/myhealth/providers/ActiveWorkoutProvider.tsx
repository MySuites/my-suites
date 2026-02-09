import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Exercise, useWorkoutManager, fetchLastExercisePerformance } from './WorkoutManagerProvider'; 
import { useAuth } from '@mysuite/auth';
import { createExercise } from '../utils/workout-logic';
import { useActiveWorkoutTimers } from '../hooks/workouts/useActiveWorkoutTimers';
import { useActiveWorkoutPersistence } from '../hooks/workouts/useActiveWorkoutPersistence';
import { useLatestBodyWeight } from '../hooks/workouts/useLatestBodyWeight';
import uuid from 'react-native-uuid';

// Define the shape of our context
interface ActiveWorkoutContextType {
    exercises: Exercise[];
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
    isRunning: boolean;
    workoutSeconds: number;

    currentIndex: number;
    workoutName: string;
    setWorkoutName: (name: string) => void;
    startWorkout: (exercisesToStart?: Exercise[], name?: string, routineId?: string, sourceWorkoutId?: string) => void;
    pauseWorkout: () => void;
    resetWorkout: () => void;
    completeSet: (index: number, setIndex: number, input?: { weight?: number; bodyweight?: number; reps?: number; duration?: number; distance?: number }) => void;
    nextExercise: () => void;
    prevExercise: () => void;
    addExercise: (name: string, sets: string, reps: string, properties?: string[]) => void;
    updateExercise: (index: number, updates: Partial<Exercise>) => void;
    removeExercise: (index: number) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
    finishWorkout: (note?: string) => void;
    cancelWorkout: () => void;
    hasActiveSession: boolean;
    routineId: string | null;
    sourceWorkoutId: string | null;
    latestBodyWeight: number | null;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
    // State
    const [exercises, setExercises] = useState<Exercise[]>(() => [
		{id: "1", name: "Push Ups", sets: 3, reps: 12, completedSets: 0},
		{id: "2", name: "Squats", sets: 3, reps: 10, completedSets: 0},
		{id: "3", name: "Plank (sec)", sets: 3, reps: 45, completedSets: 0},
	]);
    const { user } = useAuth();
    const [workoutName, setWorkoutName] = useState("Current Workout");
    const [routineId, setRoutineId] = useState<string | null>(null);
    const [sourceWorkoutId, setSourceWorkoutId] = useState<string | null>(null);
    const [hasActiveSession, setHasActiveSession] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Hooks
    const {
        isRunning,
        setRunning,
        workoutSeconds,
        setWorkoutSeconds,
        resetTimers,
    } = useActiveWorkoutTimers();

    // Auto-pause when minimized, auto-resume when expanded
    useEffect(() => {
        setRunning(isExpanded);
    }, [isExpanded, setRunning]);

    const { weight: latestBodyWeight } = useLatestBodyWeight();

    const { clearPersistence, isLoaded } = useActiveWorkoutPersistence({
        exercises,
        workoutSeconds,
        workoutName,
        isRunning,
        routineId,
        sourceWorkoutId,
        setExercises,
        setWorkoutSeconds,
        setWorkoutName,
        setRoutineId,
        setSourceWorkoutId,
        setRunning,
        setHasActiveSession,
    });
    
    // Fetch previous performance logs for exercises
    const exerciseIdsSerialized = JSON.stringify(exercises.map(ex => ex.id));
    useEffect(() => {
        if (!user || !hasActiveSession || exercises.length === 0) return;

        let isMounted = true;
        const fetchMissingLogs = async () => {
            let hasChanged = false;
            const updatedExercises = await Promise.all(exercises.map(async (ex) => {
                // If it's a real exercise (UUID) and doesn't have previousLog yet
                if (ex.id && !ex.previousLog && (ex.id.length > 20 || ex.id.includes('-'))) { 
                    try {
                        const { data } = await fetchLastExercisePerformance(user, ex.id, ex.name);
                        if (data && isMounted) {
                            hasChanged = true;
                            return { ...ex, previousLog: data };
                        }
                    } catch {
                        console.error("Failed to fetch previous log for", ex.name);
                    }
                } else if (!ex.previousLog) {
                    // Even if it's not a UUID, we can try by name
                    try {
                        const { data } = await fetchLastExercisePerformance(user, "", ex.name);
                        if (data && isMounted) {
                            hasChanged = true;
                            return { ...ex, previousLog: data };
                        }
                    } catch { /* ignore fallback fail */ }
                }
                return ex;
            }));

            if (hasChanged && isMounted) {
                setExercises(updatedExercises);
            }
        };

        fetchMissingLogs();
        return () => { isMounted = false; };
    }, [user, hasActiveSession, exerciseIdsSerialized, exercises]); // Re-run when user changes, session starts, or exercise list changes

    // Actions
    const startWorkout = useCallback((exercisesToStart?: Exercise[], name?: string, routineId?: string, sourceWorkoutId?: string) => {
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
        setRoutineId(routineId || null);
        setSourceWorkoutId(sourceWorkoutId || null);
		setRunning(true);
        setHasActiveSession(true);
        setIsExpanded(true);
	}, [setRunning]);

    const pauseWorkout = useCallback(() => {
		setRunning(false);
	}, [setRunning]);

	const resetWorkout = useCallback(() => {
		// Keep running (or start if paused) as per user request to "continue counting" after reset
		setRunning(true);
        // Ensure session determines visibility
        setHasActiveSession(true); 
        
		resetTimers();
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
	}, [setRunning, resetTimers]);




    const addExercise = (name: string, sets: string, reps: string, properties?: string[]) => {
        const ex = createExercise(name, sets, reps, properties);
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

    const removeExercise = (index: number) => {
        setExercises(current => current.filter((_, i) => i !== index));
        // If we removed the current exercise, move current index back if needed
        setCurrentIndex(prev => {
            if (index <= prev) {
                return Math.max(0, prev - 1);
            }
            return prev;
        });
    };

    const handleCompleteSet = (targetIndex: number,  setIndex: number, input?: { weight?: number; bodyweight?: number; reps?: number; duration?: number; distance?: number }) => {
        const indexToComplete = targetIndex ?? currentIndex;
        
        setExercises(currentExercises => {
            return currentExercises.map((ex, idx) => {
                if (idx === indexToComplete) {
                    const logs = [...(ex.logs || [])];
                    
                    // Inputs are already numbers
                    const weight = input?.weight;
                    const bodyweight = input?.bodyweight;
                    const reps = input?.reps; 
                    // Fallback to target reps if not provided
                    const props = ex.properties?.map((p: string) => p.toLowerCase()) || [];
                    // Using undefined for finalReps so database receives null (or we filter it out)
                    const isDurationOnly = props.includes('duration') && !props.includes('reps');
                    const finalReps = reps !== undefined ? reps : (isDurationOnly ? undefined : ex.reps);
                    
                    const newLog: any = {
                        id: uuid.v4(),
                        weight,
                        bodyweight,
                        reps: finalReps,
                        duration: input?.duration,
                        distance: input?.distance,
                    };

                    // Insert at specific index (filling gaps if necessary with undefined/empty)
                    logs[setIndex] = newLog;

                    // Recalculate completed sets count (filter out holes/undefined)
                    const completedCount = logs.filter(l => l !== undefined && l !== null).length;

                    return { 
                        ...ex, 
                        completedSets: completedCount,
                        logs: logs
                    };
                }
                return ex;
            });
        });

 
    };





    const toggleExpanded = () => setIsExpanded(prev => !prev);

    const { saveCompletedWorkout } = useWorkoutManager();

    const handleFinishWorkout = useCallback((note?: string) => {
        // Save the workout
        saveCompletedWorkout(workoutName, exercises, workoutSeconds, undefined, note, routineId || undefined);

        // Reset state
		setRunning(false);
		resetTimers();
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
        
        setHasActiveSession(false);
        setIsExpanded(false);

        // Clear persistence
        clearPersistence();
    }, [workoutName, exercises, workoutSeconds, saveCompletedWorkout, routineId, setRunning, resetTimers, clearPersistence]);

    const handleCancelWorkout = useCallback(() => {
        // Cancel is effectively the same as finish for now (discard/reset)
        // But we separate it for future distinction (Finish = Save potentially)
        setRunning(false);
        resetTimers();
        setCurrentIndex(0);
        setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, logs: []})));
        
        setHasActiveSession(false);
        setIsExpanded(false);

        // Clear persistence
        clearPersistence();
    }, [setRunning, resetTimers, clearPersistence]);

    const value = {
        exercises,
        setExercises,
        isRunning,
        workoutSeconds,

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
        removeExercise,
        finishWorkout: handleFinishWorkout,
        cancelWorkout: handleCancelWorkout,
        isExpanded,
        hasActiveSession,
        toggleExpanded,
        setExpanded: setIsExpanded,
        setWorkoutName,
        routineId,
        sourceWorkoutId,
        latestBodyWeight,
    };

    if (!isLoaded) {
        return null;
    }

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
