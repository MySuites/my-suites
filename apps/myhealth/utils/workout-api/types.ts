export type SetLog = {
    id?: string;
    weight?: number; // lbs
    bodyweight?: number; // lbs
    reps?: number;
    reps_left?: number;
    reps_right?: number;
    duration?: number; // seconds
    distance?: number; // meters or user unit
    rpe?: number;
};

export type Exercise = {
    id: string;
    name: string;
    sets: number; // Target sets
    reps: number; // Target reps/duration/distance
    completedSets: number;
    completedIndices?: number[]; // indices of checked sets
    logs?: SetLog[];
    previousLog?: SetLog[];
    properties?: string[]; // E.g. ["Weighted", "Reps", "Bodyweight"]
    setTargets?: {
        reps?: number;
        reps_left?: number;
        reps_right?: number;
        weight?: number;
        duration?: number;
        distance?: number;
        rpe?: number;
    }[];
    description?: string;
    instructions?: string[];
    tips?: string[];
    nextVariations?: string[];
    difficulty?: number;
    restTime?: number; // seconds
    prepTime?: number; // seconds (set-prep countdown, 0 = disabled)
    equipment?: string;
    movementType?: string;
    angle?: string;
    attachment?: string;
    muscleGroups?: string[];
    secondaryMuscles?: string[];
};

export type WorkoutLog = {
    id: string; // workout_log_id
    workoutId?: string;
    userId: string;
    workoutDate: string;
    notes?: string;
    workoutName?: string; // joined from workouts table
    exercises?: Exercise[];
    imageUrl?: string;
    imageUrls?: string[];
};

export interface Syncable {
    id: string; // UUID (generated locally if new)
    syncStatus: "synced" | "pending" | "dirty"; // 'dirty' means modified since sync
    updatedAt: number;
    deletedAt?: number; // For Soft Deletes
}

// Rich History Document (Stored Locally)
export interface LocalWorkoutLog extends Syncable {
    name: string;
    duration: number;
    date: string;
    exercises: Exercise[]; // Contains 'logs' (sets/reps/weight)
    note?: string;
    // Added for Schema Parity
    userId: string;
    createdAt: string;
    workoutDate?: string;
    workoutId?: string;
    imageUrl?: string;
    imageUrls?: string[];
}

export interface BodyWeightLog extends Syncable {
    userId: string;
    weight: number;
    date: string; // YYYY-MM-DD
    createdAt: string; // ISO
}
