import AsyncStorage from "@react-native-async-storage/async-storage";
import { DataRepository } from "../providers/DataRepository";

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
        // If we already have data in the new table, we assume migration is done or not needed
        // (This might be a bit naive if they add data and then we migrate? But good enough for now)
        const existing = await DataRepository.getBodyWeightHistory(userId);
        if (existing.length > 0) return;

        try {
            const jsonValue = await AsyncStorage.getItem(
                LEGACY_LOCAL_STORAGE_KEY,
            );
            if (jsonValue) {
                const history: BodyWeightEntry[] = JSON.parse(jsonValue);
                if (history.length > 0) {
                    console.log(
                        `Migrating ${history.length} legacy body weight entries...`,
                    );
                    for (const item of history) {
                        await DataRepository.saveBodyWeight({
                            userId: userId || "guest",
                            weight: item.weight,
                            date: item.date,
                        });
                    }
                }
            }
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
};
