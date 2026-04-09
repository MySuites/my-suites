import { getDb } from "../utils/db/database";

export interface LocalProfile {
    id: string;
    email: string; // Used for display, synced from Auth
    username: string;
    full_name: string;
    active_routine?: {
        id: string;
        dayIndex: number;
        lastCompletedDate?: string;
    } | null;
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
            active_routine: row.active_routine
                ? JSON.parse(row.active_routine)
                : null,
            updated_at: row.updated_at,
            sync_status: row.sync_status,
        };
    },

    saveProfile: async (profile: LocalProfile): Promise<void> => {
        const db = await getDb();
        await db.runAsync(
            `
            INSERT OR REPLACE INTO profiles (id, email, username, full_name, active_routine, updated_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            [
                profile.id,
                profile.email,
                profile.username,
                profile.full_name,
                JSON.stringify(profile.active_routine || null),
                Date.now(),
                "pending",
            ],
        );
    },

    updateActiveRoutine: async (
        userId: string,
        activeRoutine: any,
    ): Promise<void> => {
        const db = await getDb();
        
        await db.runAsync(
            `INSERT INTO profiles (id, active_routine, updated_at, sync_status) 
             VALUES (?, ?, ?, 'pending')
             ON CONFLICT(id) DO UPDATE SET 
                active_routine = excluded.active_routine,
                updated_at = excluded.updated_at,
                sync_status = excluded.sync_status`,
            [userId, JSON.stringify(activeRoutine || null), Date.now()]
        );
    },
};
