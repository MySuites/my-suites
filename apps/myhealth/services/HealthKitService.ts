import AsyncStorage from "@react-native-async-storage/async-storage";

// Lazily require HealthKit to prevent blocking JS thread when importing this file during navigation
const getHealthKit = () =>
    require("@kingstinct/react-native-healthkit").default;

// WorkoutActivityType is a named export (not part of the .default bundle) —
// require the module root for it.
const getWorkoutActivityTypeEnum = () =>
    require("@kingstinct/react-native-healthkit").WorkoutActivityType;

const HEALTH_KIT_SYNC_ENABLED_KEY = "myhealth_hk_sync_enabled";

export interface HealthKitWorkoutRoutePoint {
    latitude: number;
    longitude: number;
    timestamp: string; // ISO
}

export interface HealthKitWorkout {
    uuid: string;
    startDate: string; // ISO
    endDate: string; // ISO
    durationSeconds: number;
    activityLabel: string;
    avgHeartRate?: number; // bpm
    maxHeartRate?: number; // bpm
    calories?: number; // kcal
    distance?: number; // meters
    elevationGain?: number; // meters
    route?: HealthKitWorkoutRoutePoint[];
}

// Best-effort statistic fetch — a missing/unsupported quantity type shouldn't fail the whole workout import.
async function getStatisticQuantity(
    sample: any,
    quantityType: string,
    field: "averageQuantity" | "maximumQuantity" | "sumQuantity",
): Promise<number | undefined> {
    try {
        const stat = await sample.getStatistic?.(quantityType);
        return stat?.[field]?.quantity;
    } catch {
        return undefined;
    }
}

// Numeric HKWorkoutActivityType -> human label, e.g. "functionalStrengthTraining" -> "Functional Strength Training".
// Falls back to "Workout" for unmapped/unknown values (e.g. `other`).
function activityTypeLabel(activityType: number): string {
    try {
        const WorkoutActivityType = getWorkoutActivityTypeEnum();
        const key: string | undefined = WorkoutActivityType?.[activityType];
        if (!key) return "Workout";
        const spaced = key.replace(/([A-Z])/g, " $1").trim();
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    } catch {
        return "Workout";
    }
}

export const HealthKitService = {
    isAvailable: async (): Promise<boolean> => {
        return true;
    },

    initHealthKit: async (): Promise<void> => {
        try {
            const HealthKit = getHealthKit();
            const isRequested = await HealthKit.requestAuthorization({
                toRead: [
                    "HKQuantityTypeIdentifierBodyMass",
                    "HKWorkoutTypeIdentifier",
                    "HKQuantityTypeIdentifierHeartRate",
                    "HKQuantityTypeIdentifierActiveEnergyBurned",
                    "HKQuantityTypeIdentifierDistanceWalkingRunning",
                    "HKQuantityTypeIdentifierDistanceCycling",
                    "HKWorkoutRouteTypeIdentifier",
                ],
                toShare: ["HKQuantityTypeIdentifierBodyMass"],
            });

            if (!isRequested) {
                throw new Error("Authorization not granted or failed");
            }
            console.log("[HealthKitService] Initialized successfully");
        } catch (error) {
            console.error(
                "[HealthKitService] Error initializing HealthKit:",
                error,
            );
            throw error;
        }
    },
    /**
     * Check if HealthKit is authorized for body mass.
     * Checks both system permission AND local "sync enabled" preference.
     */
    isAuthorized: async (): Promise<boolean> => {
        try {
            // 1. Check System Permission
            const HealthKit = getHealthKit();
            const status = await HealthKit.authorizationStatusFor(
                "HKQuantityTypeIdentifierBodyMass",
            );
            // 2 is sharingAuthorized
            const isSystemAuthorized = status === 2;

            if (!isSystemAuthorized) return false;

            // 2. Check Local Preference
            // If they are system authorized but we haven't set a preference, assume TRUE (backwards compatibility)
            // If they explicitly disconnected, it will be 'false'.
            const localPref = await AsyncStorage.getItem(
                HEALTH_KIT_SYNC_ENABLED_KEY,
            );

            if (localPref === null) {
                // First run or legacy: If system says yes, we say yes.
                // And let's persist it to be explicit moving forward.
                await AsyncStorage.setItem(HEALTH_KIT_SYNC_ENABLED_KEY, "true");
                return true;
            }

            return localPref === "true";
        } catch (error) {
            console.error(
                "[HealthKitService] Error checking authorization:",
                error,
            );
            return false;
        }
    },

    enableSync: async (): Promise<void> => {
        await AsyncStorage.setItem(HEALTH_KIT_SYNC_ENABLED_KEY, "true");
    },

    disableSync: async (): Promise<void> => {
        await AsyncStorage.setItem(HEALTH_KIT_SYNC_ENABLED_KEY, "false");
    },

    /**
     * Fetch body mass samples from HealthKit.
     * @param startDate The start date for the query (default: 1 year ago)
     * @returns Array of { date: string, value: number } in lbs
     */
    fetchBodyMass: async (
        startDate?: Date,
    ): Promise<{ date: string; value: number }[]> => {
        try {
            const start = startDate ||
                new Date(new Date().setFullYear(new Date().getFullYear() - 1));
            const HealthKit = getHealthKit();
            const samples = await HealthKit.queryQuantitySamples(
                "HKQuantityTypeIdentifierBodyMass",
                {
                    limit: 0,
                    unit: "lb",
                    filter: {
                        date: {
                            startDate: start,
                        },
                    },
                },
            );

            return samples.map((sample: any) => ({
                date: (sample.startDate as unknown as Date).toISOString(), // Cast to handle potential type discrepancies
                value: sample.quantity,
            }));
        } catch (error) {
            console.error("[HealthKitService] Error fetching body mass:", error);
            return [];
        }
    },
    
    /**
     * Fetch workout sessions from HealthKit (e.g. logged on Apple Watch).
     * @param startDate The start date for the query (default: 1 year ago)
     */
    fetchWorkouts: async (startDate?: Date): Promise<HealthKitWorkout[]> => {
        try {
            const start = startDate ||
                new Date(new Date().setFullYear(new Date().getFullYear() - 1));
            const HealthKit = getHealthKit();
            const samples = await HealthKit.queryWorkoutSamples({
                limit: 0,
                filter: {
                    date: {
                        startDate: start,
                    },
                },
            });

            return await Promise.all(samples.map(async (sample: any) => {
                const startDateObj = sample.startDate as unknown as Date;
                const endDateObj = sample.endDate as unknown as Date;
                const durationSeconds = sample.duration?.quantity ??
                    Math.round((endDateObj.getTime() - startDateObj.getTime()) / 1000);

                const [avgHeartRate, maxHeartRate, calories, distanceRunning, distanceCycling] = await Promise.all([
                    getStatisticQuantity(sample, "HKQuantityTypeIdentifierHeartRate", "averageQuantity"),
                    getStatisticQuantity(sample, "HKQuantityTypeIdentifierHeartRate", "maximumQuantity"),
                    getStatisticQuantity(sample, "HKQuantityTypeIdentifierActiveEnergyBurned", "sumQuantity"),
                    getStatisticQuantity(sample, "HKQuantityTypeIdentifierDistanceWalkingRunning", "sumQuantity"),
                    getStatisticQuantity(sample, "HKQuantityTypeIdentifierDistanceCycling", "sumQuantity"),
                ]);

                let route: HealthKitWorkoutRoutePoint[] | undefined;
                try {
                    const routes = await sample.getWorkoutRoutes?.();
                    const locations = routes?.flatMap((r: any) => r.locations) ?? [];
                    if (locations.length > 0) {
                        route = locations.map((loc: any) => ({
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                            timestamp: (loc.date as unknown as Date).toISOString(),
                        }));
                    }
                } catch {
                    route = undefined;
                }

                const elevationGain = sample.metadataElevationAscended?.quantity;

                return {
                    uuid: sample.uuid,
                    startDate: startDateObj.toISOString(),
                    endDate: endDateObj.toISOString(),
                    durationSeconds,
                    activityLabel: activityTypeLabel(sample.workoutActivityType),
                    avgHeartRate,
                    maxHeartRate,
                    calories,
                    distance: distanceRunning ?? distanceCycling,
                    elevationGain,
                    route,
                };
            }));
        } catch (error) {
            console.error("[HealthKitService] Error fetching workouts:", error);
            return [];
        }
    },

    /**
     * Save a weight sample to HealthKit.
     * @param weight The weight in lbs
     * @param date The date of the measurement
     */
    saveBodyMass: async (weight: number, date: Date): Promise<void> => {
        try {
            const HealthKit = getHealthKit();
            await HealthKit.saveQuantitySample(
                "HKQuantityTypeIdentifierBodyMass",
                "lb",
                weight,
                {
                    start: date,
                    end: date,
                },
            );
            console.log("[HealthKitService] Weight saved successfully to Health app");
        } catch (error) {
            console.error("[HealthKitService] Error saving weight to Health app:", error);
            // Don't throw, just log. This shouldn't crash the app's local save.
        }
    },
};
