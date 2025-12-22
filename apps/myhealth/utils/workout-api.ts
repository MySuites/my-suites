import { supabase } from "@mycsuite/auth";

export type SetLog = {
    id?: string;
    weight?: number; // lbs
    reps?: number;
    duration?: number; // seconds
    distance?: number; // meters or user unit, not used yet but good to have
};

export type Exercise = {
    id: string;
    name: string;
    sets: number; // Target sets
    reps: number; // Target reps/duration/distance
    completedSets: number;
    logs?: SetLog[];
    properties?: string[]; // E.g. ["Weighted", "Reps", "Bodyweight"]
    setTargets?: {
        reps: number;
        weight: number;
        duration?: number;
        distance?: number;
    }[];
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

export async function fetchUserWorkouts(user: any) {
    if (!user) return { data: [], error: null };
    const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .is("routine_id", null)
        .order("created_at", { ascending: false });
    return { data, error };
}

export async function fetchUserRoutines(user: any) {
    if (!user) return { data: [], error: null };
    // We rely on RLS policies to ensure users only see their own routines.
    const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("created_at", { ascending: false });
    return { data, error };
}

export async function fetchWorkoutHistory(user: any) {
    if (!user) return { data: [], error: null };

    // Try rich query first
    let { data: logs, error } = await supabase
        .from("workout_logs")
        .select(`
            workout_log_id,
            workout_id,
            user_id,
            workout_time,
            exercises,
            created_at,
            workout_name,
            note,
            workouts ( workout_name )
        `)
        .eq("user_id", user.id)
        .order("workout_time", { ascending: false });

    // Fallback to simple query if rich query fails
    if (error) {
        console.warn("Rich history fetch failed, trying simple query", error);
        const { data: simpleLogs, error: simpleError } = await supabase
            .from("workout_logs")
            .select("*")
            .eq("user_id", user.id)
            .order("workout_time", { ascending: false });

        if (simpleError) {
            return { data: [], error: simpleError };
        }
        logs = simpleLogs;
    }

    const formatted = logs?.map((log: any) => {
        let fallbackName = undefined;
        try {
            if (log.notes) {
                const parsed = JSON.parse(log.notes);
                if (parsed.name) fallbackName = parsed.name;
            }
        } catch {}

        // Handle potential missing columns from fallback
        // Check for 'exercises' if 'notes' is missing (schema change)
        const notes = log.notes || (log.exercises ? log.exercises : undefined);

        // Try to parse name from exercises/notes JSON if workout_name is missing
        if (!fallbackName && notes) {
            try {
                const parsed = typeof notes === "string"
                    ? JSON.parse(notes)
                    : notes;
                if (parsed.name) fallbackName = parsed.name;
            } catch {}
        }

        // Use the explicit user note column if available
        // If not, don't show the JSON dump in the notes field
        const userNote = log.note || log.user_note || null;

        return {
            id: log.workout_log_id,
            workoutId: log.workout_id,
            userId: log.user_id,
            workoutTime: log.workout_time,
            notes: userNote, // Only show user entered note
            workoutName: log.workout_name || log.workouts?.workout_name ||
                fallbackName ||
                "Untitled Workout",
            createdAt: log.created_at,
        };
    }) || [];

    return { data: formatted, error: null };
}

export async function fetchExercises(user: any) {
    if (!user) return { data: [], error: null };

    // Fetch user specific exercises with muscle groups
    const { data, error } = await supabase
        .from("exercises")
        .select(`
            exercise_id, 
            exercise_name, 
            properties,
            exercise_muscle_groups (
                role,
                muscle_groups ( name )
            )
        `)
        .order("exercise_name", { ascending: true });

    if (error) return { data: [], error };

    const mapped = data.map((e: any) => {
        // Get primary muscle group or first available
        const muscles = e.exercise_muscle_groups || [];
        const primary = muscles.find((m: any) => m.role === "primary");
        const firstMuscle = primary
            ? primary.muscle_groups?.name
            : (muscles[0]?.muscle_groups?.name);

        // Parse properties from comma-separated string
        const properties = e.properties
            ? e.properties.split(",").map((s: string) => s.trim())
            : [];

        return {
            id: e.exercise_id,
            name: e.exercise_name,
            category: firstMuscle || "General",
            properties: properties,
            // Keep rawType if needed for now, or just rely on properties
            rawType: e.properties,
        };
    });

    return { data: mapped, error: null };
}

// Fetch all available muscle groups
export async function fetchMuscleGroups() {
    const { data, error } = await supabase
        .from("muscle_groups")
        .select("*")
        .order("name", { ascending: true });
    return { data, error };
}

// Fetch stats for chart
export async function fetchExerciseStats(
    user: any,
    exerciseId: string,
    metric: "weight" | "reps" | "duration" | "distance" = "weight",
) {
    if (!user) return { data: [], error: null };

    const { data: setLogs, error } = await supabase
        .from("set_logs")
        .select(`
            details,
            created_at,
            workout_log_id
        `)
        .eq("exercise_id", exerciseId)
        .order("created_at", { ascending: true });

    if (error) return { data: [], error };

    // Aggregate by day
    const grouped = new Map();
    setLogs.forEach((log: any) => {
        if (!log.details) return;

        const dateKey = new Date(log.created_at).toDateString(); // Group by calendar day

        // Determine value based on requested metric
        let val = 0;
        let valid = false;

        if (
            metric === "weight" && log.details.weight &&
            !isNaN(parseFloat(log.details.weight))
        ) {
            val = parseFloat(log.details.weight);
            valid = true;
        } else if (
            metric === "reps" && log.details.reps &&
            !isNaN(parseFloat(log.details.reps))
        ) {
            val = parseFloat(log.details.reps);
            valid = true;
        } else if (
            metric === "duration" && log.details.duration &&
            !isNaN(parseFloat(log.details.duration))
        ) {
            val = parseFloat(log.details.duration);
            valid = true;
        } else if (
            metric === "distance" && log.details.distance &&
            !isNaN(parseFloat(log.details.distance))
        ) {
            val = parseFloat(log.details.distance);
            valid = true;
        }

        // If looking for weight but it's 0 or missing, it might be bodyweight.
        // For now, if valid=false, we skip.

        if (valid) {
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, {
                    date: log.created_at,
                    max: val,
                    total: val,
                    dataPointText: val.toString(),
                });
            } else {
                const entry = grouped.get(dateKey);
                // For weight, max is usually relevant. For reps, maybe max reps in a set?
                // Let's stick to MAX for now as "Personal Record" logic.
                if (val > entry.max) {
                    entry.max = val;
                    entry.dataPointText = val.toString();
                }
                entry.total += val;
            }
        }
    });

    const sorted = Array.from(grouped.values()).sort((a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const chartData = sorted.map((item: any) => ({
        value: item.max,
        label: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        dataPointText: item.dataPointText,
    }));

    return { data: chartData, error: null };
}

export async function createCustomExerciseInSupabase(
    user: any,
    name: string,
    type: string = "bodyweight_reps",
    primaryMuscle?: string,
    secondaryMuscles?: string[],
) {
    if (!user) return { error: "User not logged in" };

    // 1. Create Exercise
    const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercises")
        .insert([{
            exercise_name: name.trim(),
            properties: type,
            user_id: user.id,
        }])
        .select()
        .single();

    if (exerciseError || !exerciseData) {
        return { data: null, error: exerciseError };
    }

    // 2. Link Muscle Groups
    const muscleInserts: any[] = [];

    // We need to fetch muscle group IDs for the names provided
    // Ideally we pass IDs from the frontend, but if names, we resolve them.
    // Let's assume frontend passes IDs since we will switch to dropdowns relying on fetchMuscleGroups.
    // Or if names, we'd need a lookup. Let's assume IDs or names that strictly match.
    // Given the UI plan, we should fetch muscle groups first and pass their IDs.

    // However, if we want to be robust to mismatched names, let's fetch IDs for the provided strings if they look like names.
    // For now, let's assume the frontend will pass the correct ID if we provide it.

    if (primaryMuscle) {
        muscleInserts.push({
            exercise_id: exerciseData.exercise_id,
            muscle_group_id: primaryMuscle,
            role: "primary",
        });
    }

    if (secondaryMuscles && secondaryMuscles.length > 0) {
        secondaryMuscles.forEach((mId) => {
            // Avoid duplicate primary
            if (mId !== primaryMuscle) {
                muscleInserts.push({
                    exercise_id: exerciseData.exercise_id,
                    muscle_group_id: mId,
                    role: "secondary",
                });
            }
        });
    }

    if (muscleInserts.length > 0) {
        const { error: muscleError } = await supabase
            .from("exercise_muscle_groups")
            .insert(muscleInserts);

        if (muscleError) {
            console.warn("Failed to link muscle groups", muscleError);
            // We don't fail the whole creation, just warn
        }
    }

    return { data: exerciseData, error: null };
}

export async function persistCompletedWorkoutToSupabase(
    user: any,
    name: string,
    exercises: Exercise[],
    duration: number,
    workoutId?: string,
    note?: string,
) {
    if (!user) return { error: "User not logged in" };

    // Strip actual logs from the notes used for the workout summary
    // This preserves the "plan" but moves the "performance" to set_logs
    const exercisesForNotes = exercises.map(({ logs, ...rest }) => {
        // Remove 'type' if it exists (redundant with properties)
        if ("type" in rest) {
            delete (rest as any).type;
        }

        const props = rest.properties?.map((p) => p.toLowerCase()) || [];
        const isDurationOnly = props.includes("duration") &&
            !props.includes("reps");
        if (isDurationOnly) {
            return { ...rest, reps: 0 };
        }
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
            workout_time: new Date().toISOString(),
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

    exercises.forEach((ex) => {
        if (ex.logs && ex.logs.length > 0) {
            ex.logs.forEach((log, index) => {
                setLogInserts.push({
                    workout_log_id: workoutLog.workout_log_id,
                    exercise_set_id: null, // We don't have this link in ad-hoc mode
                    details: {
                        ...log,
                        exercise_name: ex.name,
                        exercise_id: ex.id,
                        set_number: index + 1,
                    },
                    exercise_id: isUUID(ex.id) ? ex.id : null, // New column
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
            // We return the workout log as success, but warn?
            // Or treating it as success is arguably fine since the summary is there.
        }
    }

    return { data: workoutLog, error: null };
}

function isUUID(str: string) {
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
}

export async function persistWorkoutToSupabase(
    user: any,
    workoutName: string,
    exercises: Exercise[],
    routineId?: string,
) {
    if (!user) return { error: "User not logged in" };

    if (workoutName.trim().toLowerCase() === "rest") {
        return { error: "Cannot create a workout named 'Rest'" };
    }

    const { data: responseData, error: invokeError } = await supabase.functions
        .invoke("create-workout", {
            body: {
                workout_name: workoutName.trim(),
                exercises: exercises,
                user_id: user.id,
                routine_id: routineId,
            },
        });

    const data = responseData?.data;
    const error = invokeError ||
        (responseData?.error ? new Error(responseData.error) : null);

    if (error || !data) {
        return { error: error || "Failed to create workout" };
    }

    return { data };
}

export async function deleteWorkoutFromSupabase(user: any, id: string) {
    if (!user) return;
    try {
        await supabase.from("workouts").delete().eq("workout_id", id);
    } catch (e) {
        console.warn("Failed to delete workout", e);
        throw e;
    }
}

export async function persistRoutineToSupabase(
    user: any,
    routineName: string,
    sequence: any[],
) {
    if (!user) return { error: "User not logged in" };

    const { data: responseData, error: invokeError } = await supabase.functions
        .invoke("create-routine", {
            body: {
                routine_name: routineName.trim(),
                exercises: sequence, // Send full sequence, server handles copying
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

export async function persistUpdateRoutineToSupabase(
    user: any,
    routineId: string,
    routineName: string,
    sequence: any[],
) {
    if (!user) return { error: "User not logged in" };

    const { data: responseData, error: invokeError } = await supabase.functions
        .invoke("update-routine", {
            body: {
                routine_id: routineId,
                routine_name: routineName.trim(),
                exercises: sequence,
                user_id: user.id,
            },
        });

    const data = responseData?.data;
    const error = invokeError ||
        (responseData?.error ? new Error(responseData.error) : null);

    if (error || !data) {
        return { error: error || "Failed to update routine" };
    }

    return { data };
}

export async function persistUpdateSavedWorkoutToSupabase(
    user: any,
    workoutId: string,
    workoutName: string,
    exercises: Exercise[],
) {
    if (!user) return { error: "User not logged in" };

    if (workoutName.trim().toLowerCase() === "rest") {
        return { error: "Cannot name workout 'Rest'" };
    }

    const { data: responseData, error: invokeError } = await supabase.functions
        .invoke("update-workout", {
            body: {
                workout_id: workoutId,
                workout_name: workoutName.trim(),
                exercises: exercises,
                user_id: user.id,
            },
        });

    const data = responseData?.data;
    const error = invokeError ||
        (responseData?.error ? new Error(responseData.error) : null);

    if (error || !data) {
        return { error: error || "Failed to update workout" };
    }

    return { data };
}

export async function fetchWorkoutLogDetails(user: any, logId: string) {
    if (!user) return { data: [], error: "User not logged in" };

    try {
        // 1. Fetch workout log to get the snapshot of exercises (with properties)
        const { data: workoutLog } = await supabase
            .from("workout_logs")
            .select("exercises")
            .eq("workout_log_id", logId)
            .single();

        // Parse exercises JSON to a map for easy lookup
        let exercisesSnapshot: any[] = [];
        try {
            if (workoutLog?.exercises) {
                let parsed: any;
                if (typeof workoutLog.exercises === "string") {
                    parsed = JSON.parse(workoutLog.exercises);
                } else {
                    parsed = workoutLog.exercises;
                }

                // Handle different structures
                if (Array.isArray(parsed)) {
                    exercisesSnapshot = parsed;
                } else if (parsed && Array.isArray(parsed.exercises)) {
                    exercisesSnapshot = parsed.exercises;
                }
            }
        } catch {}

        if (!Array.isArray(exercisesSnapshot)) {
            exercisesSnapshot = [];
        }

        if (!Array.isArray(exercisesSnapshot)) {
            exercisesSnapshot = [];
        }

        // Fallback: Reconstruct from set_logs (Legacy behavior)
        const { data: setLogs, error } = await supabase
            .from("set_logs")
            .select(`
                set_log_id,
                details,
                notes,
                exercise_id,
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
        const grouped: Record<string, any> = {};

        if (setLogs) {
            setLogs.forEach((log: any) => {
                const relationalName = log.exercise_sets?.workout_exercises
                    ?.exercises
                    ?.exercise_name;
                const detailsName = log.details?.exercise_name;
                const exName = relationalName || detailsName ||
                    "Unknown Exercise";

                // Try to find properties from snapshot
                const logExId = log.exercise_id || log.details?.exercise_id;
                let matchedEx = exercisesSnapshot.find((e: any) =>
                    e.id === logExId
                );
                if (!matchedEx) {
                    matchedEx = exercisesSnapshot.find((e: any) =>
                        e.name === exName
                    );
                }
                const position =
                    log.exercise_sets?.workout_exercises?.position || 999;
                const setNumber = log.exercise_sets?.set_number ||
                    log.details?.set_number;

                if (!grouped[exName]) {
                    grouped[exName] = {
                        name: exName,
                        position: position,
                        sets: [],
                        properties: matchedEx?.properties || [],
                    };
                }

                grouped[exName].sets.push({
                    setNumber: setNumber,
                    details: log.details,
                    notes: log.notes,
                });
            });
        }

        const result = Object.values(grouped).sort((a: any, b: any) =>
            a.position - b.position
        );

        return { data: result, error: null };
    } catch (err: any) {
        console.warn("fetchWorkoutLogDetails failed", err);
        return { data: [], error: err.message || "Failed to load details" };
    }
}

export async function deleteRoutineFromSupabase(user: any, routineId: string) {
    if (!user) return;
    try {
        await supabase.functions.invoke("delete-routine", {
            body: { routine_id: routineId, user_id: user.id },
        });
    } catch (e) {
        console.warn("Failed to delete routine on server", e);
        throw e;
    }
}

export async function deleteWorkoutLogFromSupabase(user: any, logId: string) {
    if (!user) return;
    try {
        await supabase.from("workout_logs").delete().eq(
            "workout_log_id",
            logId,
        );
    } catch (e) {
        console.warn("Failed to delete workout log on server", e);
        throw e;
    }
}
