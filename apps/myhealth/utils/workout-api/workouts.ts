import { supabase } from "@mysuite/auth";
import { DataRepository } from "../../providers/DataRepository";
import { Exercise } from "./types";

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
    // Local-First: Soft delete via repository
    await DataRepository.deleteWorkout(id);
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
