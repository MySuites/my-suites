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
            workout_time TEXT, -- date alias
            workout_name TEXT,
            duration INTEGER,
            note TEXT,
            created_at TEXT,
            updated_at INTEGER,
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
    `);

    console.log("Database initialized successfully");
};
