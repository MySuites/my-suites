import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase, useAuth } from "@mycsuite/auth";

export type SetLog = {
    id?: string;
    weight?: number;
    reps?: number;
    duration?: number; // seconds
};

export type Exercise = {
    id: string;
    name: string;
    sets: number; // Target sets
    reps: number; // Target reps

    // Legacy support? Or replace?
    // We'll keep completedSets as a derived getter or simple counter if needed, but primary is logs.
    completedSets: number;

    logs?: SetLog[]; // Array of completed set details
    type?: "reps" | "duration" | "bodyweight"; // Determines input type
};

export type WorkoutLog = {
    id: string; // workout_log_id
    workoutId?: string;
    userId: string;
    workoutTime: string;
    notes?: string;
    workoutName?: string; // joined from workouts table
    createdAt: string;
};

// --- Helper / API Functions (Outside Hook) ---

async function getOrCreateExercise(user: any, ex: any) {
    if (!user) return null;
    try {
        const { data: existing } = await supabase
            .from("exercises")
            .select("exercise_id")
            .ilike("exercise_name", ex.name)
            .eq("user_id", user.id)
            .maybeSingle();
        if (existing && existing.exercise_id) return existing.exercise_id;
        const { data: ins } = await supabase
            .from("exercises")
            .insert([{
                exercise_name: ex.name,
                exercise_type: "bodyweight_reps",
                description: null,
                user_id: user.id,
            }])
            .select()
            .single();
        return ins?.exercise_id ?? null;
    } catch {
        console.warn("getOrCreateExercise error");
        return null;
    }
}

async function fetchUserWorkouts(user: any) {
    if (!user) return { data: [], error: null };
    const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    return { data, error };
}

async function fetchUserRoutines(user: any) {
    if (!user) return { data: [], error: null };
    // We rely on RLS policies to ensure users only see their own routines.
    const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("created_at", { ascending: false });
    return { data, error };
}

async function fetchWorkoutHistory(user: any) {
    if (!user) return { data: [], error: null };
    const { data: logs, error } = await supabase
        .from("workout_logs")
        .select(`
            workout_log_id,
            workout_id,
            user_id,
            workout_time,
            notes,
            created_at,
            workouts ( workout_name )
        `)
        .eq("user_id", user.id)
        .order("workout_time", { ascending: false });

    if (error) return { data: [], error };

    const formatted = logs?.map((log: any) => {
        let fallbackName = undefined;
        try {
            if (log.notes) {
                const parsed = JSON.parse(log.notes);
                if (parsed.name) fallbackName = parsed.name;
            }
        } catch {}

        return {
            id: log.workout_log_id,
            workoutId: log.workout_id,
            userId: log.user_id,
            workoutTime: log.workout_time,
            notes: log.notes,
            workoutName: log.workouts?.workout_name || fallbackName ||
                "Untitled Workout",
            createdAt: log.created_at,
        };
    }) || [];

    return { data: formatted, error: null };
}

export async function fetchExercises(user: any) {
    if (!user) return { data: [], error: null };

    // Fetch user specific exercises
    // Note: If you have a 'global' exercises table or rows with user_id is null, handle that here.
    // For now assuming we just want user's exercises or RLS handles it.
    const { data, error } = await supabase
        .from("exercises")
        .select("exercise_id, exercise_name, exercise_type")
        .order("exercise_name", { ascending: true });

    if (error) return { data: [], error };

    const mapped = data.map((e: any) => ({
        id: e.exercise_id,
        name: e.exercise_name,
        category: e.exercise_type || "General", // map type to category
    }));

    return { data: mapped, error: null };
}

async function createCustomExerciseInSupabase(
    user: any,
    name: string,
    type: string = "bodyweight_reps",
) {
    if (!user) return { error: "User not logged in" };

    const { data, error } = await supabase
        .from("exercises")
        .insert([{
            exercise_name: name.trim(),
            exercise_type: type,
            user_id: user.id,
        }])
        .select()
        .single();

    return { data, error };
}

async function persistCompletedWorkoutToSupabase(
    user: any,
    name: string,
    exercises: Exercise[],
    duration: number,
    workoutId?: string,
) {
    if (!user) return { error: "User not logged in" };

    const notesObj = {
        name,
        duration,
        exercises, // Store full exercise log in notes for now
    };

    const { data, error } = await supabase
        .from("workout_logs")
        .insert([{
            user_id: user.id,
            workout_id: workoutId || null,
            workout_time: new Date().toISOString(),
            notes: JSON.stringify(notesObj),
        }])
        .select()
        .single();

    return { data, error };
}

async function persistWorkoutToSupabase(
    user: any,
    workoutName: string,
    exercises: Exercise[],
) {
    if (!user) return { error: "User not logged in" };

    if (workoutName.trim().toLowerCase() === "rest") {
        return { error: "Cannot create a workout named 'Rest'" };
    }

    const { data: wdata, error: wErr } = await supabase
        .from("workouts")
        .insert([{
            user_id: user.id,
            workout_name: workoutName.trim(),
            notes: JSON.stringify(exercises),
        }])
        .select()
        .single();

    if (wErr || !wdata) {
        return { error: wErr || "Failed to create workout" };
    }

    const workoutId = wdata.workout_id;
    // For each exercise, find/create exercise, create workout_exercises and exercise_sets
    for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const exerciseId = await getOrCreateExercise(user, ex);
        if (!exerciseId) continue;

        // insert workout_exercises with explicit position
        const { data: weData, error: weErr } = await supabase
            .from("workout_exercises").insert([{
                workout_id: workoutId,
                exercise_id: exerciseId,
                position: i,
            }]).select().single();

        if (weErr || !weData) {
            console.warn("Failed to insert workout_exercise", weErr);
            continue;
        }

        const workoutExerciseId = weData.workout_exercise_id;
        // insert exercise_sets for the number of sets
        for (let s = 1; s <= (ex.sets || 1); s++) {
            try {
                await supabase.from("exercise_sets").insert([{
                    workout_exercise_id: workoutExerciseId,
                    set_number: s,
                    details: { reps: ex.reps },
                }]);
            } catch (esErr) {
                console.warn("Failed to insert exercise_set", esErr);
            }
        }
    }

    return { data: wdata };
}

async function deleteWorkoutFromSupabase(user: any, id: string) {
    if (!user) return;
    try {
        await supabase.from("workouts").delete().eq("workout_id", id);
    } catch (e) {
        console.warn("Failed to delete workout", e);
        throw e;
    }
}

async function persistRoutineToSupabase(
    user: any,
    routineName: string,
    sequence: any[],
) {
    if (!user) return { error: "User not logged in" };

    // Invoke the 'create-routine' Edge Function to handle the complex transaction
    const { data: responseData, error: invokeError } = await supabase.functions
        .invoke("create-routine", {
            body: {
                routine_name: routineName.trim(),
                exercises: sequence,
                user_id: user.id,
            },
        });

    const data = responseData?.data;
    const error = invokeError ||
        (responseData?.error ? new Error(responseData.error) : null);

    if (error || !data) {
        return { error: error || "Failed to create routine" };
    }

    return { data };
}

async function persistUpdateRoutineToSupabase(
    user: any,
    routineId: string,
    routineName: string,
    sequence: any[],
) {
    if (!user) return { error: "User not logged in" };

    // Simply update the row
    const { data, error } = await supabase
        .from("routines")
        .update({
            routine_name: routineName.trim(),
            description: JSON.stringify(sequence), // Assuming description is used for sequence storage as seen in fetch
            // updated_at: new Date().toISOString() // Assuming there's a trigger or we let DB handle it
        })
        .eq("routine_id", routineId)
        .select()
        .single();

    if (error || !data) {
        return { error: error || "Failed to update routine" };
    }

    return { data };
}



async function persistUpdateSavedWorkoutToSupabase(
    user: any,
    workoutId: string,
    workoutName: string,
    exercises: Exercise[],
) {
    if (!user) return { error: "User not logged in" };

    if (workoutName.trim().toLowerCase() === "rest") {
        return { error: "Cannot name workout 'Rest'" };
    }

    // 1. Update the parent workout row
    const { data: wdata, error: wErr } = await supabase
        .from("workouts")
        .update({
            workout_name: workoutName.trim(),
            notes: JSON.stringify(exercises),
            // updated_at: new Date().toISOString() // Let DB handle
        })
        .eq("workout_id", workoutId)
        .select()
        .single();

    if (wErr || !wdata) {
        return { error: wErr || "Failed to update workout" };
    }

    // 2. Sync workout_exercises
    // Delete existing
    const { error: delErr } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_id", workoutId);
    
    if (delErr) {
        console.warn("Failed to clear old exercises", delErr);
    }

    // Insert new
    for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const exerciseId = await getOrCreateExercise(user, ex);
        if (!exerciseId) continue;

        const { data: weData, error: weErr } = await supabase
            .from("workout_exercises").insert([{
                workout_id: workoutId,
                exercise_id: exerciseId,
                position: i,
            }]).select().single();

        if (weErr || !weData) continue;

        // Insert sets
        const workoutExerciseId = weData.workout_exercise_id;
        for (let s = 1; s <= (ex.sets || 1); s++) {
             await supabase.from("exercise_sets").insert([{
                workout_exercise_id: workoutExerciseId,
                set_number: s,
                details: { reps: ex.reps },
            }]);
        }
    }

    return { data: wdata };
}

// --- Context ---

interface WorkoutManagerContextType {
    savedWorkouts: any[];
    routines: any[];
    activeRoutine: {
        id: string;
        dayIndex: number;
        lastCompletedDate?: string;
    } | null;
    startActiveRoutine: (id: string) => void;
    markRoutineDayComplete: () => void;
    clearActiveRoutine: () => void;
    isSaving: boolean;
    saveWorkout: (name: string, exercises: Exercise[], onSuccess: () => void) => Promise<void>;
    deleteSavedWorkout: (id: string) => void;
    updateSavedWorkout: (id: string, name: string, exercises: Exercise[], onSuccess: () => void) => Promise<void>;
    saveRoutineDraft: (name: string, sequence: any[], onSuccess: () => void) => Promise<void>;
    updateRoutine: (id: string, name: string, sequence: any[], onSuccess: () => void) => Promise<void>;
    deleteRoutine: (id: string, onSuccess?: () => void) => void;
    workoutHistory: WorkoutLog[];
    fetchWorkoutLogDetails: (logId: string) => Promise<{ data: any[], error: any }>;
    saveCompletedWorkout: (name: string, exercises: Exercise[], duration: number, onSuccess?: () => void) => Promise<void>;
    createCustomExercise: (name: string, type: string) => Promise<{ data?: any, error?: any }>;
}

const WorkoutManagerContext = createContext<WorkoutManagerContextType | undefined>(undefined);

export function WorkoutManagerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
    const [routines, setRoutines] = useState<any[]>([]);
    const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Active Routine progress state
    const [activeRoutine, setActiveRoutine] = useState<
        {
            id: string;
            dayIndex: number; // 0-based index in sequence
            lastCompletedDate?: string;
        } | null
    >(null);

    // Load saved routines and saved workouts on mount
    useEffect(() => {
        // If user is signed in, fetch saved workouts from Supabase, otherwise load local
        async function fetchSaved() {
            try {
                if (user) {
                    // Fetch workouts
                    const { data: wData, error: wError } =
                        await fetchUserWorkouts(user);
                    if (!wError && Array.isArray(wData)) {
                        const mapped = wData
                            .map((w: any) => {
                                let exercises = [];
                                try {
                                    exercises = w.notes
                                        ? JSON.parse(w.notes)
                                        : [];
                                } catch {
                                    // ignore parse error
                                }
                                return {
                                    id: w.workout_id,
                                    name: w.workout_name,
                                    exercises,
                                    createdAt: w.created_at,
                                };
                            })
                            .filter((w: any) =>
                                w.name && w.name.trim().toLowerCase() !== "rest"
                            ); // Filter out "Rest" workouts
                        setSavedWorkouts(mapped);
                    }

                    // Fetch routines
                    const { data: rData, error: rError } =
                        await fetchUserRoutines(user);
                    if (!rError && Array.isArray(rData)) {
                        const mappedRoutines = rData.map((r: any) => {
                            let sequence = [];
                            try {
                                // Description field contains the JSON sequence of the routine
                                sequence = r.description
                                    ? JSON.parse(r.description)
                                    : [];
                            } catch {
                                // If parsing fails, default to empty sequence to prevent crash
                            }
                            return {
                                id: r.routine_id,
                                name: r.routine_name,
                                sequence,
                                createdAt: r.created_at,
                            };
                        });
                        setRoutines(mappedRoutines);
                    }

                    // Fetch history
                    const { data: hData, error: hError } =
                        await fetchWorkoutHistory(user);
                    if (!hError) {
                        setWorkoutHistory(hData);
                    }
                } else {
                    if (typeof window !== "undefined" && window.localStorage) {
                        const rawW = window.localStorage.getItem(
                            "mycpo_saved_workouts",
                        );
                        if (rawW) {
                            const parsed = JSON.parse(rawW);
                            // Filter out "Rest" workouts from local storage too
                            const filtered = Array.isArray(parsed)
                                ? parsed.filter((w: any) =>
                                    w.name &&
                                    w.name.trim().toLowerCase() !== "rest"
                                )
                                : [];
                            setSavedWorkouts(filtered);
                        }
                        const rawR = window.localStorage.getItem(
                            "mycpo_workout_routines",
                        );
                        if (rawR) setRoutines(JSON.parse(rawR));
                        const rawActive = window.localStorage.getItem(
                            "mycpo_active_routine",
                        );
                        if (rawActive) setActiveRoutine(JSON.parse(rawActive));
                    }
                }
            } catch {
                // ignore
            }
        }
        fetchSaved();
    }, [user]);

    // Persist saved workouts and routines when changed
    useEffect(() => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(
                    "mycpo_saved_workouts",
                    JSON.stringify(savedWorkouts),
                );
                window.localStorage.setItem(
                    "mycpo_workout_routines",
                    JSON.stringify(routines),
                );
                if (activeRoutine) {
                    window.localStorage.setItem(
                        "mycpo_active_routine",
                        JSON.stringify(activeRoutine),
                    );
                } else {
                    window.localStorage.removeItem("mycpo_active_routine");
                }
            }
        } catch {
            // ignore
        }
    }, [savedWorkouts, routines, activeRoutine]);

    async function saveWorkout(
        workoutName: string,
        exercises: Exercise[],
        onSuccess: () => void,
    ) {
        if (!workoutName || workoutName.trim() === "") {
            Alert.alert(
                "Name required",
                "Please enter a name for the workout.",
            );
            return;
        }

        if (workoutName.trim().toLowerCase() === "rest") {
            Alert.alert(
                "Invalid Name",
                "Workout cannot be named 'Rest'. This name is reserved.",
            );
            return;
        }

        // If user is signed in, persist normalized rows to Supabase
        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistWorkoutToSupabase(
                    user,
                    workoutName,
                    exercises,
                );

                if (error || !data) {
                    console.warn("Failed to create workout on server", error);
                    Alert.alert(
                        "Error",
                        "Failed to save workout to server. Saved locally instead.",
                    );
                } else {
                    const payload = {
                        id: data.workout_id,
                        name: data.workout_name,
                        exercises,
                        createdAt: data.created_at,
                    };
                    setSavedWorkouts((rs) => [payload, ...rs]);
                    onSuccess();
                    Alert.alert("Saved", `Workout '${payload.name}' saved.`);
                    return;
                }
            } finally {
                setIsSaving(false);
            }
        }

        // Fallback: save locally
        const id = Date.now().toString();
        const payload = {
            id,
            name: workoutName.trim(),
            exercises,
            createdAt: new Date().toISOString(),
        };
        setSavedWorkouts((rs) => [payload, ...rs]);
        onSuccess();
        Alert.alert("Saved", `Workout '${payload.name}' saved locally.`);
    }

    async function saveCompletedWorkout(
        name: string,
        exercises: Exercise[],
        duration: number,
        onSuccess?: () => void,
    ) {
        if (user) {
            setIsSaving(true);
            try {
                const { error } = await persistCompletedWorkoutToSupabase(
                    user,
                    name,
                    exercises,
                    duration,
                );

                if (error) {
                    Alert.alert("Error", "Failed to save workout log.");
                } else {
                    // Refresh history
                    const { data: hData } = await fetchWorkoutHistory(user);
                    if (hData) setWorkoutHistory(hData);
                    onSuccess?.();
                }
            } finally {
                setIsSaving(false);
            }
        } else {
            // Local storage logic for history could go here, but for now just alert
            // TODO: Local history
            Alert.alert(
                "Completed",
                "Workout finished! (Not saved - login to save history)",
            );
            onSuccess?.();
        }
    }

    function deleteSavedWorkout(id: string) {
        Alert.alert("Delete workout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    // If user is signed in, attempt server delete first
                    if (user) {
                        try {
                            await deleteWorkoutFromSupabase(user, id);
                        } catch {
                            // ignore server delete errors and continue to remove locally
                        }
                    }
                    setSavedWorkouts((s) => s.filter((x) => x.id !== id));
                },
            },
        ]);
    }

    async function updateSavedWorkout(
        id: string,
        name: string,
        exercises: Exercise[],
        onSuccess: () => void
    ) {
        if (!name || name.trim() === "") {
            Alert.alert("Name required", "Please enter a name for the workout.");
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistUpdateSavedWorkoutToSupabase(user, id, name, exercises);
                if (error || !data) {
                    Alert.alert("Error", "Failed to update workout on server.");
                } else {
                    const payload = {
                        id: data.workout_id,
                        name: data.workout_name,
                        exercises,
                        createdAt: data.created_at,
                    };
                    setSavedWorkouts(prev => prev.map(w => w.id === id ? payload : w));
                    onSuccess();
                    Alert.alert("Updated", `Workout '${payload.name}' updated.`);
                }
            } finally {
                setIsSaving(false);
            }
        } else {
             // Local update
             const payload = {
                id,
                name: name.trim(),
                exercises,
                createdAt: new Date().toISOString(),
            };
            setSavedWorkouts(prev => prev.map(w => w.id === id ? { ...w, ...payload, createdAt: w.createdAt } : w));
            onSuccess();
            Alert.alert("Updated", `Workout '${name}' updated locally.`);
        }
    }

    async function saveRoutineDraft(
        routineDraftName: string,
        routineSequence: any[],
        onSuccess: () => void,
    ) {
        if (!routineDraftName || routineDraftName.trim() === "") {
            Alert.alert(
                "Name required",
                "Please enter a name for the routine.",
            );
            return;
        }
        if (routineSequence.length === 0) {
            Alert.alert(
                "Empty routine",
                "Please add at least one day to the routine.",
            );
            return;
        }

        // If user is signed in, attempt to save to Supabase
        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistRoutineToSupabase(
                    user,
                    routineDraftName,
                    routineSequence,
                );

                if (error || !data) {
                    console.warn("Supabase save routine error", error);
                    Alert.alert(
                        "Error",
                        "Failed to save routine to server. Saving locally instead.",
                    );
                } else {
                    // Add to local list using server id
                    const payload = {
                        id: data.routine_id,
                        name: data.routine_name,
                        sequence: routineSequence,
                        createdAt: data.created_at,
                    };
                    setRoutines((rs) => [payload, ...rs]);
                    onSuccess();
                    Alert.alert("Saved", `Routine '${payload.name}' saved.`);
                    return;
                }
            } finally {
                setIsSaving(false);
            }
        }

        // Fallback: save locally
        const id = Date.now().toString();
        const payload = {
            id,
            name: routineDraftName.trim(),
            sequence: routineSequence,
            createdAt: new Date().toISOString(),
        };
        setRoutines((rs) => [payload, ...rs]);
        onSuccess();
        Alert.alert("Saved", `Routine '${payload.name}' saved locally.`);
    }

    async function updateRoutine(
        id: string,
        name: string,
        sequence: any[],
        onSuccess: () => void,
    ) {
        if (!name || name.trim() === "") {
            Alert.alert("Name required", "Please enter a name for the routine.");
            return;
        }
        if (sequence.length === 0) {
            Alert.alert("Empty routine", "Please add at least one day.");
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistUpdateRoutineToSupabase(user, id, name, sequence);
                if (error || !data) {
                    Alert.alert("Error", "Failed to update routine on server.");
                } else {
                    setRoutines(prev => prev.map(r => r.id === id ? { ...r, name: data.routine_name, sequence } : r));
                    onSuccess();
                    Alert.alert("Updated", `Routine '${name}' updated.`);
                }
            } finally {
                setIsSaving(false);
            }
        } else {
            // Local update
            setRoutines(prev => prev.map(r => r.id === id ? { ...r, name, sequence } : r));
            onSuccess();
            Alert.alert("Updated", `Routine '${name}' updated locally.`);
        }
    }

    function deleteRoutine(id: string, onSuccess?: () => void) {
        Alert.alert("Delete routine", "Are you sure? This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    if (user) {
                        try {
                             await supabase.from("routines").delete().eq("routine_id", id);
                        } catch (e) {
                             console.warn("Failed to delete routine on server", e);
                        }
                    }
                    setRoutines((rs) => rs.filter((x) => x.id !== id));
                    if (activeRoutine?.id === id) {
                        clearActiveRoutine();
                    }
                    onSuccess?.();
                },
            },
        ]);
    }

    const fetchWorkoutLogDetails = useCallback(async (logId: string) => {
        if (!user) return { data: [], error: "User not logged in" };
        const { data: setLogs, error } = await supabase
            .from("set_logs")
            .select(`
                set_log_id,
                details,
                notes,
                exercise_sets (
                    set_number,
                    workout_exercises (
                        position,
                        exercises (
                            exercise_name
                        )
                    )
                )
            `)
            .eq("workout_log_id", logId)
            .order("created_at", { ascending: true }); // Simple ordering

        if (error) return { data: [], error };

        // Group by exercise
        // Structure: { [exerciseName]: { name: string, sets: [] } }
        const grouped: Record<string, any> = {};

        setLogs?.forEach((log: any) => {
            const exName = log.exercise_sets?.workout_exercises?.exercises
                ?.exercise_name || "Unknown Exercise";
            const position = log.exercise_sets?.workout_exercises?.position ||
                999;

            if (!grouped[exName]) {
                grouped[exName] = {
                    name: exName,
                    position: position,
                    sets: [],
                };
            }

            grouped[exName].sets.push({
                setNumber: log.exercise_sets?.set_number,
                details: log.details, // e.g. { reps: 10 }
                notes: log.notes,
            });
        });

        // Convert to array and sort by position
        const result = Object.values(grouped).sort((a: any, b: any) =>
            a.position - b.position
        );

        return { data: result, error: null };
    }, [user]);

    function startActiveRoutine(routineId: string) {
        setActiveRoutine({
            id: routineId,
            dayIndex: 0,
        });
    }

    const markRoutineDayComplete = useCallback(() => {
        if (!activeRoutine) return;
        setActiveRoutine((prev) =>
            prev
                ? ({
                    ...prev,
                    lastCompletedDate: new Date().toISOString(),
                })
                : null
        );
    }, [activeRoutine]);

    // Auto-advance routine day if completed on a previous day
    useEffect(() => {
        if (activeRoutine && activeRoutine.lastCompletedDate) {
            const lastDate = new Date(activeRoutine.lastCompletedDate);
            const today = new Date();
            // Reset hours to compare only dates
            lastDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            if (lastDate.getTime() < today.getTime()) {
                // It was completed yesterday or before -> Advance!
                setActiveRoutine((prev) =>
                    prev
                        ? ({
                            ...prev,
                            dayIndex: prev.dayIndex + 1,
                            lastCompletedDate: undefined, // Clear completion so it's fresh for new day
                        })
                        : null
                );
            }
        }
    }, [activeRoutine, activeRoutine?.lastCompletedDate]); // Depend on the date string

    function clearActiveRoutine() {
        setActiveRoutine(null);
    }

    const value = {
        savedWorkouts,
        routines,
        activeRoutine,
        startActiveRoutine,
        markRoutineDayComplete,
        clearActiveRoutine,
        isSaving,
        saveWorkout,
        deleteSavedWorkout,
        updateSavedWorkout,
        saveRoutineDraft,
        updateRoutine,
        deleteRoutine,
        workoutHistory,
        fetchWorkoutLogDetails,
        saveCompletedWorkout,
        createCustomExercise: async (name: string, type: string) => {
            return createCustomExerciseInSupabase(user, name, type);
        },
    };

    return (
        <WorkoutManagerContext.Provider value={value}>
            {children}
        </WorkoutManagerContext.Provider>
    );
}

export function useWorkoutManager() {
    const context = useContext(WorkoutManagerContext);
    if (context === undefined) {
        throw new Error('useWorkoutManager must be used within a WorkoutManagerProvider');
    }
    return context;
}
