import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Safely import Audio to avoid crashing on missing native module
let Audio: any;
try {
    Audio = require("expo-av").Audio;
} catch {
    console.warn(
        "expo-av native module not found. Sound playback will be disabled.",
    );
}

export function useActiveWorkoutTimers() {
    const [isRunning, setRunning] = useState(false);
    const [workoutSeconds, setWorkoutSeconds] = useState(0);
    const [restSeconds, setRestSeconds] = useState(0);

    // Timer refs
    const workoutTimerRef = useRef<any>(null);
    const restTimerRef = useRef<any>(null);

    // Timestamp refs for background handling
    const lastWorkoutTickRef = useRef<number | null>(null);
    const lastRestTickRef = useRef<number | null>(null);

    const playTimerCompleteSound = async () => {
        if (!Audio) return;
        try {
            const { sound } = await Audio.Sound.createAsync(
                require("../../assets/sounds/timer_success.mp3"),
            );
            await sound.playAsync();
            // Optional: unload after some time or on finish
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch {
            // Silently fail if sound file is missing or invalid placeholder
            console.log(
                "Timer sound playback failed (expected if placeholder is invalid)",
            );
        }
    };

    // Workout Timer Logic
    useEffect(() => {
        if (isRunning) {
            // Start or resume
            if (!lastWorkoutTickRef.current) {
                lastWorkoutTickRef.current = Date.now();
            }

            workoutTimerRef.current = setInterval(() => {
                const now = Date.now();
                const delta = now - (lastWorkoutTickRef.current || now);

                // Only update if at least 1 second has passed (avoid micro-updates)
                // But simplified: just add the seconds elapsed since last tick
                if (delta >= 1000) {
                    const secondsPassed = Math.floor(delta / 1000);
                    if (secondsPassed > 0) {
                        setWorkoutSeconds((prev) => prev + secondsPassed);
                        // Adjust last tick to account for the seconds we just added
                        // We keep the remainder in the "buffer" implicitly by only advancing by full seconds
                        lastWorkoutTickRef.current = now - (delta % 1000);
                    }
                }
            }, 1000);
        } else {
            // Pause
            if (workoutTimerRef.current) {
                clearInterval(workoutTimerRef.current);
                workoutTimerRef.current = null;
            }
            // We don't clear lastWorkoutTickRef here because we might want to resume?
            // Actually, if we pause, we stop accumulating.
            lastWorkoutTickRef.current = null;
        }

        return () => {
            if (workoutTimerRef.current) {
                clearInterval(workoutTimerRef.current);
            }
        };
    }, [isRunning]);

    // Rest Timer Logic
    const isResting = restSeconds > 0;
    useEffect(() => {
        if (isResting) {
            if (!lastRestTickRef.current) {
                lastRestTickRef.current = Date.now();
            }

            if (!restTimerRef.current) {
                restTimerRef.current = setInterval(() => {
                    const now = Date.now();
                    const delta = now - (lastRestTickRef.current || now);

                    if (delta >= 1000) {
                        const secondsPassed = Math.floor(delta / 1000);
                        if (secondsPassed > 0) {
                            setRestSeconds((prev) => {
                                const newValue = Math.max(
                                    0,
                                    prev - secondsPassed,
                                );
                                if (newValue === 0) {
                                    // Timer finished
                                    if (restTimerRef.current) {
                                        clearInterval(restTimerRef.current);
                                        restTimerRef.current = null;
                                    }
                                    lastRestTickRef.current = null;

                                    // Play sound
                                    playTimerCompleteSound();
                                }
                                return newValue;
                            });
                            // Adjust last tick
                            lastRestTickRef.current = now - (delta % 1000);
                        }
                    }
                }, 1000);
            }
        } else {
            // Cleanup if it hit 0 or was reset
            if (restTimerRef.current) {
                clearInterval(restTimerRef.current);
                restTimerRef.current = null;
            }
            lastRestTickRef.current = null;
        }

        return () => {
            if (restTimerRef.current) {
                clearInterval(restTimerRef.current);
            }
        };
    }, [isResting]);

    const startRestTimer = useCallback((seconds: number) => {
        setRestSeconds(seconds);
        lastRestTickRef.current = Date.now();
    }, []);

    const resetTimers = useCallback(() => {
        setWorkoutSeconds(0);
        setRestSeconds(0);
        if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
        }
        if (workoutTimerRef.current) {
            clearInterval(workoutTimerRef.current);
            workoutTimerRef.current = null;
        }
        lastWorkoutTickRef.current = null;
        lastRestTickRef.current = null;
    }, []);

    return useMemo(() => ({
        isRunning,
        setRunning,
        workoutSeconds,
        setWorkoutSeconds,
        restSeconds,
        startRestTimer,
        resetTimers,
    }), [isRunning, workoutSeconds, restSeconds, startRestTimer, resetTimers]);
}
