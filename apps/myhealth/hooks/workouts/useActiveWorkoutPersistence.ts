import { useEffect, useRef, useState } from "react";
import { Exercise } from "../../providers/WorkoutManagerProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UseActiveWorkoutPersistenceProps {
    exercises: Exercise[];
    workoutSeconds: number;
    workoutName: string;
    isRunning: boolean;
    routineId: string | null;
    sourceWorkoutId: string | null;
    currentIndex: number;
    setExercises: (exercises: Exercise[]) => void;
    setWorkoutSeconds: (seconds: number) => void;
    setWorkoutName: (name: string) => void;
    setRoutineId: (id: string | null) => void;
    setSourceWorkoutId: (id: string | null) => void;
    setCurrentIndex: (index: number) => void;
    setRunning: (running: boolean) => void;
    setHasActiveSession: (hasSession: boolean) => void;
    hasActiveSession: boolean;
}

export function useActiveWorkoutPersistence({
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
}: UseActiveWorkoutPersistenceProps) {
    const isMounted = useRef(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const loadState = async () => {
            try {
                const keys = [
                    "myhealth_workout_exercises",
                    "myhealth_workout_seconds",
                    "myhealth_workout_name",
                    "myhealth_workout_routine_id",
                    "myhealth_workout_source_id",
                    "myhealth_workout_running",
                    "myhealth_workout_last_tick",
                    "myhealth_workout_current_index",
                ];

                const stores = await AsyncStorage.multiGet(keys);
                const data: Record<string, string | null> = {};
                stores.forEach(([key, value]) => {
                    data[key] = value;
                });

                if (data["myhealth_workout_seconds"]) {
                    let seconds = parseInt(
                        data["myhealth_workout_seconds"],
                        10,
                    );

                    // If it was running, catch up time
                    if (
                        data["myhealth_workout_running"] &&
                        JSON.parse(data["myhealth_workout_running"])
                    ) {
                        const lastTick = data["myhealth_workout_last_tick"]
                            ? parseInt(data["myhealth_workout_last_tick"], 10)
                            : null;
                        if (lastTick) {
                            const now = Date.now();
                            const diff = Math.floor((now - lastTick) / 1000);
                            if (diff > 0) {
                                seconds += diff;
                            }
                        }
                        setRunning(true);
                        setHasActiveSession(true);
                    } else if (data["myhealth_workout_running"]) {
                        // Was paused
                        setRunning(false);
                        // If we have saved state, strictly speaking we have an active session,
                        // but maybe we differ if it was empty?
                        // For now let's assume if data exists calling hook means we might want it.
                        // But verifying "hasActiveSession" usually means "is expanded/visible".
                        if (data["myhealth_workout_exercises"]) {
                            try {
                                const parsed = JSON.parse(data["myhealth_workout_exercises"]);
                                if (parsed && parsed.length > 0) {
                                    setHasActiveSession(true);
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }
                    }

                    setWorkoutSeconds(seconds);
                }

                if (data["myhealth_workout_exercises"]) {
                    setExercises(
                        JSON.parse(data["myhealth_workout_exercises"]),
                    );
                }

                if (data["myhealth_workout_name"]) {
                    setWorkoutName(data["myhealth_workout_name"]);
                }

                if (data["myhealth_workout_routine_id"]) {
                    setRoutineId(data["myhealth_workout_routine_id"]);
                }

                if (data["myhealth_workout_source_id"]) {
                    setSourceWorkoutId(data["myhealth_workout_source_id"]);
                }

                if (data["myhealth_workout_current_index"]) {
                    setCurrentIndex(parseInt(data["myhealth_workout_current_index"], 10));
                }

                setIsLoaded(true);
            } catch (e) {
                console.error("Failed to load workout state", e);
            }
        };

        if (!isLoaded) {
            loadState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // Persist to local storage
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        // Only save if we have loaded first, to avoid overwriting with empty state
        if (!isLoaded) {
            return;
        }

        // Only save if we strictly have an active session
        if (!hasActiveSession) {
            return;
        }

        const saveState = async () => {
            try {
                const pairs: [string, string][] = [
                    ["myhealth_workout_exercises", JSON.stringify(exercises)],
                    ["myhealth_workout_seconds", workoutSeconds.toString()],
                    ["myhealth_workout_name", workoutName],
                    ["myhealth_workout_running", JSON.stringify(isRunning)],
                    ["myhealth_workout_last_tick", Date.now().toString()],
                    ["myhealth_workout_current_index", currentIndex.toString()],
                ];

                if (routineId) {
                    pairs.push(["myhealth_workout_routine_id", routineId]);
                } else {
                    await AsyncStorage.removeItem(
                        "myhealth_workout_routine_id",
                    );
                }

                if (sourceWorkoutId) {
                    pairs.push(["myhealth_workout_source_id", sourceWorkoutId]);
                } else {
                    await AsyncStorage.removeItem("myhealth_workout_source_id");
                }

                await AsyncStorage.multiSet(pairs);
            } catch (e) {
                console.error("Failed to save workout state", e);
            }
        };

        saveState();
    }, [
        exercises,
        workoutSeconds,
        workoutName,
        isRunning,
        routineId,
        sourceWorkoutId,
        currentIndex,
        hasActiveSession,
        isLoaded,
    ]);

    const clearPersistence = async () => {
        try {
            const keys = [
                "myhealth_workout_exercises",
                "myhealth_workout_seconds",
                "myhealth_workout_name",
                "myhealth_workout_routine_id",
                "myhealth_workout_source_id",
                "myhealth_workout_running",
                "myhealth_workout_last_tick",
                "myhealth_workout_current_index",
            ];
            await AsyncStorage.multiRemove(keys);
        } catch (e) {
            console.error("Failed to clear workout state", e);
        }
    };

    return { clearPersistence, isLoaded };
}
