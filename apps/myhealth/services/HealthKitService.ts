import HealthKit from "@kingstinct/react-native-healthkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HEALTH_KIT_SYNC_ENABLED_KEY = "myhealth_hk_sync_enabled";

export const HealthKitService = {
    isAvailable: async (): Promise<boolean> => {
        return true;
    },

    initHealthKit: async (): Promise<void> => {
        try {
            const isRequested = await HealthKit.requestAuthorization({
                toRead: ["HKQuantityTypeIdentifierBodyMass"],
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

            return samples.map((sample) => ({
                date: (sample.startDate as unknown as Date).toISOString(), // Cast to handle potential type discrepancies
                value: sample.quantity,
            }));
        } catch (error) {
            console.error(
                "[HealthKitService] Error fetching body mass:",
                error,
            );
            return [];
        }
    },
};
