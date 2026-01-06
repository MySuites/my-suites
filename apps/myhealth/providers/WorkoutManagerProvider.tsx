import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@mysuite/auth";
import {
    Exercise,
    WorkoutLog,
} from "../utils/workout-api";
import { useRoutineManager } from "../hooks/routines/useRoutineManager";
import { useToast } from "@mysuite/ui";
import { DataRepository } from "./DataRepository";
import { ProfileRepository } from "./ProfileRepository";
import { useSyncService } from "../hooks/useSyncService";
import uuid from 'react-native-uuid';


// Re-export types for compatibility
export type { Exercise, SetLog, WorkoutLog } from "../utils/workout-api";
export { fetchExercises, fetchMuscleGroups, fetchExerciseStats } from "../utils/workout-api";

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
    workoutHistory: WorkoutLog[];
    fetchWorkoutLogDetails: (logId: string) => Promise<{ data: any[], error: any }>;
    saveCompletedWorkout: (name: string, exercises: Exercise[], duration: number, onSuccess?: () => void, note?: string, routineId?: string) => Promise<void>;
    deleteWorkoutLog: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    lastSyncedAt: Date | null; // Added
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

    const { lastSyncedAt, sync, isSyncing } = useSyncService(); // Start background sync

    const {
        activeRoutine,
        startActiveRoutine,
        setActiveRoutineIndex,
        markRoutineDayComplete,
        clearActiveRoutine,
        setRoutineState
    } = useRoutineManager(routines);

    // Initial Load - Local First
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                // Load Workouts
                const storedWorkouts = await DataRepository.getWorkouts();
                setSavedWorkouts(storedWorkouts);

                // Load History (Mapped to old WorkoutLog type for UI compatibility if needed, but UI likely needs refactor or flexible type)
                // For now, assume history UI might break if types mismatch directly?
                // The UI expects 'WorkoutLog' { id, workoutName, date... }
                // LocalWorkoutLog handles this but we need to map logical names if they differ.
                const storedHistory = await DataRepository.getHistory();
                // Basic mapping:
                const mappedHistory: WorkoutLog[] = storedHistory.map(h => ({
                    id: h.id,
                    userId: user?.id || 'guest',
                    workoutTime: h.date, // LocalWorkoutLog uses 'date', API 'workoutTime'
                    workoutName: h.name,
                    createdAt: h.date, // Approximate
                    notes: h.note
                }));
                // Sort by date desc
                mappedHistory.sort((a, b) => new Date(b.workoutTime).getTime() - new Date(a.workoutTime).getTime());
                setWorkoutHistory(mappedHistory);

                // Load Routines
                const storedRoutines = await DataRepository.getRoutines();
                setRoutines(storedRoutines);

                // Load Active Routine State
                const userId = user?.id || 'guest';
                // Ensure profile exists for guest if needed? 
                // For now try fetch.
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

    async function saveWorkout(
        workoutName: string,
        exercises: Exercise[],
        onSuccess: () => void,
    ) {
        if (!workoutName || workoutName.trim() === "") {
            Alert.alert("Name required", "Please enter a name for the workout.");
            return;
        }

        const newWorkout = {
            id: undefined, // Let repo generate ID for new
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
    }

    async function updateSavedWorkout(id: string, name: string, exercises: Exercise[], onSuccess: () => void) {
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
    }

    function deleteSavedWorkout(id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) {
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
    }

    async function saveCompletedWorkout(
        name: string,
        exercises: Exercise[],
        duration: number,
        onSuccess?: () => void,
        note?: string,
        routineId?: string
    ) {
         setIsSaving(true);
         try {
             await DataRepository.saveLog({
                 userId: user?.id || 'guest',
                 name,
                 exercises, // These need to contain 'logs'
                 duration,
                 date: new Date().toISOString(),
                 createdAt: new Date().toISOString(), // Added to satisfy type
                 note: note,
                 id: undefined as any // Repo generates
             });
             
             // Refresh History
             const storedHistory = await DataRepository.getHistory();
             const mappedHistory = storedHistory.map(h => ({
                    id: h.id,
                    userId: user?.id || 'guest',
                    workoutTime: h.date, // LocalWorkoutLog uses 'date', API 'workoutTime'
                    workoutName: h.name,
                    createdAt: h.date, // Approximate
                    notes: h.note
             }));
             mappedHistory.sort((a: any, b: any) => new Date(b.workoutTime).getTime() - new Date(a.workoutTime).getTime());
             setWorkoutHistory(mappedHistory);

             if (routineId && activeRoutine?.id === routineId) {
                markRoutineDayComplete();
             }
             onSuccess?.();
         } finally {
             setIsSaving(false);
         }
    }

    async function saveRoutineDraft(name: string, sequence: any[], onSuccess: () => void) {
        setIsSaving(true);
        try {
            const id = uuid.v4() as string;
            const newRoutine = { id, name, sequence, createdAt: new Date().toISOString() };
            
            await DataRepository.saveRoutine(newRoutine);
            // Refresh
            const updated = await DataRepository.getRoutines();
            setRoutines(updated);
            
            onSuccess();
        } catch (e) {
            Alert.alert("Error saving routine", String(e));
        } finally {
            setIsSaving(false);
        }
    }
    
    async function updateRoutine(id: string, name: string, sequence: any[], onSuccess: () => void, suppressAlert?: boolean) {
        setIsSaving(true);
        try {
            // We need to preserve created_at or fetch existing? 
            // The UI passes ID, Name, Sequence. 
            // We should ideally fetch first or assume we have it in 'routines' state to merge?
            const existing = routines.find(r => r.id === id);
            const routineToSave = { 
                ...existing, // keep created_at
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
    }

    function deleteRoutine(id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) {
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
    }
    
    // Legacy persistence effect removed



    // Return Context
    const value = {
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
        fetchWorkoutLogDetails: async (id: string) => ({ data: [], error: null }), // Stub for now or impl
        saveCompletedWorkout,
        deleteWorkoutLog: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => {
            const performDelete = async () => {
                try {
                    await DataRepository.deleteHistory(id);
                    setWorkoutHistory(prev => prev.filter(h => h.id !== id));
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
        },
        createCustomExercise: async (name: string, type: string) => ({}),
        lastSyncedAt,
        sync,
        isSyncing,
    };

    return <WorkoutManagerContext.Provider value={value}>{children}</WorkoutManagerContext.Provider>;
}

export function useWorkoutManager() {
    const context = useContext(WorkoutManagerContext);
    if (!context) throw new Error("useWorkoutManager must be used within provider");
    return context;
}
