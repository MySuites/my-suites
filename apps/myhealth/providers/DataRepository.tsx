import { getDb } from "../utils/db/database";
import type { LocalWorkoutLog, Exercise } from "../utils/workout-api/types";
import uuid from 'react-native-uuid';
import ExerciseDefaultData from '../assets/data/default-exercises.json';

// --- Generic Helpers ---
// We keep these for now if other sections need them during transition, 
// but we will implement specific SQL methods for Workouts.

export const DataRepository = {
    
    // --- Workouts (Templates) ---
    getWorkouts: async (): Promise<any[]> => {
        const db = await getDb();
        const rows = await db.getAllAsync<any>('SELECT * FROM workouts WHERE deleted_at IS NULL');
        
        return rows.map(row => ({
            ...row,
            exercises: row.exercises ? JSON.parse(row.exercises) : [],
            // Map snake_case db columns back to camelCase if needed, or keep consistent.
            // Current code expects camelCase for UI?
            // Let's check existing types usage. existing code uses `w.id`, `w.name`, `w.exercises`.
            // DB has `user_id`, `created_at`.
            // We should map them to be safe.
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            syncStatus: row.sync_status
        }));
    },

    saveWorkouts: async (workouts: any[]): Promise<void> => {
        // Bulk upsert
        const db = await getDb();
        
        // We can do this in a transaction
        await db.withTransactionAsync(async () => {
            for (const w of workouts) {
                await db.runAsync(`
                    INSERT OR REPLACE INTO workouts (id, user_id, name, exercises, created_at, updated_at, deleted_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    w.id,
                    w.userId || w.user_id || null, 
                    w.name || null,
                    JSON.stringify(w.exercises || []),
                    w.createdAt || w.created_at || null,
                    w.updatedAt || Date.now(),
                    w.deletedAt || null,
                    w.syncStatus || 'pending'
                ]);
            }
        });
    },

    saveWorkout: async (workout: any): Promise<void> => {
       const db = await getDb();
       await db.runAsync(`
            INSERT OR REPLACE INTO workouts (id, user_id, name, exercises, created_at, updated_at, deleted_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       `, [
           workout.id,
           workout.userId,
           workout.name,
           JSON.stringify(workout.exercises || []),
           workout.createdAt,
           Date.now(), // updatedAt
           null, // deletedAt
           'pending' // syncStatus
       ]);
    },

    deleteWorkout: async (id: string): Promise<void> => {
        const db = await getDb();
        await db.runAsync(`
            UPDATE workouts 
            SET deleted_at = ?, sync_status = 'pending', updated_at = ?
            WHERE id = ?
        `, [Date.now(), Date.now(), id]);
    },


    // --- History (Logs) ---
    getHistory: async (): Promise<LocalWorkoutLog[]> => {
        const db = await getDb();
        const logs = await db.getAllAsync<any>('SELECT * FROM workout_logs ORDER BY workout_time DESC');
        const setLogs = await db.getAllAsync<any>('SELECT * FROM set_logs');
        
        return logs.map(log => {
            const sets = setLogs.filter(s => s.workout_log_id === log.id);

            // Group sets by exercise
            const exercisesMap = new Map<string, Exercise>();

            sets.forEach(set => {
                const exId = set.exercise_id || 'unknown';
                const exName = set.exercise_name || 'Unknown Exercise';

                if (!exercisesMap.has(exId)) {
                    exercisesMap.set(exId, {
                        id: exId,
                        name: exName,
                        sets: 0,
                        reps: 0,
                        completedSets: 0,
                        logs: [],
                    });
                }

                const ex = exercisesMap.get(exId)!;
                ex.logs?.push({
                     id: set.id,
                     weight: set.weight,
                     reps: set.reps,
                     distance: set.distance,
                     duration: set.duration,
                     bodyweight: set.bodyweight, // Keep as number (0/1) if type expects number
                });
                ex.completedSets = (ex.completedSets || 0) + 1;
            });

            return {
                id: log.id,
                workoutId: undefined, // Template link not preserved in flat log table usually, but could add column if needed. schema has it? Schema in database.ts didn't have workout_id.
                userId: log.user_id,
                date: log.workout_time,
                workoutTime: log.workout_time,
                name: log.workout_name,
                duration: log.duration,
                note: log.note,
                notes: log.note,
                exercises: Array.from(exercisesMap.values()),
                createdAt: log.created_at,
                syncStatus: log.sync_status || 'synced',
                updatedAt: log.updated_at || new Date(log.created_at).getTime(),
            };
        });
    },

    saveHistory: async (logs: LocalWorkoutLog[]): Promise<void> => {
        const db = await getDb();
        await db.withTransactionAsync(async () => {
             for (const l of logs) {
                 // 1. Save Log Header
                 await db.runAsync(`
                    INSERT OR REPLACE INTO workout_logs (id, user_id, workout_time, workout_name, duration, note, created_at, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                     l.id,
                     l.userId || null,
                     l.date || l.workoutTime || null,
                     l.name || null,
                     l.duration || null,
                     l.note || null,
                     l.createdAt || null,
                     l.updatedAt || Date.now(),
                     l.syncStatus || 'synced'
                 ]);

                 // 2. Save Sets
                 if (l.exercises) {
                     for (const ex of l.exercises) {
                         if (ex.logs) {
                             for (const s of ex.logs) {
                                 await db.runAsync(`
                                    INSERT OR REPLACE INTO set_logs (id, workout_log_id, exercise_id, exercise_name, weight, reps, distance, duration, bodyweight, created_at, sync_status)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                 `, [
                                     s.id || uuid.v4(),
                                     l.id,
                                     ex.id || null,
                                     ex.name || null,
                                     s.weight || null,
                                     s.reps || null,
                                     s.distance || null,
                                     s.duration || null,
                                     s.bodyweight ? 1 : 0,
                                     l.createdAt || null,
                                     'synced' 
                                 ]);
                             }
                         }
                     }
                 }
             }
        });
    },

    saveLog: async (log: Omit<LocalWorkoutLog, 'updatedAt' | 'syncStatus' | 'id'> & { id?: string }): Promise<LocalWorkoutLog> => {
        const id = log.id || (uuid.v4() as string);
        const now = Date.now();
        const timestamp = new Date().toISOString(); 
        const db = await getDb();

        await db.withTransactionAsync(async () => {
            // 1. Save Header
            await db.runAsync(`
                INSERT OR REPLACE INTO workout_logs (id, user_id, workout_time, workout_name, duration, note, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `, [
                id,
                log.userId || null,
                log.date || timestamp,
                log.name || null,
                log.duration || null,
                log.note || null,
                timestamp,
                now
            ]);

            // 2. Save Sets
            if (log.exercises) {
                for (const ex of log.exercises) {
                    if (ex.logs) {
                        for (const s of ex.logs) {
                            await db.runAsync(`
                                INSERT INTO set_logs (id, workout_log_id, exercise_id, exercise_name, weight, reps, distance, duration, bodyweight, created_at, sync_status)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                            `, [
                                s.id || uuid.v4(),
                                id,
                                ex.id || null,
                                ex.name || null,
                                s.weight || null,
                                s.reps || null,
                                s.distance || null,
                                s.duration || null,
                                s.bodyweight ? 1 : 0,
                                timestamp
                            ]);
                        }
                    }
                }
            }
        });

        return {
            ...log,
            id,
            updatedAt: now,
            syncStatus: 'pending'
        } as LocalWorkoutLog;
    },
    
    // --- Stats ---
    getExerciseStats: async (exerciseName: string) => {
        const db = await getDb();
        // Use SQL aggregation for efficiency
        const result = await db.getAllAsync<{ maxWeight: number, totalVolume: number, prDate: string }>(`
            SELECT 
                MAX(weight) as maxWeight,
                SUM(weight * reps) as totalVolume -- approximate volume
            FROM set_logs 
            WHERE exercise_name = ?
        `, [exerciseName]);
        
        // SQLite aggregation returns one row with nulls if empty
        const row = result[0];
        
        // Need Date of PR. 
        // Complex query: SELECT created_at FROM set_logs WHERE exercise_name = ? AND weight = (SELECT MAX(weight) ...)
        // Let's do a separate query if maxWeight > 0
        let prDate = null;
        if (row && row.maxWeight > 0) {
            const dateParams = await db.getFirstAsync<{ created_at: string }>(`
                SELECT created_at FROM set_logs WHERE exercise_name = ? AND weight = ? LIMIT 1
            `, [exerciseName, row.maxWeight]);
            prDate = dateParams?.created_at;
        }

        return {
            maxWeight: row?.maxWeight || 0,
            prDate: prDate,
            totalVolume: row?.totalVolume || 0
        };
    },
    
    // --- Base Data ---
    getDefaultExercises: async () => {
        return ExerciseDefaultData;
    },

    // --- Body Measurements ---
    getLatestBodyWeight: async (userId: string | null): Promise<number | null> => {
        const db = await getDb();
        let query = 'SELECT weight FROM body_measurements ';
        let params: any[] = [];
        
        if (userId) {
            query += 'WHERE user_id = ? ';
            params.push(userId);
        }
        
        query += 'ORDER BY date DESC, created_at DESC LIMIT 1';
        
        const res = await db.getFirstAsync<{ weight: number }>(query, params);
        return res ? res.weight : null;
    },

    getBodyWeightHistory: async (userId: string | null, startDate?: string): Promise<any[]> => {
        const db = await getDb();
        let query = 'SELECT * FROM body_measurements ';
        let params: any[] = [];
        
        // Dynamic WHERE clause
        const conditions = [];
        if (userId) {
            conditions.push('user_id = ?');
            params.push(userId);
        }
        if (startDate) {
            conditions.push('date >= ?');
            params.push(startDate);
        }
        
        if (conditions.length > 0) {
            query += 'WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY date ASC';
        
        const rows = await db.getAllAsync<any>(query, params);
        
        return rows.map(r => ({
            ...r,
            userId: r.user_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            syncStatus: r.sync_status
        }));
    },

    saveBodyMeasurements: async (measurements: any[]): Promise<void> => {
        const db = await getDb();
        await db.withTransactionAsync(async () => {
            for (const m of measurements) {
                 await db.runAsync(`
                    INSERT OR REPLACE INTO body_measurements (id, user_id, weight, date, created_at, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                 `, [
                    m.id,
                    m.userId || m.user_id || null, // handle variety of input shapes from sync
                    m.weight,
                    m.date,
                    m.createdAt || m.created_at || new Date().toISOString(),
                    m.updatedAt || m.updated_at || Date.now(),
                    m.syncStatus || 'pending'
                 ]);
            }
        });
    },

    saveBodyWeight: async (log: { userId: string, weight: number, date: string, id?: string }): Promise<void> => {
        const id = log.id || (uuid.v4() as string);
        const now = Date.now();
        const db = await getDb();
        await db.runAsync(`
            INSERT OR REPLACE INTO body_measurements (id, user_id, weight, date, created_at, updated_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `, [
            id,
            log.userId || null,
            log.weight,
            log.date,
            new Date().toISOString(),
            now
        ]);
    },

    // --- Routines ---
    getRoutines: async (): Promise<any[]> => {
        const db = await getDb();
        const result = await db.getAllAsync<any>('SELECT * FROM routines WHERE deleted_at IS NULL ORDER BY created_at DESC');
        return result.map(r => ({
            ...r,
            sequence: r.sequence ? JSON.parse(r.sequence) : []
        }));
    },

    saveRoutine: async (routine: any): Promise<void> => {
        const db = await getDb();
        const now = Date.now();
        await db.runAsync(`
            INSERT OR REPLACE INTO routines (id, name, sequence, created_at, updated_at, deleted_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            routine.id,
            routine.name,
            JSON.stringify(routine.sequence || []),
            routine.createdAt || routine.created_at || new Date().toISOString(),
            now,
            null, // Not deleted
            'pending'
        ]);
    },

    deleteRoutine: async (id: string): Promise<void> => {
        const db = await getDb();
        await db.runAsync(`
            UPDATE routines 
            SET deleted_at = ?, sync_status = 'pending', updated_at = ?
            WHERE id = ?
        `, [Date.now(), Date.now(), id]);
    },

    // --- Exercises (Library) ---
    getExercises: async (): Promise<any[]> => {
        const db = await getDb();
        const result = await db.getAllAsync<any>('SELECT * FROM exercises ORDER BY name ASC');
        return result.map(e => ({
            ...e,
            muscle_groups: e.muscle_groups ? JSON.parse(e.muscle_groups) : [],
            properties: e.properties ? e.properties.split(',') : [] // Store as comma-sep string in DB for simplicity or JSON? Let's assume text for properties based on schema, but split on read.
        }));
    },

    saveExercises: async (exercises: any[]): Promise<void> => {
        if (exercises.length === 0) return;
        const db = await getDb();
        const now = Date.now();
        
        // Bulk insert using transaction
        await db.withTransactionAsync(async () => {
            for (const ex of exercises) {
                await db.runAsync(`
                    INSERT OR REPLACE INTO exercises (id, name, muscle_groups, properties, created_at, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, 'synced')
                `, [
                    ex.id || ex.exercise_id, 
                    ex.name || ex.exercise_name,
                    JSON.stringify(ex.muscle_groups || ex.exercise_muscle_groups || []),
                    ex.properties || "", // Assume string or convert? 
                    // Verify upstream properties format: "strength, reps"...
                    // If ex.properties is array, join it.
                    // If it is string cleanup?
                    new Date().toISOString(),
                    now
                ]);
            }
        });
    }
};
