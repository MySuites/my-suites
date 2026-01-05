import { getDb } from "../utils/db/database";

export interface LocalProfile {
    id: string;
    email: string; // Used for display, synced from Auth
    username: string;
    full_name: string;
    // ... any other profile fields
    updated_at: number;
    sync_status: "pending" | "synced";
}

export const ProfileRepository = {
    getProfile: async (userId: string): Promise<LocalProfile | null> => {
        const db = await getDb();
        const row = await db.getFirstAsync<any>(
            "SELECT * FROM profiles WHERE id = ?",
            [userId],
        );
        if (!row) return null;

        return {
            id: row.id,
            email: row.email,
            username: row.username,
            full_name: row.full_name,
            updated_at: row.updated_at,
            sync_status: row.sync_status,
        };
    },

    saveProfile: async (profile: LocalProfile): Promise<void> => {
        const db = await getDb();
        await db.runAsync(
            `
            INSERT OR REPLACE INTO profiles (id, email, username, full_name, updated_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
            [
                profile.id,
                profile.email,
                profile.username,
                profile.full_name,
                Date.now(),
                "pending",
            ],
        );
    },
};
