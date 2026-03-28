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
    reorderExercises: (from: number, to: number) => void;
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

export interface ActiveWorkoutTimerContextType {
    isRunning: boolean;
    setRunning: (r: boolean) => void;
    workoutSeconds: number;
    setWorkoutSeconds: (s: number) => void;
    restSeconds: number;
    startRestTimer: (s: number) => void;
    resetTimers: () => void;
}
export const ActiveWorkoutTimerContext = createContext<ActiveWorkoutTimerContextType | undefined>(undefined);

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
    // State
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const { user } = useAuth();
    const [workoutName, setWorkoutName] = useState("Current Workout");
    const [routineId, setRoutineId] = useState<string | null>(null);
    const [sourceWorkoutId, setSourceWorkoutId] = useState<string | null>(null);
    const [hasActiveSession, setHasActiveSession] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Hooks
    const timerState = useActiveWorkoutTimers();
    const { isRunning, setRunning, workoutSeconds, setWorkoutSeconds, resetTimers, startRestTimer } = timerState;

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
        hasActiveSession,
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




    const addExercise = useCallback((name: string, sets: string, reps: string, properties?: string[]) => {
        const ex = createExercise(name, sets, reps, properties);
        setExercises((e) => [...e, { ...ex, completedSets: 0, logs: [] }]);
    }, []);

    const nextExercise = useCallback(() => {
        setExercises((exs) => {
            setCurrentIndex((i) => Math.min(exs.length - 1, i + 1));
            return exs;
        });
    }, []);

    const prevExercise = useCallback(() => {
        setCurrentIndex((i) => Math.max(0, i - 1));
    }, []);

    const updateExercise = useCallback((index: number, updates: Partial<Exercise>) => {
        setExercises(current => 
            current.map((ex, i) => i === index ? { ...ex, ...updates } : ex)
        );
    }, []);

    const removeExercise = useCallback((index: number) => {
        setExercises(current => current.filter((_, i) => i !== index));
        setCurrentIndex(prev => {
            if (index <= prev) {
                return Math.max(0, prev - 1);
            }
            return prev;
        });
    }, []);

    const reorderExercises = useCallback((from: number, to: number) => {
        setExercises(prev => {
            if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
            const result = [...prev];
            const [removed] = result.splice(from, 1);
            result.splice(to, 0, removed);
            return result;
        });
        
        // Update currentIndex if it was affected
        setCurrentIndex(prev => {
            if (from === prev) return to;
            if (from < prev && to >= prev) return prev - 1;
            if (from > prev && to <= prev) return prev + 1;
            return prev;
        });
    }, []);

    const handleCompleteSet = useCallback((targetIndex: number,  setIndex: number, input?: { weight?: number; bodyweight?: number; reps?: number; duration?: number; distance?: number }) => {
        setExercises(currentExercises => {
            // Need a tiny hack because currentIndex might not be in closure, but we can't reliably read it from state inside setExercises if we depend on it directly
            // Actually targetIndex is always provided by our UI now, let's rely on it.
            const indexToComplete = targetIndex; 

            return currentExercises.map((ex, idx) => {
                if (idx === indexToComplete) {
                    const logs = [...(ex.logs || [])];
                    
                    const weight = input?.weight;
                    const bodyweight = input?.bodyweight;
                    const reps = input?.reps; 
                    const props = ex.properties?.map((p: string) => p.toLowerCase()) || [];
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

                    logs[setIndex] = newLog;

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

        // Trigger rest timer
        const exercise = exercises[targetIndex];
        if (exercise && input) {
            const restTime = exercise.restTime ?? 90;
            startRestTimer(restTime);
        }
    }, [exercises, startRestTimer]);

    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

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

    const value = React.useMemo(() => ({
        exercises,
        setExercises,

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
        reorderExercises,
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
    }), [
        exercises, currentIndex, workoutName, startWorkout, pauseWorkout, resetWorkout, 
        handleCompleteSet, nextExercise, prevExercise, addExercise, updateExercise, 
        removeExercise, reorderExercises, handleFinishWorkout, handleCancelWorkout, isExpanded, hasActiveSession, 
        toggleExpanded, routineId, sourceWorkoutId, latestBodyWeight
    ]);

    if (!isLoaded) {
        return null;
    }

    return (
        <ActiveWorkoutTimerContext.Provider value={timerState}>
            <ActiveWorkoutContext.Provider value={value}>
                {children}
            </ActiveWorkoutContext.Provider>
        </ActiveWorkoutTimerContext.Provider>
    );
}

export function useActiveWorkout() {
    const context = useContext(ActiveWorkoutContext);
    if (context === undefined) {
        throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
    }
    return context;
}

export function useActiveWorkoutTimer() {
    const context = useContext(ActiveWorkoutTimerContext);
    if (context === undefined) {
        throw new Error('useActiveWorkoutTimer must be used within an ActiveWorkoutProvider');
    }
    return context;
}
