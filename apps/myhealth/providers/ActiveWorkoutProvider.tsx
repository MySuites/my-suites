import React, { createContext, useContext, useState, useCallback } from 'react';
import { Exercise, useWorkoutManager } from '../hooks/useWorkoutManager'; 
import { createExercise } from '../utils/workout-logic';
import { useActiveWorkoutTimers } from '../hooks/useActiveWorkoutTimers';
import { useActiveWorkoutPersistence } from '../hooks/useActiveWorkoutPersistence';
import uuid from 'react-native-uuid';

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
    startWorkout: (exercisesToStart?: Exercise[], name?: string, routineId?: string, sourceWorkoutId?: string) => void;
    pauseWorkout: () => void;
    resetWorkout: () => void;
    completeSet: (index: number, input?: { weight?: number; reps?: number; duration?: number; distance?: number }) => void;
    nextExercise: () => void;
    prevExercise: () => void;
    addExercise: (name: string, sets: string, reps: string, properties?: string[]) => void;
    updateExercise: (index: number, updates: Partial<Exercise>) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
    finishWorkout: (note?: string) => void;
    cancelWorkout: () => void;
    hasActiveSession: boolean;
    routineId: string | null;
    sourceWorkoutId: string | null;
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
        restSeconds,
        resetTimers,
        startRestTimer,
    } = useActiveWorkoutTimers();

    const { clearPersistence } = useActiveWorkoutPersistence({
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
                    const props = ex.properties?.map((p: string) => p.toLowerCase()) || [];
                    // Using undefined for finalReps so database receives null (or we filter it out)
                    const isDurationOnly = props.includes('duration') && !props.includes('reps');
                    const finalReps = reps !== undefined ? reps : (isDurationOnly ? undefined : ex.reps);
                    
                    const newLog: any = {
                        id: uuid.v4(),
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

        // Rest timer logic
        startRestTimer(60); 
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
        routineId,
        sourceWorkoutId,
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
