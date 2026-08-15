import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Exercise, useWorkoutManager, fetchLastExercisePerformance, fetchRecentSetRpeAverages } from './WorkoutManagerProvider';
import { useAuth } from '@mysuite/auth';
import { createExercise, getEffectiveBodyweightLoad, workoutHasOutdoorExercise, isOutdoorGpsExercise } from '../utils/workout-logic';
import { computeRouteDistance, computeElevationGain } from '../utils/geo';
import { useActiveWorkoutTimers } from '../hooks/workouts/useActiveWorkoutTimers';
import { useActiveWorkoutPersistence } from '../hooks/workouts/useActiveWorkoutPersistence';
import { useLatestBodyWeight } from '../hooks/workouts/useLatestBodyWeight';
import { DataRepository, inferEquipment, inferMovementType } from './DataRepository';
import uuid from 'react-native-uuid';
import { analyzeMuscleGroupsInBackground } from '../services/ai/analyzeProgressPicture';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { NotificationService } from '../services/NotificationService';
import { LiveActivityService } from '../services/LiveActivityService';
import { WorkoutLocationTrackingService } from '../services/WorkoutLocationTrackingService';
import { storage } from '../utils/storage';

function getSetProgressLabel(ex?: Exercise): string {
    if (!ex) return '';
    const targetSets = typeof ex.sets === 'string' ? parseInt(ex.sets, 10) : (typeof ex.sets === 'number' ? ex.sets : 0);
    const completed = ex.completedSets || 0;
    if (!targetSets || targetSets <= 0) return `Set ${completed + 1}`;
    const current = Math.min(completed + 1, targetSets);
    return `Set ${current} of ${targetSets}`;
}

// Define the shape of our context
interface ActiveWorkoutContextType {
    exercises: Exercise[];
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;

    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    workoutName: string;
    setWorkoutName: (name: string) => void;
    startWorkout: (exercisesToStart?: Exercise[], name?: string, routineId?: string, sourceWorkoutId?: string) => void;
    pauseWorkout: () => void;
    resumeWorkout: () => void;
    resetWorkout: () => void;
    completeSet: (index: number, setIndex: number, input?: { weight?: number; bodyweight?: number; reps?: number; duration?: number; distance?: number; rpe?: number }) => void;
    nextExercise: () => void;
    prevExercise: () => void;
    addExercise: (name: string, sets: string, reps: string, properties?: string[], id?: string, attachment?: string, equipment?: string) => void;
    updateExercise: (index: number, updates: Partial<Exercise>) => void;
    removeExercise: (index: number) => void;
    reorderExercises: (from: number, to: number) => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
    finishWorkout: (note?: string, imageUrl?: string, imageUrls?: string[]) => void;
    cancelWorkout: () => void;
    hasActiveSession: boolean;
    routineId: string | null;
    sourceWorkoutId: string | null;
    latestBodyWeight: number | null;
    isGpsTrackingActive: boolean;
    activateGpsTrackingIfNeeded: () => Promise<void>;
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
    const [hasPromptedCompletion, setHasPromptedCompletion] = useState(false);
    // Whether GPS route tracking was actually started for the current
    // session (gated on the Settings toggle + an outdoor exercise present).
    // Mirrored into real state (isGpsTrackingActive) so consumers can
    // re-render on it — the ref alone wouldn't trigger updates.
    const gpsTrackingActiveRef = React.useRef(false);
    const [isGpsTrackingActive, setIsGpsTrackingActive] = useState(false);

    // Hooks
    const timerState = useActiveWorkoutTimers();
    const { isRunning, setRunning, workoutSeconds, setWorkoutSeconds, restSeconds, resetTimers, startRestTimer } = timerState;


    const { weight: latestBodyWeight } = useLatestBodyWeight();

    const { clearPersistence, isLoaded } = useActiveWorkoutPersistence({
        exercises,
        workoutSeconds,
        workoutName,
        isRunning,
        routineId,
        sourceWorkoutId,
        currentIndex,
        setExercises,
        setWorkoutSeconds,
        setWorkoutName,
        setRoutineId,
        setSourceWorkoutId,
        setCurrentIndex,
        setRunning,
        setHasActiveSession,
        hasActiveSession,
    });
    
    // Fetch previous performance logs for exercises
    const exerciseIdsSerialized = useMemo(
        () => JSON.stringify(exercises.map(ex => ex.id)),
        [exercises],
    );
    useEffect(() => {
        if (!hasActiveSession || exercises.length === 0) return;

        let isMounted = true;
        const fetchMissingLogs = async () => {
            let hasChanged = false;
            const updatedExercises = await Promise.all(exercises.map(async (ex) => {
                // If it's a real exercise (UUID) and doesn't have previousLog yet
                if (ex.id && !ex.previousLog && (ex.id.length > 20 || ex.id.includes('-'))) {
                    try {
                        const [{ data }, avgRpeBySetIndex] = await Promise.all([
                            fetchLastExercisePerformance(user, ex.id, ex.name),
                            fetchRecentSetRpeAverages(user, ex.id, ex.name),
                        ]);
                        if (data && isMounted) {
                            hasChanged = true;
                            return { ...ex, previousLog: data, avgRpeBySetIndex };
                        }
                    } catch {
                        console.error("Failed to fetch previous log for", ex.name);
                    }
                } else if (!ex.previousLog) {
                    // Even if it's not a UUID, we can try by name
                    try {
                        const [{ data }, avgRpeBySetIndex] = await Promise.all([
                            fetchLastExercisePerformance(user, "", ex.name),
                            fetchRecentSetRpeAverages(user, "", ex.name),
                        ]);
                        if (data && isMounted) {
                            hasChanged = true;
                            return { ...ex, previousLog: data, avgRpeBySetIndex };
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
    }, [user, hasActiveSession, exerciseIdsSerialized]); // Re-run when user changes, session starts, or exercise ids change

    // Auto-prompt when all sets are completed
    useEffect(() => {
        if (!hasActiveSession || exercises.length === 0) {
            setHasPromptedCompletion(false);
            return;
        }

        const allCompleted = exercises.every(ex => {
            const targetSets = typeof ex.sets === 'string' ? parseInt(ex.sets, 10) : (typeof ex.sets === 'number' ? ex.sets : 0);
            return (ex.completedSets || 0) >= targetSets;
        });

        if (allCompleted) {
            if (!hasPromptedCompletion) {
                setHasPromptedCompletion(true);
                Alert.alert(
                    "Workout Complete!",
                    "You've finished all sets and exercises. Ready to end the workout?",
                    [
                        { text: "Not Yet", style: "cancel" },
                        { text: "Yes!", onPress: () => router.push('/workouts/end') }
                    ]
                );
            }
        } else {
            if (hasPromptedCompletion) {
                setHasPromptedCompletion(false);
            }
        }
    }, [exercises, hasActiveSession, hasPromptedCompletion]);

    // Keep the Live Activity's exercise name / set progress in sync with the current exercise
    const currentExercise = exercises[currentIndex];
    const currentExerciseName = currentExercise?.name;
    const currentExerciseCompletedSets = currentExercise?.completedSets || 0;
    const currentExerciseSets = currentExercise?.sets;
    useEffect(() => {
        if (!hasActiveSession || !currentExercise) return;
        LiveActivityService.update({
            exerciseName: currentExerciseName,
            setProgress: getSetProgressLabel(currentExercise),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasActiveSession, currentIndex, currentExerciseName, currentExerciseCompletedSets, currentExerciseSets]);

    // Reflect rest-timer start/end on the Live Activity
    const prevRestSecondsRef = React.useRef(0);
    useEffect(() => {
        if (!hasActiveSession) return;
        const wasResting = prevRestSecondsRef.current > 0;
        const isResting = restSeconds > 0;
        if (!wasResting && isResting) {
            LiveActivityService.update({ isResting: true, restEndsAt: new Date(Date.now() + restSeconds * 1000) });
        } else if (wasResting && !isResting) {
            LiveActivityService.update({ isResting: false });
        }
        prevRestSecondsRef.current = restSeconds;
    }, [hasActiveSession, restSeconds]);

    // Shared by startWorkout (an outdoor exercise present at start) and
    // addExercise (an outdoor exercise added mid-workout) - and callable
    // directly by OutdoorRunPanel itself, so flipping the Settings toggle
    // on mid-workout (after the exercise was already there, or after this
    // ran once and denied) also gets picked up instead of leaving the
    // "enable it in Settings" placeholder stuck forever.
    const activateGpsTrackingIfNeeded = useCallback(async () => {
        if (gpsTrackingActiveRef.current) return;
        const gpsEnabled = await storage.getItem<boolean>('gps_tracking_enabled');
        if (!gpsEnabled) return;
        const granted = await WorkoutLocationTrackingService.requestPermissions();
        if (!granted) return;
        await WorkoutLocationTrackingService.startTracking();
        gpsTrackingActiveRef.current = true;
        setIsGpsTrackingActive(true);
    }, []);

    // Actions
    const startWorkout = useCallback((exercisesToStart?: Exercise[], name?: string, newRoutineId?: string, newSourceWorkoutId?: string) => {
		// Allow empty workouts
		// if (targetExercises.length === 0) { ... }
        if (exercisesToStart) {
            setExercises(exercisesToStart.map(ex => ({
                ...ex,
                completedSets: 0,
                completedIndices: [],
                logs: [],
                setTargets: ex.setTargets ? ex.setTargets.map((t: any) => ({
                    ...t,
                    reps: undefined,
                    reps_left: undefined,
                    reps_right: undefined,
                    duration: undefined,
                    distance: undefined,
                })) : undefined
            })));
            setWorkoutName(name || "Current Workout");
            setRoutineId(newRoutineId || null);
            setSourceWorkoutId(newSourceWorkoutId || null);
            NotificationService.scheduleWorkoutTimeoutReminder();

            const firstExercise = exercisesToStart[0];
            LiveActivityService.start({
                workoutName: name || "Current Workout",
                exerciseName: firstExercise?.name || '',
                setProgress: getSetProgressLabel(firstExercise),
                startedAt: new Date(Date.now() - workoutSeconds * 1000),
                isPaused: false,
            });

            if (workoutHasOutdoorExercise(exercisesToStart)) {
                activateGpsTrackingIfNeeded();
            }
        } else {
            // We are resuming
            if (name !== undefined) setWorkoutName(name);
            if (newRoutineId !== undefined) setRoutineId(newRoutineId || null);
            if (newSourceWorkoutId !== undefined) setSourceWorkoutId(newSourceWorkoutId || null);
        }

		setRunning(true);
        setHasActiveSession(true);
        setIsExpanded(true);
	}, [setRunning, workoutSeconds, activateGpsTrackingIfNeeded]);

    const pauseWorkout = useCallback(() => {
		setRunning(false);
        LiveActivityService.update({ isPaused: true });
	}, [setRunning]);

    const resumeWorkout = useCallback(() => {
		setRunning(true);
        LiveActivityService.update({ isPaused: false, startedAt: new Date(Date.now() - workoutSeconds * 1000) });
	}, [setRunning, workoutSeconds]);

	const resetWorkout = useCallback(() => {
		// Keep running (or start if paused) as per user request to "continue counting" after reset
		setRunning(true);
        // Ensure session determines visibility
        setHasActiveSession(true); 
        
		resetTimers();
		setCurrentIndex(0);
		setExercises((exs) => exs.map((x) => ({...x, completedSets: 0, completedIndices: [], logs: []})));
	}, [setRunning, resetTimers]);




    const addExercise = useCallback((name: string, sets: string, reps: string, properties?: string[], id?: string, attachment?: string, equipment?: string) => {
        const ex = createExercise(name, sets, reps, properties);
        const newExercise = {
            ...ex,
            id: id || ex.id,
            attachment: attachment || undefined,
            equipment: equipment || undefined,
            completedSets: 0,
            completedIndices: [],
            logs: [],
            setTargets: ex.setTargets ? ex.setTargets.map((t: any) => ({
                ...t,
                reps: undefined,
                reps_left: undefined,
                reps_right: undefined,
                duration: undefined,
                distance: undefined,
            })) : undefined
        };
        setExercises((e) => [...e, newExercise]);
        if (isOutdoorGpsExercise(newExercise)) {
            activateGpsTrackingIfNeeded();
        }
    }, [activateGpsTrackingIfNeeded]);

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

    const handleToggleSetCompletion = useCallback((targetIndex: number, setIndex: number) => {
        setExercises(currentExercises => {
            return currentExercises.map((ex, idx) => {
                if (idx === targetIndex) {
                    const completedIndices = [...(ex.completedIndices || [])];
                    const exists = completedIndices.indexOf(setIndex);
                    
                    if (exists > -1) {
                        completedIndices.splice(exists, 1);
                    } else {
                        completedIndices.push(setIndex);
                    }

                    return { 
                        ...ex, 
                        completedIndices,
                        completedSets: completedIndices.length,
                    };
                }
                return ex;
            });
        });

        // Trigger rest timer only when checking (not unchecking)
        const exercise = exercises[targetIndex];
        const currentlyCompleted = exercise?.completedIndices?.includes(setIndex);
        if (exercise && !currentlyCompleted) {
            const restTime = exercise.restTime ?? 90;
            startRestTimer(restTime);
        }
    }, [exercises, startRestTimer]);

    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    const { saveCompletedWorkout } = useWorkoutManager();

    const handleFinishWorkout = useCallback(async (note?: string, imageUrl?: string, imageUrls?: string[]) => {
        // Generate logs for completed sets before saving
        const exercisesWithLogs = exercises.map(ex => {
            const logs: any[] = [];
            const completedIndices = ex.completedIndices || [];
            
            completedIndices.forEach(idx => {
                const target = ex.setTargets?.[idx];
                if (target) {
                    const parseVal = (v: any, isRPE: boolean = false) => {
                        if (v === undefined || v === null || v === '') {
                            return isRPE ? undefined : 0;
                        }
                        return parseFloat(v.toString());
                    };
                    const prev = ex.previousLog?.[idx];
                    const equipment = ex.equipment || inferEquipment(ex.name);
                    const movementType = ex.movementType || inferMovementType(ex.name, equipment);
                    const isUnilateral = movementType === 'unilateral';
                    
                    let leftVal = target.reps_left as any;
                    if ((leftVal === undefined || leftVal === null || leftVal === '') && prev && prev.reps_left !== undefined && prev.reps_left !== null) {
                        leftVal = prev.reps_left;
                    }
                    if ((leftVal === undefined || leftVal === null || leftVal === '') && isUnilateral && ex.reps !== undefined && ex.reps !== null) {
                        leftVal = ex.reps;
                    }
                    const left = leftVal !== undefined && leftVal !== null && leftVal !== '' ? parseInt(leftVal.toString(), 10) : undefined;
                    
                    let rightVal = target.reps_right as any;
                    if ((rightVal === undefined || rightVal === null || rightVal === '') && prev && prev.reps_right !== undefined && prev.reps_right !== null) {
                        rightVal = prev.reps_right;
                    }
                    if ((rightVal === undefined || rightVal === null || rightVal === '') && isUnilateral && ex.reps !== undefined && ex.reps !== null) {
                        rightVal = ex.reps;
                    }
                    const right = rightVal !== undefined && rightVal !== null && rightVal !== '' ? parseInt(rightVal.toString(), 10) : undefined;
                    
                    let repsValStr = target.reps as any;
                    if ((repsValStr === undefined || repsValStr === null || repsValStr === '') && prev && prev.reps !== undefined && prev.reps !== null) {
                        repsValStr = prev.reps;
                    }
                    if ((repsValStr === undefined || repsValStr === null || repsValStr === '') && !isUnilateral && ex.reps !== undefined && ex.reps !== null) {
                        repsValStr = ex.reps;
                    }
                    let repsVal = parseVal(repsValStr);
                    if ((repsVal === 0 || repsVal === undefined || repsVal === null) && (left !== undefined || right !== undefined)) {
                        repsVal = Math.max(left ?? 0, right ?? 0);
                    }

                    let durationValStr = target.duration as any;
                    if ((durationValStr === undefined || durationValStr === null || durationValStr === '') && prev && prev.duration !== undefined && prev.duration !== null) {
                        durationValStr = prev.duration;
                    }
                    if ((durationValStr === undefined || durationValStr === null || durationValStr === '') && ex.reps !== undefined && ex.reps !== null) {
                        durationValStr = ex.reps;
                    }

                    let distanceValStr = target.distance as any;
                    if ((distanceValStr === undefined || distanceValStr === null || distanceValStr === '') && prev && prev.distance !== undefined && prev.distance !== null) {
                        distanceValStr = prev.distance;
                    }
                    if ((distanceValStr === undefined || distanceValStr === null || distanceValStr === '') && ex.reps !== undefined && ex.reps !== null) {
                        distanceValStr = ex.reps;
                    }

                    logs[idx] = {
                        id: uuid.v4(),
                        weight: parseVal(target.weight),
                        reps: repsVal,
                        reps_left: left,
                        reps_right: right,
                        duration: parseVal(durationValStr),
                        distance: parseVal(distanceValStr),
                        rpe: parseVal(target.rpe, true),
                        // Stamped whenever the exercise carries a bodyweight
                        // component, regardless of whether a weight was also
                        // logged - merged exercises like pull_up always have
                        // a defined `weight` (0 by default, negative for
                        // assistance, positive for added load) on top of the
                        // bodyweight baseline, not instead of it.
                        bodyweight: (ex.properties || []).includes('Bodyweight')
                            ? getEffectiveBodyweightLoad(ex, latestBodyWeight)
                            : undefined
                    };
                }
            });

            return {
                ...ex,
                logs
            };
        });

        // Save the progress pictures to the progress_pictures table as well
        if (imageUrls && imageUrls.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const picNotes = note ? `${workoutName}: ${note}` : `Added from workout: ${workoutName}`;
            imageUrls.forEach(url => {
                const pictureId = uuid.v4() as string;
                DataRepository.saveProgressPicture(user?.id || null, {
                    id: pictureId,
                    imageUri: url,
                    date: todayStr,
                    notes: picNotes
                })
                    .then(() => analyzeMuscleGroupsInBackground(pictureId, url))
                    .catch(err => console.error("Failed to save progress picture from workout:", err));
            });
        }

        // Stop GPS tracking (if it was running for this session) and fold the
        // collected route into distance/elevation stats for the saved log.
        let gpsData: { distance: number; elevationGain?: number; route: { latitude: number; longitude: number; timestamp: string }[] } | undefined;
        if (gpsTrackingActiveRef.current) {
            gpsTrackingActiveRef.current = false;
            setIsGpsTrackingActive(false);
            const points = await WorkoutLocationTrackingService.stopTracking();
            if (points.length >= 2) {
                gpsData = {
                    distance: computeRouteDistance(points),
                    elevationGain: computeElevationGain(points),
                    route: points.map(p => ({ latitude: p.latitude, longitude: p.longitude, timestamp: p.timestamp })),
                };
            }
        }

        // Save the workout
        saveCompletedWorkout(workoutName, exercisesWithLogs, workoutSeconds, undefined, note, routineId || undefined, sourceWorkoutId || undefined, imageUrl, imageUrls, gpsData);

        // Reset state
		setRunning(false);
		resetTimers();
		setCurrentIndex(0);
		setExercises([]);
		setWorkoutName("Current Workout");
		setRoutineId(null);
		setSourceWorkoutId(null);
        
        setHasActiveSession(false);
        setIsExpanded(false);

        // Clear persistence
        clearPersistence();
        NotificationService.cancelWorkoutTimeoutReminder();
        LiveActivityService.end();
    }, [workoutName, exercises, workoutSeconds, saveCompletedWorkout, routineId, sourceWorkoutId, setRunning, resetTimers, clearPersistence, latestBodyWeight, user?.id]);

    const handleCancelWorkout = useCallback(() => {
        setRunning(false);
        resetTimers();
        setCurrentIndex(0);
        setExercises([]);
        setWorkoutName("Current Workout");
        setRoutineId(null);
        setSourceWorkoutId(null);

        setHasActiveSession(false);
        setIsExpanded(false);

        // Clear persistence
        clearPersistence();
        NotificationService.cancelWorkoutTimeoutReminder();
        LiveActivityService.end();

        if (gpsTrackingActiveRef.current) {
            gpsTrackingActiveRef.current = false;
            setIsGpsTrackingActive(false);
            WorkoutLocationTrackingService.stopTracking().catch(err =>
                console.error("Failed to stop GPS tracking on cancel:", err)
            );
        }
    }, [setRunning, resetTimers, clearPersistence]);

    const value = React.useMemo(() => ({
        exercises,
        setExercises,

        currentIndex,
        setCurrentIndex,
        workoutName,
        startWorkout,
        pauseWorkout,
        resumeWorkout,
        resetWorkout,
        completeSet: handleToggleSetCompletion,
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
        isGpsTrackingActive,
        activateGpsTrackingIfNeeded,
    }), [
        exercises, currentIndex, setCurrentIndex, workoutName, startWorkout, pauseWorkout, resumeWorkout, resetWorkout,
        handleToggleSetCompletion, nextExercise, prevExercise, addExercise, updateExercise,
        removeExercise, reorderExercises, handleFinishWorkout, handleCancelWorkout, isExpanded, hasActiveSession,
        toggleExpanded, routineId, sourceWorkoutId, latestBodyWeight, isGpsTrackingActive, activateGpsTrackingIfNeeded
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
