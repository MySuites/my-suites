import { supabase } from "@mysuite/auth";
import { Exercise } from "./types";
import { DataRepository } from "../../providers/DataRepository";

function isUUID(str: string) {
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
}

// Local-First: Always fetch from local DB
export async function fetchWorkoutHistory(user: any) {
    // We ignore the 'user' arg for fetching because DataRepository is the source of truth for the active device
    // But we can filter if needed. For now, assuming single-user local DB or SyncService handles the scope.

    try {
        const history = await DataRepository.getHistory();
        // If user is provided, we could filter, but typically SyncService ensures local DB only has relevant data
        // const filtered = user ? history.filter(h => h.userId === user.id) : history;
        return { data: history, error: null };
    } catch (e) {
        console.error("Local history fetch failed", e);
        return { data: [], error: e };
    }
}

// Write Path: Still goes to Supabase directly for now (Phase 2 will move this to SyncService)
export async function persistCompletedWorkoutToSupabase(
    user: any,
    name: string,
    exercises: Exercise[],
    duration: number,
    workoutId?: string,
    note?: string,
    workoutTime?: string, // Added param
) {
    if (!user) return { error: "User not logged in" };

    // Strip actual logs from the notes used for the workout summary
    // This preserves the "plan" but moves the "performance" to set_logs
    const exercisesForNotes = exercises.map(({ logs, ...rest }) => {
        // Filter setTargets - only save completed sets
        if (typeof rest.completedSets === "number" && rest.setTargets) {
            rest.setTargets = rest.setTargets.slice(0, rest.completedSets);
        }

        // Remove redundant keys
        if ("type" in rest) delete (rest as any).type;
        if ("sets" in rest) delete (rest as any).sets;
        if ("reps" in rest) delete (rest as any).reps;
        if ("completedSets" in rest) delete (rest as any).completedSets;

        return rest;
    });

    const notesObj = {
        name,
        duration,
        exercises: exercisesForNotes,
    };

    // 1. Create Workout Log
    const { data: workoutLog, error: workoutLogError } = await supabase
        .from("workout_logs")
        .insert([{
            user_id: user.id,
            // workout_id is removed
            workout_time: workoutTime || new Date().toISOString(),
            exercises: JSON.stringify(notesObj),
            workout_name: name,
            duration: duration,
            note: note || null, // New column
        }])
        .select()
        .single();

    if (workoutLogError || !workoutLog) {
        return { data: null, error: workoutLogError };
    }

    // 2. Create Set Logs
    const setLogInserts: any[] = [];

    // Identify potential UUIDs to verify
    const candidateIds = new Set<string>();
    exercises.forEach((ex) => {
        if (isUUID(ex.id)) candidateIds.add(ex.id);
    });

    // Verification step: Check which IDs actually exist in the DB
    let validIds = new Set<string>();
    if (candidateIds.size > 0) {
        const { data: existingExercises } = await supabase
            .from("exercises")
            .select("exercise_id")
            .in("exercise_id", Array.from(candidateIds));

        if (existingExercises) {
            existingExercises.forEach((e: any) => validIds.add(e.exercise_id));
        }
    }

    exercises.forEach((ex) => {
        if (ex.logs && ex.logs.length > 0) {
            ex.logs.forEach((log, index) => {
                const isValidId = validIds.has(ex.id);
                setLogInserts.push({
                    workout_log_id: workoutLog.workout_log_id,
                    exercise_set_id: null,
                    details: {
                        ...log,
                        exercise_name: ex.name,
                        exercise_id: ex.id,
                        set_number: index + 1,
                    },
                    exercise_id: isValidId ? ex.id : null,
                    created_at: new Date().toISOString(),
                });
            });
        }
    });

    if (setLogInserts.length > 0) {
        const { error: setLogsError } = await supabase
            .from("set_logs")
            .insert(setLogInserts);

        if (setLogsError) {
            console.warn("Failed to insert set logs", setLogsError);
            // Non-fatal, workout log is saved
        }
    }

    return { data: workoutLog, error: null };
}

export async function fetchWorkoutLogDetails(user: any, logId: string) {
    // Local-First: Always use DataRepository
    try {
        const history = await DataRepository.getHistory();
        const log = history.find((h) => h.id === logId);

        if (!log) return { data: [], error: "Workout log not found locally" };

        const mappedData = log.exercises.map((ex, index) => ({
            name: ex.name,
            position: index,
            sets: ex.logs?.map((setLog, setIndex) => ({
                setNumber: setIndex + 1,
                details: {
                    ...setLog,
                    exercise_name: ex.name,
                    exercise_id: ex.id,
                },
                notes: null, // Local logs inside exercise don't store per-set notes currently
            })) || [],
            properties: ex.properties || [],
        }));

        return { data: mappedData, error: null };
    } catch (err: any) {
        console.warn("fetchWorkoutLogDetails failed", err);
        return { data: [], error: err.message || "Failed to load details" };
    }
}

export async function fetchFullWorkoutHistory(user: any) {
    // Just alias to the main local fetch
    return fetchWorkoutHistory(user);
}

export async function deleteWorkoutLogFromSupabase(user: any, logId: string) {
    // Local-First: Soft delete via repository
    await DataRepository.deleteHistory(logId);
}
