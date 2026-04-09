import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
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


// Re-export types for compatibility
export type { Exercise, SetLog, WorkoutLog } from "../utils/workout-api";
export { fetchExercises, fetchMuscleGroups, fetchExerciseStats, fetchLastExercisePerformance, getExerciseDefaultProperties, fetchWorkoutLogDetails } from "../utils/workout-api";

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
    updateSavedWorkout: (id: string, name: string, exercises: Exercise[], onSuccess: () => void) => Promise<void>;
    saveRoutineDraft: (name: string, sequence: any[], onSuccess: () => void) => Promise<void>;
    updateRoutine: (id: string, name: string, sequence: any[], onSuccess: () => void, suppressAlert?: boolean) => Promise<void>;
    deleteRoutine: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    createCustomExercise: (name: string, type: string, primary?: string, secondary?: string[]) => Promise<{ data?: any, error?: any }>;
    deleteCustomExercise: (id: string) => Promise<void>;
    workoutHistory: WorkoutLog[];
    fetchWorkoutLogDetails: (logId: string) => Promise<{ data: any[], error: any }>;
    saveCompletedWorkout: (name: string, exercises: Exercise[], duration: number, onSuccess?: () => void, note?: string, routineId?: string) => Promise<void>;
    deleteWorkoutLog: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    lastSyncedAt: Date | null;
    sync: () => Promise<void>;
    isSyncing: boolean;
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

    const { lastSyncedAt, sync, isSyncing } = useSyncService();

    const {
        activeRoutine,
        startActiveRoutine: startActiveRoutineRaw,
        setActiveRoutineIndex: setActiveRoutineIndexRaw,
        markRoutineDayComplete,
        clearActiveRoutine: clearActiveRoutineRaw,
        setRoutineState
    } = useRoutineManager(routines);

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
                    exercises: h.exercises
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
            } catch (e) {
                console.error("Failed to load local data", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, setRoutineState]);

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

    const updateSavedWorkout = useCallback(async (id: string, name: string, exercises: Exercise[], onSuccess: () => void) => {
         setIsSaving(true);
         try {
             const workout = { id, name, exercises };
             await DataRepository.saveWorkout(workout);
             const updated = await DataRepository.getWorkouts();
             setSavedWorkouts(updated);
             onSuccess();
         } finally {
             setIsSaving(false);
         }
    }, []);

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

    const saveCompletedWorkout = useCallback(async (
        name: string,
        exercises: Exercise[],
        duration: number,
        onSuccess?: () => void,
        note?: string,
        routineId?: string
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
                 id: undefined as any
             });
             
             const storedHistory = await DataRepository.getHistory();
             const mappedHistory = storedHistory.map(h => ({
                    id: h.id,
                    userId: user?.id || 'guest',
                    workoutDate: h.date,
                    workoutName: h.name,
                    createdAt: h.date,
                    notes: h.note,
                    exercises: h.exercises
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
    }), [
        savedWorkouts, routines, activeRoutine, startActiveRoutine, setActiveRoutineIndex,
        markRoutineDayComplete, clearActiveRoutine, isSaving, isLoading, saveWorkout,
        deleteSavedWorkout, updateSavedWorkout, saveRoutineDraft, updateRoutine,
        deleteRoutine, workoutHistory, fetchWorkoutLogDetailsStable, saveCompletedWorkout,
        deleteWorkoutLog, createCustomExercise, deleteCustomExercise, lastSyncedAt,
        sync, isSyncing
    ]);

    return <WorkoutManagerContext.Provider value={value}>{children}</WorkoutManagerContext.Provider>;
}

export function useWorkoutManager() {
    const context = useContext(WorkoutManagerContext);
    if (!context) throw new Error("useWorkoutManager must be used within provider");
    return context;
}
