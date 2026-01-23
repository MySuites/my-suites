import AppleHealthKit, { HealthKitPermissions } from "react-native-health";

const permissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.BodyMass,
            AppleHealthKit.Constants.Permissions.BodyFatPercentage,
            AppleHealthKit.Constants.Permissions.BodyMassIndex,
            AppleHealthKit.Constants.Permissions.LeanBodyMass,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        ],
        write: [
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.BodyMass,
            AppleHealthKit.Constants.Permissions.BodyFatPercentage,
            AppleHealthKit.Constants.Permissions.BodyMassIndex,
            AppleHealthKit.Constants.Permissions.LeanBodyMass,
        ],
    },
};

export const HealthKitService = {
    isAvailable: (): Promise<boolean> => {
        return new Promise((resolve) => {
            AppleHealthKit.isAvailable((err: Object, available: boolean) => {
                if (err) {
                    console.error(
                        "[HealthKitService] Error checking availability:",
                        err,
                    );
                    resolve(false);
                    return;
                }
                resolve(available);
            });
        });
    },

    initHealthKit: (): Promise<void> => {
        return new Promise((resolve, reject) => {
            AppleHealthKit.initHealthKit(permissions, (err: string) => {
                if (err) {
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
