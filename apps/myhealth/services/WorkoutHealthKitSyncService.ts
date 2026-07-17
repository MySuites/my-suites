import { HealthKitService } from "./HealthKitService";
import { DataRepository } from "../providers/DataRepository";

// Imports Apple Watch workouts (logged to HealthKit) into the app's workout
// history as read-only entries. Mirrors BodyWeightService.syncWithHealthKit's
// in-flight-promise guard, but — unlike that sync — dedupes against the
// HealthKit sample uuid so re-running it doesn't create duplicate workouts.
export const WorkoutHealthKitSyncService = {
    _syncPromise: null as Promise<void> | null,

    syncWorkoutsFromHealthKit(userId: string | null): Promise<void> {
        if (this._syncPromise) {
            console.log("Workout HealthKit sync already in progress, returning existing promise.");
            return this._syncPromise;
        }

        this._syncPromise = (async () => {
            try {
                const isAuth = await HealthKitService.isAuthorized();
                if (!isAuth) {
                    console.log("Workout HealthKit sync skipped: Not authorized or sync disabled.");
                    return;
                }

                const workouts = await HealthKitService.fetchWorkouts();
                if (workouts.length === 0) {
                    console.log("No HealthKit workout samples found.");
                    return;
                }

                console.log(`Found ${workouts.length} HealthKit workout samples. Checking for new ones...`);

                let imported = 0;
                for (const workout of workouts) {
                    const alreadyImported = await DataRepository.hasWorkoutLogWithHealthKitUuid(workout.uuid);
                    if (alreadyImported) continue;

                    await DataRepository.saveLog({
                        userId: userId || "guest",
                        name: `${workout.activityLabel} (Apple Watch)`,
                        duration: workout.durationSeconds,
                        date: workout.startDate,
                        createdAt: new Date().toISOString(),
                        exercises: [],
                        healthkitUuid: workout.uuid,
                        metricsSource: "healthkit",
                        avgHeartRate: workout.avgHeartRate,
                        maxHeartRate: workout.maxHeartRate,
                        calories: workout.calories,
                        distance: workout.distance,
                        elevationGain: workout.elevationGain,
                        route: workout.route,
                    });
                    imported++;
                }

                console.log(`Workout HealthKit sync complete. Imported ${imported} new workout(s).`);
            } finally {
                this._syncPromise = null;
            }
        })();

        return this._syncPromise;
    },
};
