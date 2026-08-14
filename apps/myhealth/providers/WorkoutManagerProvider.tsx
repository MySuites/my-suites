import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useAuth } from "@mysuite/auth";
import {
    Exercise,
    WorkoutLog,
    fetchWorkoutLogDetails
} from "../utils/workout-api";
import { useRoutineManager } from "../hooks/routines/useRoutineManager";
import { useToast } from "@mysuite/ui";
import { DataRepository } from "./DataRepository";
import { ProfileRepository } from "./ProfileRepository";
import { useSyncService } from "../hooks/useSyncService";
import uuid from 'react-native-uuid';
import { storage } from "../utils/storage";
import { DEFAULT_REP_CEILING } from "../utils/progressiveOverload";
import { REP_CEILING_STORAGE_KEY } from "../utils/progressiveOverloadSettings";


// Re-export types for compatibility
export type { Exercise, SetLog, WorkoutLog } from "../utils/workout-api";
export { fetchExercises, fetchMuscleGroups, fetchExerciseStats, fetchLastExercisePerformance, fetchRecentSetRpeAverages, getExerciseDefaultProperties, fetchWorkoutLogDetails } from "../utils/workout-api";

interface WorkoutManagerContextType {
    savedWorkouts: any[];
    routines: any[];
    activeRoutine: {
        id: string;
        dayIndex: number;
        lastCompletedDate?: string;
    } | null;
    startActiveRoutine: (id: string) => void;
    setActiveRoutineIndex: (index: number) => void;
    markRoutineDayComplete: () => void;
    clearActiveRoutine: () => void;
    isSaving: boolean;
    isLoading: boolean;
    saveWorkout: (name: string, exercises: Exercise[], onSuccess: () => void) => Promise<void>;
    deleteSavedWorkout: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    updateSavedWorkout: (id: string, name: string, exercises: Exercise[], onSuccess: () => void, valuesOnly?: boolean) => Promise<void>;
    saveRoutineDraft: (name: string, sequence: any[], onSuccess: () => void) => Promise<void>;
    updateRoutine: (id: string, name: string, sequence: any[], onSuccess: () => void, suppressAlert?: boolean) => Promise<void>;
    deleteRoutine: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    createCustomExercise: (name: string, type: string, primary?: string, secondary?: string[]) => Promise<{ data?: any, error?: any }>;
    deleteCustomExercise: (id: string) => Promise<void>;
    workoutHistory: WorkoutLog[];
    fetchWorkoutLogDetails: (logId: string) => Promise<{ data: any[], error: any }>;
    saveCompletedWorkout: (name: string, exercises: Exercise[], duration: number, onSuccess?: () => void, note?: string, routineId?: string, sourceWorkoutId?: string, imageUrl?: string, imageUrls?: string[]) => Promise<void>;
    deleteWorkoutLog: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    lastSyncedAt: Date | null;
    sync: () => Promise<void>;
    isSyncing: boolean;
    reorderSavedWorkouts: (newWorkouts: any[]) => Promise<void>;
    isRpeEnabled: boolean;
    setIsRpeEnabled: (enabled: boolean) => Promise<void>;
    isHapticsEnabled: boolean;
    setIsHapticsEnabled: (enabled: boolean) => Promise<void>;
    isProgressiveOverloadEnabled: boolean;
    setIsProgressiveOverloadEnabled: (enabled: boolean) => Promise<void>;
    progressiveOverloadRepCeiling: number;
    setProgressiveOverloadRepCeiling: (ceiling: number) => Promise<void>;
}

const WorkoutManagerContext = createContext<WorkoutManagerContextType | undefined>(undefined);

export function WorkoutManagerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
    const [routines, setRoutines] = useState<any[]>([]);
    const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRpeEnabled, setIsRpeEnabledState] = useState(false);
    const [isHapticsEnabled, setIsHapticsEnabledState] = useState(true);
    const [isProgressiveOverloadEnabled, setIsProgressiveOverloadEnabledState] = useState(true);
    const [progressiveOverloadRepCeiling, setProgressiveOverloadRepCeilingState] = useState(DEFAULT_REP_CEILING);

    const { lastSyncedAt, sync, isSyncing } = useSyncService();

    const {
        activeRoutine,
        startActiveRoutine: startActiveRoutineRaw,
        setActiveRoutineIndex: setActiveRoutineIndexRaw,
        markRoutineDayComplete,
        clearActiveRoutine: clearActiveRoutineRaw,
        setRoutineState
    } = useRoutineManager(routines);

    const isInitialized = useRef(false);

    const setIsRpeEnabled = useCallback(async (enabled: boolean) => {
        setIsRpeEnabledState(enabled);
        await storage.setItem('setting.workout.isRpeEnabled', enabled);
    }, []);

    const setIsHapticsEnabled = useCallback(async (enabled: boolean) => {
        setIsHapticsEnabledState(enabled);
        await storage.setItem('setting.workout.isHapticsEnabled', enabled);
    }, []);

    const setIsProgressiveOverloadEnabled = useCallback(async (enabled: boolean) => {
        setIsProgressiveOverloadEnabledState(enabled);
        await storage.setItem('setting.workout.isProgressiveOverloadEnabled', enabled);
    }, []);

    const setProgressiveOverloadRepCeiling = useCallback(async (ceiling: number) => {
        setProgressiveOverloadRepCeilingState(ceiling);
        await storage.setItem(REP_CEILING_STORAGE_KEY, ceiling);
    }, []);

    // Initial Load - Local First
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const storedWorkouts = await DataRepository.getWorkouts();
                setSavedWorkouts(storedWorkouts);

                const storedHistory = await DataRepository.getHistory();
                const mappedHistory: WorkoutLog[] = storedHistory.map(h => ({
                    id: h.id,
                    userId: user?.id || 'guest',
                    workoutDate: h.date,
                    workoutName: h.name,
                    createdAt: h.date,
                    notes: h.note,
                    exercises: h.exercises,
                    imageUrl: h.imageUrl,
                    imageUrls: h.imageUrls
                }));
                mappedHistory.sort((a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime());
                setWorkoutHistory(mappedHistory);

                const storedRoutines = await DataRepository.getRoutines();
                setRoutines(storedRoutines);

                const userId = user?.id || 'guest';
                const profile = await ProfileRepository.getProfile(userId);
                if (profile && profile.active_routine) {
                     setRoutineState(profile.active_routine);
                }

                const rpeVal = await storage.getItem<boolean>('setting.workout.isRpeEnabled');
                setIsRpeEnabledState(!!rpeVal);

                const hapticsVal = await storage.getItem<boolean>('setting.workout.isHapticsEnabled');
                setIsHapticsEnabledState(hapticsVal === null ? true : !!hapticsVal);

                const progressiveOverloadVal = await storage.getItem<boolean>('setting.workout.isProgressiveOverloadEnabled');
                setIsProgressiveOverloadEnabledState(progressiveOverloadVal === null ? true : !!progressiveOverloadVal);

                const repCeilingVal = await storage.getItem<number>(REP_CEILING_STORAGE_KEY);
                setProgressiveOverloadRepCeilingState(repCeilingVal === null ? DEFAULT_REP_CEILING : repCeilingVal);
            } catch (e) {
                console.error("Failed to load local data", e);
            } finally {
                setIsLoading(false);
                // Mark as initialized in the next tick to ensure state updates have propagated
                setTimeout(() => {
                    isInitialized.current = true;
                }, 0);
            }
        }
        loadData();
    }, [user, setRoutineState]);

    // Persist active routine state changes
    useEffect(() => {
        if (!isInitialized.current || isLoading) return;
        
        const persistRoutine = async () => {
            try {
                const userId = user?.id || 'guest';
                await ProfileRepository.updateActiveRoutine(userId, activeRoutine);
            } catch (e) {
                console.error("Failed to persist active routine", e);
            }
        };

        persistRoutine();
    }, [activeRoutine, user, isLoading]);

    const saveWorkout = useCallback(async (
        workoutName: string,
        exercises: Exercise[],
        onSuccess: () => void,
    ) => {
        if (!workoutName || workoutName.trim() === "") {
            Alert.alert("Name required", "Please enter a name for the workout.");
            return;
        }

        const newWorkout = {
            id: uuid.v4() as string,
            name: workoutName.trim(),
            exercises,
            createdAt: new Date().toISOString()
        };

        setIsSaving(true);
        try {
            await DataRepository.saveWorkout(newWorkout);
            const updated = await DataRepository.getWorkouts();
            setSavedWorkouts(updated);
            onSuccess();
            showToast({ message: `Workout saved`, type: 'success' });
        } catch (e) {
            Alert.alert("Error", "Failed to save workout." + e);
        } finally {
            setIsSaving(false);
        }
    }, [showToast]);

    const updateSavedWorkout = useCallback(async (id: string, name: string, exercises: Exercise[], onSuccess: () => void, valuesOnly?: boolean) => {
         setIsSaving(true);
         try {
             const originalWorkout = savedWorkouts.find(w => w.id === id);
             const mergedExercises = exercises.map((incomingEx: any) => {
                 const templateEx = originalWorkout ? originalWorkout.exercises.find((ex: any) => ex.id === incomingEx.id || ex.name === incomingEx.name) : null;
                 const originalTargets = templateEx ? (templateEx.setTargets || []) : [];
                 
                 const completedLogs = incomingEx.logs || [];
                 const activeTargets = incomingEx.setTargets || [];
                 
                 const newSetsCount = valuesOnly 
                     ? (templateEx ? templateEx.sets : activeTargets.length)
                     : (incomingEx.sets !== undefined ? incomingEx.sets : activeTargets.length);
                 const newSetTargets = [];

                 for (let i = 0; i < newSetsCount; i++) {
                     const log = completedLogs[i];
                     const activeTarget = activeTargets[i] || {};
                     const originalTarget = originalTargets[i] || {};

                     if (log) {
                         // Use completed log values as the new template
                         newSetTargets.push({
                             weight: log.weight,
                             reps: log.reps,
                             reps_left: log.reps_left,
                             reps_right: log.reps_right,
                             duration: log.duration,
                             distance: log.distance,
                             rpe: log.rpe
                         });
                     } else {
                         // For uncompleted sets, prefer activeTarget (what was set during workout) over original template
                         newSetTargets.push({
                             weight: activeTarget.weight !== undefined ? activeTarget.weight : originalTarget.weight,
                             reps: activeTarget.reps !== undefined ? activeTarget.reps : originalTarget.reps,
                             reps_left: activeTarget.reps_left !== undefined ? activeTarget.reps_left : originalTarget.reps_left,
                             reps_right: activeTarget.reps_right !== undefined ? activeTarget.reps_right : originalTarget.reps_right,
                             duration: activeTarget.duration !== undefined ? activeTarget.duration : originalTarget.duration,
                             distance: activeTarget.distance !== undefined ? activeTarget.distance : originalTarget.distance,
                             rpe: activeTarget.rpe !== undefined ? activeTarget.rpe : originalTarget.rpe
                         });
                     }
                 }

                 const updatedEx = {
                     ...incomingEx,
                     setTargets: newSetTargets,
                     sets: newSetTargets.length
                 };

                 if (newSetTargets.length > 0) {
                     const firstTarget = newSetTargets[0];
                     if (firstTarget.reps !== undefined && firstTarget.reps !== null) {
                         updatedEx.reps = firstTarget.reps;
                     } else if (firstTarget.duration !== undefined && firstTarget.duration !== null) {
                         updatedEx.reps = firstTarget.duration;
                     } else if (firstTarget.distance !== undefined && firstTarget.distance !== null) {
                         updatedEx.reps = firstTarget.distance;
                     }
                 }

                 delete updatedEx.logs;
                 delete updatedEx.completedSets;
                 delete updatedEx.previousLog;
                 delete updatedEx.completedIndices;

                 return updatedEx;
             });

             const workout = { id, name, exercises: mergedExercises };
             await DataRepository.saveWorkout(workout);
             const updated = await DataRepository.getWorkouts();
             setSavedWorkouts(updated);
             onSuccess();
         } finally {
             setIsSaving(false);
         }
    }, [savedWorkouts]);

    const deleteSavedWorkout = useCallback((id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => {
        const performDelete = async () => {
            await DataRepository.deleteWorkout(id);
            setSavedWorkouts(prev => prev.filter(w => w.id !== id));
            options?.onSuccess?.();
        };

         if (options?.skipConfirmation) {
            performDelete();
        } else {
            Alert.alert("Delete workout", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
            ]);
        }
    }, []);

    const reorderSavedWorkouts = useCallback(async (newWorkouts: any[]) => {
        setSavedWorkouts(newWorkouts);
        try {
            const orders = newWorkouts.map((w, index) => ({ id: w.id, sortOrder: index }));
            await DataRepository.updateWorkoutSortOrders(orders);
        } catch (e) {
            console.error("Failed to persist workout order", e);
        }
    }, []);

    const saveCompletedWorkout = useCallback(async (
        name: string,
        exercises: Exercise[],
        duration: number,
        onSuccess?: () => void,
        note?: string,
        routineId?: string,
        sourceWorkoutId?: string,
        imageUrl?: string,
        imageUrls?: string[],
        gpsData?: { distance: number; elevationGain?: number; route: { latitude: number; longitude: number; timestamp: string }[] }
    ) => {
         setIsSaving(true);
         try {
             await DataRepository.saveLog({
                 userId: user?.id || 'guest',
                 name,
                 exercises,
                 duration,
                 date: new Date().toISOString(),
                 createdAt: new Date().toISOString(),
                 note: note,
                 imageUrl: imageUrl,
                 imageUrls: imageUrls,
                 id: undefined as any,
                 ...(gpsData ? {
                     distance: gpsData.distance,
                     elevationGain: gpsData.elevationGain,
                     route: gpsData.route,
                     metricsSource: 'gps' as const,
                 } : {})
             });
             
             const storedHistory = await DataRepository.getHistory();
             const mappedHistory = storedHistory.map(h => ({
                    id: h.id,
                    userId: user?.id || 'guest',
                    workoutDate: h.date,
                    workoutName: h.name,
                    createdAt: h.date,
                    notes: h.note,
                    exercises: h.exercises,
                    imageUrl: h.imageUrl,
                    imageUrls: h.imageUrls
             }));
             mappedHistory.sort((a: any, b: any) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime());
             setWorkoutHistory(mappedHistory);

             if (routineId && activeRoutine?.id === routineId) {
                markRoutineDayComplete();
             }
             onSuccess?.();
         } finally {
             setIsSaving(false);
         }
     }, [user, activeRoutine, markRoutineDayComplete]);

    const saveRoutineDraft = useCallback(async (name: string, sequence: any[], onSuccess: () => void) => {
        setIsSaving(true);
        try {
            const id = uuid.v4() as string;
            const newRoutine = { id, name, sequence, createdAt: new Date().toISOString() };
            
            await DataRepository.saveRoutine(newRoutine);
            const updated = await DataRepository.getRoutines();
            setRoutines(updated);
            
            onSuccess();
        } catch (e) {
            Alert.alert("Error saving routine", String(e));
        } finally {
            setIsSaving(false);
        }
    }, []);
    
    const updateRoutine = useCallback(async (id: string, name: string, sequence: any[], onSuccess: () => void, suppressAlert?: boolean) => {
        setIsSaving(true);
        try {
            const existing = routines.find(r => r.id === id);
            const routineToSave = { 
                ...existing,
                id, name, sequence, 
                updatedAt: Date.now() 
            };
            
            await DataRepository.saveRoutine(routineToSave);
            const updated = await DataRepository.getRoutines();
            setRoutines(updated);
            
            onSuccess();
        } catch (e) {
            Alert.alert("Error updating routine", String(e));
        } finally {
            setIsSaving(false);
        }
    }, [routines]);

    const deleteRoutine = useCallback((id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => {
         const performDelete = async () => {
             setIsSaving(true);
             try {
                await DataRepository.deleteRoutine(id);
                setRoutines(prev => prev.filter(r => r.id !== id));
                options?.onSuccess?.();
             } catch(e) {
                 Alert.alert("Error deleting routine", String(e));
             } finally {
                 setIsSaving(false);
             }
         };

         if (options?.skipConfirmation) {
             performDelete();
         } else {
             Alert.alert("Delete Routine", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
             ]);
         }
    }, []);

    const fetchWorkoutLogDetailsStable = useCallback(async (id: string) => {
        return await fetchWorkoutLogDetails(user, id);
    }, [user]);

    const deleteWorkoutLog = useCallback((id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => {
        const performDelete = async () => {
            try {
                if (!id) throw new Error("Missing workout ID");
                await DataRepository.deleteHistory(id);
                setWorkoutHistory(prev => (prev || []).filter(h => h && h.id !== id));
                options?.onSuccess?.();
                showToast({ message: "Workout deleted", type: "success" });
            } catch (e) {
                console.error(e);
                Alert.alert("Error", "Failed to delete workout log.");
            }
        };

        if (options?.skipConfirmation) {
            performDelete();
        } else {
            Alert.alert("Delete Workout", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
            ]);
        }
    }, [showToast]);

    const createCustomExercise = useCallback(async (name: string, type: string, primary?: string, secondary?: string[]) => {
         const id = uuid.v4() as string;
         const exerciseForRepo = {
             id,
             name,
             properties: type,
             muscle_groups: [primary, ...(secondary || [])].filter(Boolean),
         };

         try {
            await DataRepository.saveExercises([exerciseForRepo]);
            return { data: id };
         } catch (e) {
             return { error: e };
         }
    }, []);

    const deleteCustomExercise = useCallback(async (id: string) => {
         try {
             await DataRepository.deleteExercise(id);
             showToast({ message: "Exercise deleted", type: 'success' });
         } catch (e) {
             console.error(e);
             Alert.alert("Error", "Failed to delete exercise");
         }
    }, [showToast]);

    const startActiveRoutine = useCallback((id: string) => startActiveRoutineRaw(id), [startActiveRoutineRaw]);
    const setActiveRoutineIndex = useCallback((index: number) => setActiveRoutineIndexRaw(index), [setActiveRoutineIndexRaw]);
    const clearActiveRoutine = useCallback(() => clearActiveRoutineRaw(), [clearActiveRoutineRaw]);

    const value = useMemo(() => ({
        savedWorkouts,
        routines,
        activeRoutine,
        startActiveRoutine,
        setActiveRoutineIndex,
        markRoutineDayComplete,
        clearActiveRoutine,
        isSaving,
        isLoading,
        saveWorkout,
        deleteSavedWorkout,
        updateSavedWorkout,
        saveRoutineDraft,
        updateRoutine,
        deleteRoutine,
        workoutHistory,
        fetchWorkoutLogDetails: fetchWorkoutLogDetailsStable,
        saveCompletedWorkout,
        deleteWorkoutLog,
        createCustomExercise,
        deleteCustomExercise,
        lastSyncedAt,
        sync,
        isSyncing,
        reorderSavedWorkouts,
        isRpeEnabled,
        setIsRpeEnabled,
        isHapticsEnabled,
        setIsHapticsEnabled,
        isProgressiveOverloadEnabled,
        setIsProgressiveOverloadEnabled,
        progressiveOverloadRepCeiling,
        setProgressiveOverloadRepCeiling,
    }), [
        savedWorkouts, routines, activeRoutine, startActiveRoutine, setActiveRoutineIndex,
        markRoutineDayComplete, clearActiveRoutine, isSaving, isLoading, saveWorkout,
        deleteSavedWorkout, updateSavedWorkout, saveRoutineDraft, updateRoutine,
        deleteRoutine, workoutHistory, fetchWorkoutLogDetailsStable, saveCompletedWorkout,
        deleteWorkoutLog, createCustomExercise, deleteCustomExercise, lastSyncedAt,
        sync, isSyncing, reorderSavedWorkouts, isRpeEnabled, setIsRpeEnabled,
        isHapticsEnabled, setIsHapticsEnabled,
        isProgressiveOverloadEnabled, setIsProgressiveOverloadEnabled,
        progressiveOverloadRepCeiling, setProgressiveOverloadRepCeiling
    ]);

    return <WorkoutManagerContext.Provider value={value}>{children}</WorkoutManagerContext.Provider>;
}

export function useWorkoutManager() {
    const context = useContext(WorkoutManagerContext);
    if (!context) {
        // Fallback context structure for tests or components rendered outside the provider
        return {
            savedWorkouts: [],
            routines: [],
            activeRoutine: null,
            startActiveRoutine: () => {},
            setActiveRoutineIndex: () => {},
            markRoutineDayComplete: () => {},
            clearActiveRoutine: () => {},
            isSaving: false,
            isLoading: false,
            saveWorkout: async () => {},
            deleteSavedWorkout: () => {},
            updateSavedWorkout: async () => {},
            saveRoutineDraft: async () => {},
            updateRoutine: async () => {},
            deleteRoutine: () => {},
            createCustomExercise: async () => ({}),
            deleteCustomExercise: async () => {},
            workoutHistory: [],
            fetchWorkoutLogDetails: async () => ({ data: [], error: null }),
            saveCompletedWorkout: async () => {},
            deleteWorkoutLog: () => {},
            lastSyncedAt: null,
            sync: async () => {},
            isSyncing: false,
            reorderSavedWorkouts: async () => {},
            isRpeEnabled: false,
            setIsRpeEnabled: async () => {},
            isHapticsEnabled: true,
            setIsHapticsEnabled: async () => {},
            isProgressiveOverloadEnabled: true,
            setIsProgressiveOverloadEnabled: async () => {},
            progressiveOverloadRepCeiling: DEFAULT_REP_CEILING,
            setProgressiveOverloadRepCeiling: async () => {},
        } as any;
    }
    return context;
}
