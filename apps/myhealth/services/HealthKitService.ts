import HealthKit from "@kingstinct/react-native-healthkit";

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
     */
    isAuthorized: async (): Promise<boolean> => {
        try {
            const status = await HealthKit.authorizationStatusFor(
                "HKQuantityTypeIdentifierBodyMass",
            );
            // 2 is sharingAuthorized
            return status === 2;
        } catch (error) {
            console.error(
                "[HealthKitService] Error checking authorization:",
                error,
            );
            return false;
        }
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
