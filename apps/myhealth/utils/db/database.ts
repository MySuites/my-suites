import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync("myhealth.db");
    }
    return db;
};

export const initDatabase = async () => {
    const database = await getDb();

    console.log("[DB] Starting create tables...");
    try {
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS workouts (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT,
                exercises TEXT,
                created_at TEXT,
                updated_at INTEGER,
                deleted_at INTEGER,
                sync_status TEXT DEFAULT 'pending'
            );
        `);
        console.log("[DB] Created workouts");
        
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS workout_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                workout_date TEXT, 
                workout_name TEXT,
                duration INTEGER,
                note TEXT,
                created_at TEXT,
                updated_at INTEGER,
                deleted_at INTEGER,
                sync_status TEXT DEFAULT 'pending'
            );
        `);
        console.log("[DB] Created workout_logs");

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS set_logs (
                id TEXT PRIMARY KEY,
                workout_log_id TEXT,
                exercise_id TEXT,
                exercise_name TEXT,
                weight REAL,
                reps INTEGER,
                reps_left INTEGER,
                reps_right INTEGER,
                distance REAL,
                duration INTEGER,
                bodyweight BOOLEAN,
                rpe REAL,
                created_at TEXT,
                sync_status TEXT DEFAULT 'pending',
                FOREIGN KEY(workout_log_id) REFERENCES workout_logs(id)
            );
        `);
        console.log("[DB] Created set_logs");

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS body_measurements (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                weight REAL,
                date TEXT,
                created_at TEXT,
                updated_at INTEGER,
                sync_status TEXT DEFAULT 'pending'
            );
        `);
        console.log("[DB] Created body_measurements");

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                email TEXT,
                username TEXT,
                full_name TEXT,
                active_routine TEXT,
                updated_at INTEGER,
                sync_status TEXT DEFAULT 'pending'
            );
        `);
        console.log("[DB] Created profiles");

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS routines (
                id TEXT PRIMARY KEY,
                name TEXT,
                sequence TEXT,
                created_at TEXT,
                updated_at INTEGER,
                deleted_at INTEGER,
                sync_status TEXT DEFAULT 'pending'
            );
        `);
        console.log("[DB] Created routines");

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS exercises (
                id TEXT PRIMARY KEY,
                name TEXT,
                muscle_groups TEXT,
                properties TEXT,
                description TEXT,
                progression_id TEXT,
                difficulty REAL,
                is_active_progression INTEGER,
                next_variations TEXT,
                tips TEXT,
                created_at TEXT,
                updated_at INTEGER,
                deleted_at INTEGER,
                sync_status TEXT DEFAULT 'synced'
            );
        `);
        console.log("[DB] Created exercises");
    } catch (createErr) {
        console.error("[DB] FATAL ERROR CREATING TABLES:", createErr);
    }

    // Migrations: Ensure new columns exist for existing installations
    const safeAddColumn = async (
        table: string,
        column: string,
        def: string,
    ) => {
        try {
            // Check if column exists first to avoid unnecessary error logging
            const info = await database.getAllAsync<any>(`PRAGMA table_info(${table})`);
            const exists = info.some(c => c.name === column);
            
            if (!exists) {
                console.log(`[DB] Adding column ${column} to table ${table}...`);
                await database.execAsync(
                    `ALTER TABLE ${table} ADD COLUMN ${column} ${def};`
                );
                console.log(`[DB] Successfully added column ${column} to ${table}`);
            }
        } catch (err) {
            console.error(`[DB] Failed to add column ${column} to ${table}:`, err);
        }
    };

    const safeRenameColumn = async (
        table: string,
        oldName: string,
        newName: string,
    ) => {
        try {
            // Check if old column exists and new one doesn't
            // Simpler: Just try rename. If it fails, it's likely already renamed or old doesn't exist.
            await database.runAsync(
                `ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`,
            );
        } catch {
            // Ignore
        }
    };

    await safeAddColumn("workout_logs", "deleted_at", "INTEGER");
    await safeAddColumn("exercises", "deleted_at", "INTEGER");
    await safeAddColumn("workouts", "sort_order", "INTEGER");

    // Exercise Progressions
    await safeAddColumn("exercises", "progression_id", "TEXT");
    await safeAddColumn("exercises", "difficulty", "REAL"); // Support 1.5, 2.5 etc
    await safeAddColumn("exercises", "description", "TEXT");
    await safeAddColumn("exercises", "is_active_progression", "INTEGER"); // Boolean 0/1

    // Rename old column if exists (migration)
    await safeRenameColumn("exercises", "progression_level", "difficulty");

    // Exercise Directed Graph Links
    await safeAddColumn("exercises", "next_variations", "TEXT"); // JSON string array of IDs
    await safeAddColumn("exercises", "tips", "TEXT"); // JSON string array of tips

    await safeAddColumn("set_logs", "rpe", "REAL");
    await safeAddColumn("set_logs", "reps_left", "INTEGER");
    await safeAddColumn("set_logs", "reps_right", "INTEGER");

    await safeRenameColumn("workout_logs", "workout_time", "workout_date");

    try {
        console.log("[DB] Starting ghost data cleanup...");
        await database.execAsync(`DELETE FROM workouts WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM workout_logs WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM set_logs WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM body_measurements WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM routines WHERE id IS NULL OR id = 'null';`);
        console.log("[DB] Cleanup of ghost data complete");
    } catch (e) {
        console.error("[DB] Failed to cleanup ghost data", e);
    }

    console.log("Database initialized successfully");
};
