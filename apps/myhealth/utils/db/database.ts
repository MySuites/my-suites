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

    // Create tables if they don't exist
    await database.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS workouts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT,
            exercises TEXT, -- JSON string
            created_at TEXT,
            updated_at INTEGER,
            deleted_at INTEGER,
            sync_status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS workout_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            workout_date TEXT, -- date alias
            workout_name TEXT,
            duration INTEGER,
            note TEXT,
            created_at TEXT,
            updated_at INTEGER,
            deleted_at INTEGER,
            sync_status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS set_logs (
            id TEXT PRIMARY KEY,
            workout_log_id TEXT,
            exercise_id TEXT,
            exercise_name TEXT, -- denormalized for speed
            weight REAL,
            reps INTEGER,
            distance REAL,
            duration INTEGER,
            bodyweight BOOLEAN,
            created_at TEXT,
            sync_status TEXT DEFAULT 'pending',
            FOREIGN KEY(workout_log_id) REFERENCES workout_logs(id)
        );

        CREATE TABLE IF NOT EXISTS body_measurements (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            weight REAL,
            date TEXT,
            created_at TEXT,
            updated_at INTEGER,
            sync_status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            email TEXT,
            username TEXT,
            full_name TEXT,
            active_routine TEXT, -- JSON { id, dayIndex, lastCompletedDate }
            updated_at INTEGER,
            sync_status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS routines (
            id TEXT PRIMARY KEY,
            name TEXT,
            sequence TEXT, -- JSON string
            created_at TEXT,
            updated_at INTEGER,
            deleted_at INTEGER,
            sync_status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT,
            muscle_groups TEXT, -- JSON
            properties TEXT,
            description TEXT,
            created_at TEXT,
            updated_at INTEGER,
            sync_status TEXT DEFAULT 'synced' -- Libraries are usually synced from server
        );
    `);

    // Migrations: Ensure new columns exist for existing installations
    const safeAddColumn = async (
        table: string,
        column: string,
        def: string,
    ) => {
        try {
            await database.execAsync(
                `ALTER TABLE ${table} ADD COLUMN ${column} ${def}`,
            );
        } catch {
            // Column likely already exists, ignore
        }
    };

    const safeRenameColumn = async (
        table: string,
        oldName: string,
        newName: string,
    ) => {
        try {
            // Check if old column exists and new one doesn't (SQLite doesn't support IF EXISTS in ALTER RENAME directly usually, but standard execAsync fail is fine)
            // Simpler: Just try rename. If it fails, it's likely already renamed or old doesn't exist.
            await database.execAsync(
                `ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`,
            );
        } catch {
            // Ignore
        }
    };

    await safeAddColumn("workout_logs", "deleted_at", "INTEGER");
    await safeAddColumn("exercises", "deleted_at", "INTEGER");

    // Exercise Progressions
    await safeAddColumn("exercises", "progression_id", "TEXT");
    await safeAddColumn("exercises", "difficulty", "REAL"); // Support 1.5, 2.5 etc
    await safeAddColumn("exercises", "description", "TEXT");
    await safeAddColumn("exercises", "is_active_progression", "INTEGER"); // Boolean 0/1

    // Rename old column if exists (migration)
    await safeRenameColumn("exercises", "progression_level", "difficulty");

    await safeRenameColumn("workout_logs", "workout_time", "workout_date");

    await safeRenameColumn("workout_logs", "workout_time", "workout_date");

    // Cleanup ghost data (null IDs) caused by previous bug
    try {
        await database.execAsync(`
            DELETE FROM workouts WHERE id IS NULL OR id = 'null';
            DELETE FROM workout_logs WHERE id IS NULL OR id = 'null';
            DELETE FROM set_logs WHERE id IS NULL OR id = 'null';
            DELETE FROM body_measurements WHERE id IS NULL OR id = 'null';
            DELETE FROM routines WHERE id IS NULL OR id = 'null';
        `);
        console.log("Cleanup of ghost data complete");
    } catch (e) {
        console.error("Failed to cleanup ghost data", e);
    }

    console.log("Database initialized successfully");
};
