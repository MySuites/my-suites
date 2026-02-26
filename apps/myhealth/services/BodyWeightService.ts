import AsyncStorage from "@react-native-async-storage/async-storage";
import { DataRepository } from "../providers/DataRepository";
import { HealthKitService } from "./HealthKitService";
import uuid from "react-native-uuid";

const LEGACY_LOCAL_STORAGE_KEY = "myhealth_guest_body_weight";

export interface BodyWeightEntry {
    id?: string;
    weight: number;
    date: string; // YYYY-MM-DD
    created_at?: string;
}

export const BodyWeightService = {
    /**
     * One-time migration of legacy guest data to DataRepository
     */
    async migrateGuestDataIfNeeded(userId: string | null): Promise<void> {
        try {
            const jsonValue = await AsyncStorage.getItem(
                LEGACY_LOCAL_STORAGE_KEY,
            );

            // If there's no legacy data in AsyncStorage, skip entirely.
            if (!jsonValue) return;

            const history: BodyWeightEntry[] = JSON.parse(jsonValue);
            if (history.length > 0) {
                // Verify we haven't already migrated something
                const existing = await DataRepository.getBodyWeightHistory(
                    userId,
                );
                if (existing.length > 0) {
                    // We probably already migrated, just clean up
                    await AsyncStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
                    return;
                }

                console.log(
                    `Migrating ${history.length} legacy body weight entries...`,
                );

                // Do a bulk insert instead of individual saves for migration
                const measurements = history.map((item) => ({
                    id: uuid.v4(),
                    userId: userId || "guest",
                    weight: item.weight,
                    date: item.date,
                    syncStatus: "pending",
                }));

                await DataRepository.saveBodyMeasurements(measurements);
            }
            // Cleanup so we skip checking next time
            await AsyncStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
        } catch (e) {
            console.error("Error migrating guest body weight data:", e);
        }
    },

    /**
     * Fetch the most recent weight entry.
     */
    async getLatestWeight(userId: string | null): Promise<number | null> {
        await this.migrateGuestDataIfNeeded(userId);
        return DataRepository.getLatestBodyWeight(userId || "guest");
    },

    /**
     * Fetch weight history within a date range (start date inclusive).
     */
    async getWeightHistory(
        userId: string | null,
        startDate?: string,
    ): Promise<BodyWeightEntry[]> {
        await this.migrateGuestDataIfNeeded(userId);
        const history = await DataRepository.getBodyWeightHistory(
            userId || "guest",
            startDate,
        );

        // Map internal DataRepository format to public BodyWeightEntry
        return history.map((h: any) => ({
            id: h.id,
            weight: h.weight,
            date: h.date,
            created_at: h.createdAt,
        }));
    },

    /**
     * Save or update a weight entry for a specific date.
     */
    async saveWeight(
        userId: string | null,
        weight: number,
        date: Date,
    ): Promise<void> {
        const dateStr = date.toISOString().split("T")[0];

        await DataRepository.saveBodyWeight({
            userId: userId || "guest",
            weight: weight,
            date: dateStr,
        });
    },

    /**
     * Syncs body weight data from HealthKit to the app using a bulk insert transaction.
     */
    async syncWithHealthKit(userId: string | null): Promise<void> {
        const isAuth = await HealthKitService.isAuthorized();
        if (!isAuth) {
            console.log(
                "HealthKit sync skipped: Not authorized or sync disabled.",
            );
            return;
        }

        console.log("Syncing with HealthKit...");
        const samples = await HealthKitService.fetchBodyMass();
        if (samples.length === 0) {
            console.log("No HealthKit samples found.");
            return;
        }

        console.log(
            `Found ${samples.length} HealthKit samples. Saving in bulk...`,
        );

        // Prepare measurements for bulk insert
        const measurements = samples.map((sample) => {
            const date = new Date(sample.date);
            const dateStr = date.toISOString().split("T")[0];

            return {
                id: uuid.v4(),
                userId: userId || "guest",
                weight: sample.value,
                date: dateStr,
                syncStatus: "pending",
            };
        });

        // Do a single transaction bulk save instead of 1000s of loop awaits
        await DataRepository.saveBodyMeasurements(measurements);

        console.log("HealthKit sync complete.");
    },
};
