import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync("myhealth.db");
    }
    return db;
};

function localInferEquipment(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('dumbbell')) return 'dumbbell';
    if (n.includes('barbell')) return 'barbell';
    if (n.includes('cable')) return 'cable';
    if (n.includes('smith') || n.includes('machine') || n.includes('leg press') || n.includes('leg extension') || n.includes('leg curl') || n.includes('lat pulldown') || n.includes('seated row') || n.includes('chest press') || n.includes('pec deck')) return 'machine';
    if (n.includes('parallette') || n.includes('parallette')) return 'parallettes';
    if (n.includes('push-up') || n.includes('pushup') || n.includes('pull-up') || n.includes('pullup') || n.includes('dip') || n.includes('bodyweight') || n.includes('handstand') || n.includes('planche') || n.includes('lever') || n.includes('plank') || n.includes('crunch') || n.includes('situp') || n.includes('squat')) return 'none';
    return 'other';
}

function localInferAttachment(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('neutral-grip') || n.includes('neutral grip')) return 'Neutral-Grip Handles';
    if (n.includes('close-grip') || n.includes('close grip')) return 'Close-Grip V-Bar';
    if (n.includes('wide-grip') || n.includes('wide grip')) return 'Wide-Grip Bar';
    if (n.includes('straight bar')) return 'Straight Bar';
    if (n.includes('lat bar') || n.includes('lat_pulldown') || n.includes('pulldown')) return 'Lat Bar';
    if (n === 'seated cable row' || n.includes('seated row')) return 'Close-Grip V-Bar';
    return '';
}

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
                sync_status TEXT DEFAULT 'pending',
                image_url TEXT
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
                equipment TEXT,
                attachment TEXT,
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
                instructions TEXT,
                equipment TEXT,
                movement_type TEXT,
                attachment TEXT,
                created_at TEXT,
                updated_at INTEGER,
                deleted_at INTEGER,
                sync_status TEXT DEFAULT 'synced'
            );
        `);
        console.log("[DB] Created exercises");

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS progress_pictures (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                image_uri TEXT,
                date TEXT,
                notes TEXT,
                created_at TEXT,
                updated_at INTEGER,
                sync_status TEXT DEFAULT 'pending'
            );
        `);
        console.log("[DB] Created progress_pictures");
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
            const info = await database.getAllAsync<any>(`PRAGMA table_info(${table})`);
            const oldExists = info.some((c) => c.name === oldName);
            const newExists = info.some((c) => c.name === newName);

            if (!oldExists) {
                // Already renamed (or never existed) — nothing to do
                return;
            }
            if (newExists) {
                // Target column already present — skip to avoid conflict
                console.warn(`[DB] safeRenameColumn: "${newName}" already exists in "${table}", skipping rename of "${oldName}"`);
                return;
            }

            console.log(`[DB] Renaming column "${oldName}" -> "${newName}" in "${table}"...`);
            await database.runAsync(
                `ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`,
            );
            console.log(`[DB] Successfully renamed "${oldName}" -> "${newName}" in "${table}"`);
        } catch (err) {
            console.error(`[DB] Failed to rename column "${oldName}" -> "${newName}" in "${table}":`, err);
        }
    };

    await safeAddColumn("workout_logs", "deleted_at", "INTEGER");
    await safeAddColumn("workout_logs", "image_url", "TEXT");
    await safeAddColumn("workout_logs", "healthkit_uuid", "TEXT"); // Dedupe key for HealthKit-imported (Apple Watch) workouts
    await safeAddColumn("workout_logs", "avg_heart_rate", "REAL"); // bpm
    await safeAddColumn("workout_logs", "max_heart_rate", "REAL"); // bpm
    await safeAddColumn("workout_logs", "calories", "REAL"); // kcal, active energy burned
    await safeAddColumn("workout_logs", "distance", "REAL"); // meters
    await safeAddColumn("workout_logs", "elevation_gain", "REAL"); // meters
    await safeAddColumn("workout_logs", "route", "TEXT"); // JSON array of {latitude, longitude, timestamp}
    await safeAddColumn("workout_logs", "metrics_source", "TEXT"); // 'healthkit' | 'gps'
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
    await safeAddColumn("exercises", "instructions", "TEXT"); // JSON string array of steps
    await safeAddColumn("exercises", "equipment", "TEXT");
    await safeAddColumn("exercises", "movement_type", "TEXT");
    await safeAddColumn("exercises", "attachment", "TEXT");
 
    await safeAddColumn("set_logs", "rpe", "REAL");
    await safeAddColumn("set_logs", "reps_left", "INTEGER");
    await safeAddColumn("set_logs", "reps_right", "INTEGER");
    await safeAddColumn("set_logs", "equipment", "TEXT");
    await safeAddColumn("set_logs", "attachment", "TEXT");

    await safeRenameColumn("workout_logs", "workout_time", "workout_date");

    try {
        console.log("[DB] Starting ghost data cleanup...");
        await database.execAsync(`DELETE FROM workouts WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM workout_logs WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM set_logs WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM body_measurements WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM routines WHERE id IS NULL OR id = 'null';`);
        await database.execAsync(`DELETE FROM progress_pictures WHERE id IS NULL OR id = 'null';`);
        console.log("[DB] Cleanup of ghost data complete");
    } catch (e) {
        console.error("[DB] Failed to cleanup ghost data", e);
    }

    // Backfill NULL/empty equipment/attachment for existing set_logs
    try {
        console.log("[DB] Running set_logs backfill migration...");
        const setLogs = await database.getAllAsync<any>('SELECT id, exercise_id, exercise_name, equipment, attachment FROM set_logs WHERE equipment IS NULL OR attachment IS NULL OR equipment = "" OR attachment = ""');
        if (setLogs.length > 0) {
            console.log(`[DB] Found ${setLogs.length} set_logs to backfill`);
            const exercises = await database.getAllAsync<any>('SELECT id, name, equipment, attachment FROM exercises');
            const exerciseMap = new Map<string, any>();
            exercises.forEach(ex => {
                exerciseMap.set(ex.id, ex);
                if (ex.name) {
                    exerciseMap.set(ex.name.toLowerCase(), ex);
                }
            });
            
            await database.withTransactionAsync(async () => {
                for (const log of setLogs) {
                    let eq = log.equipment;
                    let att = log.attachment;
                    
                    const ex = log.exercise_id ? exerciseMap.get(log.exercise_id) : (log.exercise_name ? exerciseMap.get(log.exercise_name.toLowerCase()) : null);
                    
                    if ((!eq || eq === "") && ex) {
                        let exEq = ex.equipment;
                        if (exEq && typeof exEq === 'string' && exEq.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(exEq);
                                exEq = Array.isArray(parsed) ? parsed[0] : parsed;
                            } catch {}
                        }
                        eq = exEq;
                    }
                    if (!eq || eq === "") {
                        eq = localInferEquipment(log.exercise_name || '');
                    }
                    
                    if ((!att || att === "") && ex) {
                        let exAtt = ex.attachment;
                        if (exAtt && typeof exAtt === 'string' && exAtt.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(exAtt);
                                exAtt = Array.isArray(parsed) ? parsed[0] : parsed;
                            } catch {}
                        }
                        att = exAtt;
                    }
                    if (!att || att === "") {
                        att = localInferAttachment(log.exercise_name || '');
                    }
                    
                    await database.runAsync(
                        'UPDATE set_logs SET equipment = ?, attachment = ? WHERE id = ?',
                        [eq || 'none', att || 'None', log.id]
                    );
                }
            });
            console.log("[DB] set_logs backfill migration complete.");
        }
    } catch (e) {
        console.error("[DB] Failed running set_logs backfill migration:", e);
    }

    // Migrate template default RPE of 4 -> 6 (4 was removed from the RPE
    // picker). Only touches setTargets — the planned/default RPE for a set
    // when starting a fresh workout from a template — never logs or
    // previousLog, which hold actually-recorded history and must keep any
    // RPE=4 values exactly as logged. Self-gating: the LIKE filter means
    // re-running on later app starts is a cheap no-op once nothing matches.
    try {
        console.log("[DB] Running RPE 4->6 template migration...");

        const migrateSetTargets = (exercisesJson: any[]): boolean => {
            let changed = false;
            exercisesJson.forEach((ex: any) => {
                if (Array.isArray(ex?.setTargets)) {
                    ex.setTargets.forEach((target: any) => {
                        if (target && (target.rpe === 4 || target.rpe === '4')) {
                            target.rpe = 6;
                            changed = true;
                        }
                    });
                }
            });
            return changed;
        };

        const workoutRows = await database.getAllAsync<any>(
            `SELECT id, exercises FROM workouts WHERE exercises LIKE '%"rpe":4%' OR exercises LIKE '%"rpe":"4"%'`
        );
        for (const row of workoutRows) {
            try {
                const exercises = JSON.parse(row.exercises);
                if (Array.isArray(exercises) && migrateSetTargets(exercises)) {
                    await database.runAsync('UPDATE workouts SET exercises = ? WHERE id = ?', [JSON.stringify(exercises), row.id]);
                }
            } catch (e) {
                console.error(`[DB] Failed migrating RPE for workout ${row.id}:`, e);
            }
        }

        const routineRows = await database.getAllAsync<any>(
            `SELECT id, sequence FROM routines WHERE sequence LIKE '%"rpe":4%' OR sequence LIKE '%"rpe":"4"%'`
        );
        for (const row of routineRows) {
            try {
                const sequence = JSON.parse(row.sequence);
                if (!Array.isArray(sequence)) continue;
                let routineChanged = false;
                sequence.forEach((item: any) => {
                    if (Array.isArray(item?.workout?.exercises) && migrateSetTargets(item.workout.exercises)) {
                        routineChanged = true;
                    }
                });
                if (routineChanged) {
                    await database.runAsync('UPDATE routines SET sequence = ? WHERE id = ?', [JSON.stringify(sequence), row.id]);
                }
            } catch (e) {
                console.error(`[DB] Failed migrating RPE for routine ${row.id}:`, e);
            }
        }

        console.log(`[DB] RPE 4->6 template migration complete. ${workoutRows.length} workout(s), ${routineRows.length} routine(s) checked.`);
    } catch (e) {
        console.error("[DB] Failed running RPE 4->6 template migration:", e);
    }

    // Migration for consolidated exercises
    try {
        console.log("[DB] Running consolidation migrations...");
        await database.withTransactionAsync(async () => {
            // 1. Update set_logs
            // Flat Bench Press
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'bench_press', exercise_name = 'Bench Press', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'flat_barbell_bench_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'bench_press', exercise_name = 'Bench Press', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'flat_smith_machine_bench_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'bench_press', exercise_name = 'Bench Press', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'flat_dumbbell_bench_press'
            `);

            // Incline Bench Press
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'incline_bench_press', exercise_name = 'Incline Bench Press', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'incline_barbell_bench_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'incline_bench_press', exercise_name = 'Incline Bench Press', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'incline_smith_machine_bench_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'incline_bench_press', exercise_name = 'Incline Bench Press', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'incline_dumbbell_bench_press'
            `);

            // Decline Bench Press
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'decline_bench_press', exercise_name = 'Decline Bench Press', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'decline_barbell_bench_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'decline_bench_press', exercise_name = 'Decline Bench Press', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'decline_smith_machine_bench_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'decline_bench_press', exercise_name = 'Decline Bench Press', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'decline_dumbbell_bench_press'
            `);

            // Lat Pulldowns
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'lat_pulldown', exercise_name = 'Lat Pulldown', equipment = 'cable', attachment = 'Wide-Grip Bar' 
                WHERE exercise_id = 'wide_grip_lat_pulldown'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'lat_pulldown', exercise_name = 'Lat Pulldown', equipment = 'cable', attachment = 'Close-Grip V-Bar' 
                WHERE exercise_id = 'close_grip_lat_pulldown'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'lat_pulldown', exercise_name = 'Lat Pulldown', equipment = 'cable', attachment = 'Neutral-Grip Handles' 
                WHERE exercise_id = 'reverse_grip_lat_pulldown'
            `);

            // Seated Cable Rows
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'seated_cable_row', exercise_name = 'Seated Cable Row', equipment = 'cable', attachment = 'Wide-Grip Bar' 
                WHERE exercise_id = 'seated_cable_row_wide_grip'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'seated_cable_row', exercise_name = 'Seated Cable Row', equipment = 'cable', attachment = 'Close-Grip V-Bar' 
                WHERE exercise_id = 'seated_cable_row_close_grip'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'seated_cable_row', exercise_name = 'Seated Cable Row', equipment = 'cable', attachment = 'Neutral-Grip Handles' 
                WHERE exercise_id = 'seated_cable_row_reverse_grip'
            `);

            // Bicep Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'bicep_curl', exercise_name = 'Bicep Curl', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_curl'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'bicep_curl', exercise_name = 'Bicep Curl', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_curl'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'bicep_curl', exercise_name = 'Bicep Curl', equipment = 'cable', attachment = 'None' 
                WHERE exercise_id = 'cable_curl'
            `);

            // Preacher Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'preacher_curl', exercise_name = 'Preacher Curl', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_preacher_curl'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'preacher_curl', exercise_name = 'Preacher Curl', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'machine_preacher_curl'
            `);

            // Hammer Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'hammer_curl', exercise_name = 'Hammer Curl', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'hammer_dumbbell_curl'
            `);

            // Incline Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'incline_curl', exercise_name = 'Incline Curl', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'incline_dumbbell_curl'
            `);

            // Reverse Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'reverse_curl', exercise_name = 'Reverse Curl', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'reverse_dumbbell_curl'
            `);

            // Chest Flys
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'chest_fly', exercise_name = 'Chest Fly', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_fly'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'chest_fly', exercise_name = 'Chest Fly', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'machine_chest_fly'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'chest_fly', exercise_name = 'Chest Fly', equipment = 'cable', attachment = 'None' 
                WHERE exercise_id = 'cable_fly'
            `);

            // Reverse Wrist Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'reverse_wrist_curl', exercise_name = 'Reverse Wrist Curl', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_reverse_wrist_curl'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'reverse_wrist_curl', exercise_name = 'Reverse Wrist Curl', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_reverse_wrist_curl'
            `);

            // Wrist Curls
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'wrist_curl', exercise_name = 'Wrist Curl', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_wrist_curl'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'wrist_curl', exercise_name = 'Wrist Curl', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_wrist_curl'
            `);

            // Overhead Tricep Extensions
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'overhead_tricep_extension', exercise_name = 'Overhead Tricep Extension', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'overhead_dumbbell_tricep_extension'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'overhead_tricep_extension', exercise_name = 'Overhead Tricep Extension', equipment = 'cable', attachment = 'None' 
                WHERE exercise_id = 'overhead_cable_tricep_extension'
            `);

            // Shrugs
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'shrug', exercise_name = 'Shrug', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_shrug'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'shrug', exercise_name = 'Shrug', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_shrug'
            `);

            // Calf Raises
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_calf_raise', exercise_name = 'Weighted Calf Raise', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_calf_raise'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_calf_raise', exercise_name = 'Weighted Calf Raise', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'machine_calf_raise'
            `);

            // Weighted Squats
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_squat', exercise_name = 'Weighted Squat', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_squat'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_squat', exercise_name = 'Weighted Squat', equipment = 'smith machine', attachment = 'None' 
                WHERE exercise_id = 'smith_machine_squat'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_squat', exercise_name = 'Weighted Squat', equipment = 'hack machine', attachment = 'None' 
                WHERE exercise_id = 'hack_squat'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_squat', exercise_name = 'Weighted Squat', equipment = 'pendulum machine', attachment = 'None' 
                WHERE exercise_id = 'pendulum_squat'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'weighted_squat', exercise_name = 'Weighted Squat', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'goblet_squat'
            `);

            // Lateral Raises
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'lateral_raise', exercise_name = 'Lateral Raise', equipment = 'cable', attachment = 'None' 
                WHERE exercise_id = 'cable_lateral_raise'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'lateral_raise', exercise_name = 'Lateral Raise', equipment = 'cable', attachment = 'None' 
                WHERE exercise_id = 'single_arm_cable_lateral_raise'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'lateral_raise', exercise_name = 'Lateral Raise', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'machine_lateral_raise'
            `);

            // Shoulder Press
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'shoulder_press', exercise_name = 'Shoulder Press', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'overhead_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'shoulder_press', exercise_name = 'Shoulder Press', equipment = 'machine', attachment = 'None' 
                WHERE exercise_id = 'machine_shoulder_press'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'shoulder_press', exercise_name = 'Shoulder Press', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'arnold_press'
            `);

            // Skullcrushers
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'skullcrusher', exercise_name = 'Skullcrusher', equipment = 'barbell', attachment = 'None' 
                WHERE exercise_id = 'barbell_skullcrusher'
            `);
            await database.runAsync(`
                UPDATE set_logs 
                SET exercise_id = 'skullcrusher', exercise_name = 'Skullcrusher', equipment = 'dumbbell', attachment = 'None' 
                WHERE exercise_id = 'dumbbell_skullcrusher'
            `);

            // 2. Delete deprecated entries from exercises table
            await database.runAsync(`
                DELETE FROM exercises 
                WHERE id IN (
                    'flat_barbell_bench_press', 'incline_barbell_bench_press', 'decline_barbell_bench_press',
                    'flat_smith_machine_bench_press', 'incline_smith_machine_bench_press', 'decline_smith_machine_bench_press',
                    'flat_dumbbell_bench_press', 'incline_dumbbell_bench_press', 'decline_dumbbell_bench_press',
                    'wide_grip_lat_pulldown', 'close_grip_lat_pulldown', 'reverse_grip_lat_pulldown',
                    'seated_cable_row_wide_grip', 'seated_cable_row_close_grip', 'seated_cable_row_reverse_grip',
                    'dumbbell_curl', 'barbell_curl', 'cable_curl',
                    'barbell_preacher_curl', 'machine_preacher_curl',
                    'hammer_dumbbell_curl', 'incline_dumbbell_curl', 'reverse_dumbbell_curl',
                    'dumbbell_fly', 'machine_chest_fly', 'cable_fly',
                    'dumbbell_reverse_wrist_curl', 'barbell_reverse_wrist_curl',
                    'dumbbell_wrist_curl', 'barbell_wrist_curl',
                    'overhead_dumbbell_tricep_extension', 'overhead_cable_tricep_extension',
                    'dumbbell_shrug', 'barbell_shrug',
                    'dumbbell_calf_raise', 'machine_calf_raise',
                    'barbell_squat', 'smith_machine_squat', 'hack_squat', 'pendulum_squat', 'goblet_squat',
                    'cable_lateral_raise', 'single_arm_cable_lateral_raise', 'machine_lateral_raise',
                    'overhead_press', 'machine_shoulder_press', 'arnold_press',
                    'barbell_skullcrusher', 'dumbbell_skullcrusher'
                )
            `);
        });
        console.log("[DB] Consolidation migrations for set_logs and exercises completed.");
    } catch (e) {
        console.error("[DB] Failed running consolidation migrations for set_logs:", e);
    }

    // 3. Update workouts table JSON templates
    try {
        const workouts = await database.getAllAsync<any>('SELECT id, exercises FROM workouts');
        for (const w of workouts) {
            if (!w.exercises) continue;
            let exercisesList: any[] = [];
            try {
                exercisesList = JSON.parse(w.exercises);
            } catch {
                continue;
            }
            let modified = false;
            for (const ex of exercisesList) {
                const oldId = ex.id;
                // Check and map Bench Press
                if (oldId === 'flat_barbell_bench_press') {
                    ex.id = 'bench_press'; ex.name = 'Bench Press'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'flat_smith_machine_bench_press') {
                    ex.id = 'bench_press'; ex.name = 'Bench Press'; ex.equipment = 'machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'flat_dumbbell_bench_press') {
                    ex.id = 'bench_press'; ex.name = 'Bench Press'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                }
                // Incline
                else if (oldId === 'incline_barbell_bench_press') {
                    ex.id = 'incline_bench_press'; ex.name = 'Incline Bench Press'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'incline_smith_machine_bench_press') {
                    ex.id = 'incline_bench_press'; ex.name = 'Incline Bench Press'; ex.equipment = 'machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'incline_dumbbell_bench_press') {
                    ex.id = 'incline_bench_press'; ex.name = 'Incline Bench Press'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                }
                // Decline
                else if (oldId === 'decline_barbell_bench_press') {
                    ex.id = 'decline_bench_press'; ex.name = 'Decline Bench Press'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'decline_smith_machine_bench_press') {
                    ex.id = 'decline_bench_press'; ex.name = 'Decline Bench Press'; ex.equipment = 'machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'decline_dumbbell_bench_press') {
                    ex.id = 'decline_bench_press'; ex.name = 'Decline Bench Press'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                }
                // Lat Pulldowns
                else if (oldId === 'wide_grip_lat_pulldown') {
                    ex.id = 'lat_pulldown'; ex.name = 'Lat Pulldown'; ex.equipment = 'cable'; ex.attachment = 'Wide-Grip Bar'; modified = true;
                } else if (oldId === 'close_grip_lat_pulldown') {
                    ex.id = 'lat_pulldown'; ex.name = 'Lat Pulldown'; ex.equipment = 'cable'; ex.attachment = 'Close-Grip V-Bar'; modified = true;
                } else if (oldId === 'reverse_grip_lat_pulldown') {
                    ex.id = 'lat_pulldown'; ex.name = 'Lat Pulldown'; ex.equipment = 'cable'; ex.attachment = 'Neutral-Grip Handles'; modified = true;
                }
                // Seated Cable Rows
                else if (oldId === 'seated_cable_row_wide_grip') {
                    ex.id = 'seated_cable_row'; ex.name = 'Seated Cable Row'; ex.equipment = 'cable'; ex.attachment = 'Wide-Grip Bar'; modified = true;
                } else if (oldId === 'seated_cable_row_close_grip') {
                    ex.id = 'seated_cable_row'; ex.name = 'Seated Cable Row'; ex.equipment = 'cable'; ex.attachment = 'Close-Grip V-Bar'; modified = true;
                } else if (oldId === 'seated_cable_row_reverse_grip') {
                    ex.id = 'seated_cable_row'; ex.name = 'Seated Cable Row'; ex.equipment = 'cable'; ex.attachment = 'Neutral-Grip Handles'; modified = true;
                }
                // Bicep Curls
                else if (oldId === 'dumbbell_curl') {
                    ex.id = 'bicep_curl'; ex.name = 'Bicep Curl'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'barbell_curl') {
                    ex.id = 'bicep_curl'; ex.name = 'Bicep Curl'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'cable_curl') {
                    ex.id = 'bicep_curl'; ex.name = 'Bicep Curl'; ex.equipment = 'cable'; ex.attachment = 'None'; modified = true;
                }
                // Preacher Curls
                else if (oldId === 'barbell_preacher_curl') {
                    ex.id = 'preacher_curl'; ex.name = 'Preacher Curl'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'machine_preacher_curl') {
                    ex.id = 'preacher_curl'; ex.name = 'Preacher Curl'; ex.equipment = 'machine'; ex.attachment = 'None'; modified = true;
                }
                // Hammer Curls
                else if (oldId === 'hammer_dumbbell_curl') {
                    ex.id = 'hammer_curl'; ex.name = 'Hammer Curl'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                }
                // Incline Curls
                else if (oldId === 'incline_dumbbell_curl') {
                    ex.id = 'incline_curl'; ex.name = 'Incline Curl'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                }
                // Reverse Curls
                else if (oldId === 'reverse_dumbbell_curl') {
                    ex.id = 'reverse_curl'; ex.name = 'Reverse Curl'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                }
                // Chest Flys
                else if (oldId === 'dumbbell_fly') {
                    ex.id = 'chest_fly'; ex.name = 'Chest Fly'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'machine_chest_fly') {
                    ex.id = 'chest_fly'; ex.name = 'Chest Fly'; ex.equipment = 'machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'cable_fly') {
                    ex.id = 'chest_fly'; ex.name = 'Chest Fly'; ex.equipment = 'cable'; ex.attachment = 'None'; modified = true;
                }
                // Reverse Wrist Curls
                else if (oldId === 'dumbbell_reverse_wrist_curl') {
                    ex.id = 'reverse_wrist_curl'; ex.name = 'Reverse Wrist Curl'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'barbell_reverse_wrist_curl') {
                    ex.id = 'reverse_wrist_curl'; ex.name = 'Reverse Wrist Curl'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                }
                // Wrist Curls
                else if (oldId === 'dumbbell_wrist_curl') {
                    ex.id = 'wrist_curl'; ex.name = 'Wrist Curl'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'barbell_wrist_curl') {
                    ex.id = 'wrist_curl'; ex.name = 'Wrist Curl'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                }
                // Overhead Tricep Extensions
                else if (oldId === 'overhead_dumbbell_tricep_extension') {
                    ex.id = 'overhead_tricep_extension'; ex.name = 'Overhead Tricep Extension'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'overhead_cable_tricep_extension') {
                    ex.id = 'overhead_tricep_extension'; ex.name = 'Overhead Tricep Extension'; ex.equipment = 'cable'; ex.attachment = 'None'; modified = true;
                }
                // Shrugs
                else if (oldId === 'dumbbell_shrug') {
                    ex.id = 'shrug'; ex.name = 'Shrug'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'barbell_shrug') {
                    ex.id = 'shrug'; ex.name = 'Shrug'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                }
                // Calf Raises
                else if (oldId === 'dumbbell_calf_raise') {
                    ex.id = 'weighted_calf_raise'; ex.name = 'Weighted Calf Raise'; ex.equipment = 'dumbbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'machine_calf_raise') {
                    ex.id = 'weighted_calf_raise'; ex.name = 'Weighted Calf Raise'; ex.equipment = 'machine'; ex.attachment = 'None'; modified = true;
                }
                // Weighted Squats
                else if (oldId === 'barbell_squat') {
                    ex.id = 'weighted_squat'; ex.name = 'Weighted Squat'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'smith_machine_squat') {
                    ex.id = 'weighted_squat'; ex.name = 'Weighted Squat'; ex.equipment = 'smith machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'hack_squat') {
                    ex.id = 'weighted_squat'; ex.name = 'Weighted Squat'; ex.equipment = 'hack machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'pendulum_squat') {
                    ex.id = 'weighted_squat'; ex.name = 'Weighted Squat'; ex.equipment = 'pendulum machine'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'goblet_squat') {
                    ex.id = 'weighted_squat'; ex.name = 'Weighted Squat'; ex.equipment = 'barbell'; ex.attachment = 'None'; modified = true;
                }
                // Lateral Raises
                else if (oldId === 'cable_lateral_raise') {
                    ex.id = 'lateral_raise'; ex.name = 'Lateral Raise'; ex.equipment = 'cable'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'single_arm_cable_lateral_raise') {
                    ex.id = 'lateral_raise'; ex.name = 'Lateral Raise'; ex.equipment = 'cable'; ex.movementType = 'unilateral'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'machine_lateral_raise') {
                    ex.id = 'lateral_raise'; ex.name = 'Lateral Raise'; ex.equipment = 'machine'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                }
                // Shoulder Press
                else if (oldId === 'overhead_press') {
                    ex.id = 'shoulder_press'; ex.name = 'Shoulder Press'; ex.equipment = 'barbell'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'machine_shoulder_press') {
                    ex.id = 'shoulder_press'; ex.name = 'Shoulder Press'; ex.equipment = 'machine'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'arnold_press') {
                    ex.id = 'shoulder_press'; ex.name = 'Shoulder Press'; ex.equipment = 'dumbbell'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                }
                // Skullcrushers
                else if (oldId === 'barbell_skullcrusher') {
                    ex.id = 'skullcrusher'; ex.name = 'Skullcrusher'; ex.equipment = 'barbell'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                } else if (oldId === 'dumbbell_skullcrusher') {
                    ex.id = 'skullcrusher'; ex.name = 'Skullcrusher'; ex.equipment = 'dumbbell'; ex.movementType = 'uniform'; ex.attachment = 'None'; modified = true;
                }
            }

            if (modified) {
                await database.runAsync(
                    'UPDATE workouts SET exercises = ?, sync_status = "pending", updated_at = ? WHERE id = ?',
                    [JSON.stringify(exercisesList), Date.now(), w.id]
                );
            }
        }
        console.log("[DB] Consolidation migrations for workout templates completed.");
    } catch (e) {
        console.error("[DB] Failed running consolidation migrations for workouts:", e);
    }

    console.log("Database initialized successfully");
};
