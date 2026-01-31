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
                    console.error(
                        "[HealthKitService] Error initializing HealthKit:",
                        err,
                    );
                    reject(new Error(err));
                    return;
                }
                console.log("[HealthKitService] Initialized successfully");
                resolve();
            });
        });
    },
};
