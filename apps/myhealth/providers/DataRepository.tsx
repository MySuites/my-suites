import { getDb } from "../utils/db/database";
import type { LocalWorkoutLog, Exercise } from "../utils/workout-api/types";
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExerciseDefaultData from '../assets/data/default-exercises';

// --- Generic Helpers ---
// We keep these for now if other sections need them during transition, 
// but we will implement specific SQL methods for Workouts.

function generateDefaultInstructions(name: string, description: string, muscleGroups: string[]): string[] {
    const n = name.toLowerCase();
    
    if (n.includes('bench press') || n.includes('chest press') || n.includes('push press')) {
        return [
            "Position yourself securely on the bench or seat.",
            "Grip the bar or handles firmly, slightly wider than shoulder-width.",
            "Lower the weight in a controlled motion towards your chest.",
            "Press the weight back up to the starting position, exhaling at the top."
        ];
    }
    if (n.includes('fly')) {
        return [
            "Sit or lie down, holding the weights with arms slightly bent.",
            "Open your arms wide in a smooth arc until you feel a stretch in your chest.",
            "Bring the weights back together by contracting your chest muscles.",
            "Avoid bending or locking your elbows during the movement."
        ];
    }
    if (n.includes('pulldown')) {
        return [
            "Sit at the pulldown machine and adjust the knee pad.",
            "Grip the bar slightly wider than shoulder-width with palms facing forward.",
            "Pull the bar down to your upper chest while leaning back slightly.",
            "Slowly return the bar to the starting position, maintaining tension."
        ];
    }
    if (n.includes('row')) {
        return [
            "Set up with a straight spine and grip the handle or bar.",
            "Pull the weight toward your lower chest or abdomen, squeezing your shoulder blades.",
            "Keep your elbows close to your body throughout the movement.",
            "Extend your arms fully back to the starting position under control."
        ];
    }
    if (n.includes('lateral raise') || n.includes('front raise') || n.includes('delt raise')) {
        return [
            "Stand tall with weights held at your sides or front.",
            "With a slight bend in your elbows, raise the weights to shoulder height.",
            "Pause briefly at the top of the movement.",
            "Lower the weights slowly back to the starting position."
        ];
    }
    if (n.includes('shoulder press') || n.includes('overhead press') || n.includes('arnold press') || n.includes('military press')) {
        return [
            "Sit or stand upright, holding the weights at shoulder height.",
            "Press the weights directly overhead until your arms are fully extended.",
            "Keep your core engaged to stabilize your lower back.",
            "Lower the weights slowly back to shoulder height."
        ];
    }
    if (n.includes('deadlift')) {
        return [
            "Stand with feet hip-width apart, shins close to the barbell.",
            "Hinge at your hips and bend your knees to grip the bar with a flat back.",
            "Drive through your heels, pushing hips forward to stand upright.",
            "Hinge at the hips again and lower the bar back to the floor under control."
        ];
    }
    if (n.includes('squat')) {
        return [
            "Stand with your feet shoulder-width apart, toes pointed slightly out.",
            "Lower your hips back and down as if sitting in a chair.",
            "Descend until your thighs are parallel to the ground or lower.",
            "Drive through your heels to return to a standing position."
        ];
    }
    if (n.includes('lunge')) {
        return [
            "Stand tall with feet hip-width apart.",
            "Step forward and lower your hips.",
            "Descend until your back knee is just above the floor.",
            "Push back up to the starting position, driving through your front heel."
        ];
    }
    if (n.includes('split squat') || n.includes('bulgarian')) {
        return [
            "Stand with one foot forward and the other foot back in a staggered stance.",
            "Lower your hips by bending both knees to roughly 90 degrees.",
            "Descend until your back knee is just above the floor.",
            "Drive through your front heel to return to the starting position without moving your feet."
        ];
    }
    if (n.includes('leg extension')) {
        return [
            "Sit in the machine and align your knees with the pivot point.",
            "Place your shins behind the padded roller.",
            "Extend your legs fully by contracting your quadriceps.",
            "Slowly lower the weights back to the starting position."
        ];
    }
    if (n.includes('leg curl')) {
        return [
            "Position yourself in the machine with the pad resting just below your calves.",
            "Curl your legs down and back as far as possible.",
            "Squeeze your hamstrings at the peak of the contraction.",
            "Return the weight slowly to the starting position."
        ];
    }
    if (n.includes('calf raise')) {
        return [
            "Place the balls of your feet on the edge of a step or platform.",
            "Lower your heels below the platform to stretch the calf muscles.",
            "Press up onto the balls of your feet as high as possible.",
            "Lower back down slowly to the starting stretch position."
        ];
    }
    if (n.includes('curl')) {
        return [
            "Hold the weight with an underhand grip, arms fully extended.",
            "Curl the weight up towards your shoulders by flexing your biceps.",
            "Keep your elbows stationary and close to your torso.",
            "Lower the weight slowly back to the starting position."
        ];
    }
    if (n.includes('pushdown') || n.includes('kickback') || n.includes('skullcrusher') || n.includes('tricep extension')) {
        return [
            "Grip the handle or weights, keeping your upper arms pinned to your torso.",
            "Extend your arms fully to contract your triceps.",
            "Pause and squeeze your triceps at the point of full extension.",
            "Slowly return to the starting position, keeping elbows stationary."
        ];
    }
    if (n.includes('plank')) {
        return [
            "Support your bodyweight on your forearms and toes, elbows under shoulders.",
            "Keep your body in a straight line from head to heels.",
            "Engage your core, glutes, and thighs to maintain the position.",
            "Breathe steadily and hold for the targeted duration."
        ];
    }
    if (n.includes('crunch') || n.includes('situp') || n.includes('sit-up') || n.includes('leg raise') || n.includes('twist') || n.includes('toe touch')) {
        return [
            "Lie or sit in position, engaging your abdominal muscles.",
            "Perform the movement with control, avoiding momentum.",
            "Exhale on the exertion/contraction phase.",
            "Return slowly to the starting position, keeping tension on the abs."
        ];
    }
    if (n.includes('push-up') || n.includes('pushup') || n.includes('dip')) {
        return [
            "Position your hands shoulder-width apart, core tight.",
            "Lower your body by bending your elbows until chest is close to the floor/bar.",
            "Keep your elbows tucked at roughly 45 degrees.",
            "Press yourself back up to the starting position."
        ];
    }
    if (n.includes('pull-up') || n.includes('pullup') || n.includes('chin-up') || n.includes('chinup')) {
        return [
            "Hang from the bar with your arms fully extended.",
            "Pull your body up by driving your elbows down toward your ribs.",
            "Clear the bar with your chin and squeeze your upper back.",
            "Lower your body under control back to a dead hang."
        ];
    }
    
    // Muscle-group based heuristics
    if (muscleGroups && muscleGroups.length > 0) {
        const mg = muscleGroups[0].toLowerCase();
        if (mg === 'cardio') {
            return [
                "Position yourself correctly on the cardio equipment or floor.",
                "Start the movement at a moderate, sustainable pace.",
                "Maintain a steady breathing pattern and monitor your heart rate.",
                "Continue for the targeted duration or distance."
            ];
        }
    }

    // Fallback: split description by sentences if available
    if (description && description.trim().length > 10) {
        const sentences = description
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 5);
        if (sentences.length >= 2) {
            return sentences.map(s => s.endsWith('.') ? s : s + '.');
        }
    }
    
    return [
        "Set up the equipment or position yourself with proper posture.",
        "Perform the exercise with a slow and controlled range of motion.",
        "Focus on contracting the target muscle group.",
        "Maintain regular, steady breathing throughout the set."
    ];
}

export function inferEquipment(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('dumbbell')) return 'dumbbell';
    if (n.includes('barbell')) return 'barbell';
    if (n.includes('cable')) return 'cable';
    if (n.includes('smith') || n.includes('machine') || n.includes('leg press') || n.includes('leg extension') || n.includes('leg curl') || n.includes('lat pulldown') || n.includes('seated row') || n.includes('chest press') || n.includes('pec deck')) return 'machine';
    if (n.includes('parallette') || n.includes('parallette')) return 'parallettes';
    if (n.includes('pull-up') || n.includes('pullup') || n.includes('pull up') || n.includes('chin-up') || n.includes('chinup') || n.includes('chin up') || n.includes('hanging leg raise') || n.includes('toes to bar')) return 'pull up bar';
    if (n.includes('push-up') || n.includes('pushup') || n.includes('dip') || n.includes('bodyweight') || n.includes('handstand') || n.includes('planche') || n.includes('lever') || n.includes('plank') || n.includes('crunch') || n.includes('situp') || n.includes('squat')) return 'none';
    return 'other';
}

export function inferMovementType(name: string, equipment: string): string {
    const n = name.toLowerCase();
    if (n.includes('single') || n.includes('unilateral') || n.includes('one-arm') || n.includes('one arm') || n.includes('single-arm') || n.includes('single arm') || n.includes('single-leg') || n.includes('single leg') || n.includes('pistol') || n.includes('shrimp') || n.includes('dragon') || n.includes('lunge') || n.includes('split squat') || n.includes('bulgarian') || n.includes('kickback') || n.includes('alternate')) {
        return 'unilateral';
    }
    if (equipment === 'dumbbell') {
        return 'unilateral';
    }
    return 'uniform';
}

export function inferAngle(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('incline')) return 'incline';
    if (n.includes('decline')) return 'decline';
    return 'flat';
}

export function inferAttachment(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('neutral-grip') || n.includes('neutral grip')) return 'Neutral-Grip Handles';
    if (n.includes('close-grip') || n.includes('close grip')) return 'Close-Grip V-Bar';
    if (n.includes('wide-grip') || n.includes('wide grip')) return 'Wide-Grip Bar';
    if (n.includes('straight bar')) return 'Straight Bar';
    if (n.includes('lat bar') || n.includes('lat_pulldown') || n.includes('pulldown')) return 'Lat Bar';
    if (n === 'seated cable row' || n.includes('seated row')) return 'Close-Grip V-Bar';
    return '';
}

export const DataRepository = {
    
    // --- Workouts (Templates) ---
    getWorkouts: async (): Promise<any[]> => {
        const db = await getDb();
        const rows = await db.getAllAsync<any>('SELECT * FROM workouts WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC');
        
        return rows.map(row => ({
            ...row,
            exercises: row.exercises ? JSON.parse(row.exercises) : [],
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            syncStatus: row.sync_status,
            sortOrder: row.sort_order
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
            INSERT OR REPLACE INTO workouts (id, user_id, name, exercises, created_at, updated_at, deleted_at, sync_status, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       `, [
           workout.id,
           workout.userId,
           workout.name,
           JSON.stringify(workout.exercises || []),
           workout.createdAt,
           Date.now(), // updatedAt
           null, // deletedAt
           'pending', // syncStatus
           workout.sortOrder !== undefined ? workout.sortOrder : (workout.sort_order || null)
       ]);
    },

    updateWorkoutSortOrders: async (orders: { id: string, sortOrder: number }[]): Promise<void> => {
        const db = await getDb();
        await db.withTransactionAsync(async () => {
            for (const order of orders) {
                await db.runAsync(
                    'UPDATE workouts SET sort_order = ?, updated_at = ?, sync_status = "pending" WHERE id = ?',
                    [order.sortOrder, Date.now(), order.id]
                );
            }
        });
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
    getPendingHistoryLogs: async (): Promise<LocalWorkoutLog[]> => {
        const db = await getDb();
        // Fetch ALL pending logs (including deleted ones)
        const logs = await db.getAllAsync<any>('SELECT * FROM workout_logs WHERE sync_status = "pending" ORDER BY workout_date DESC');
        const setLogs = await db.getAllAsync<any>('SELECT * FROM set_logs');
        const exercisesDef = await db.getAllAsync<any>('SELECT * FROM exercises');

        const setLogsByLogId = new Map<string, any[]>();
        setLogs.forEach(s => {
            const arr = setLogsByLogId.get(s.workout_log_id);
            if (arr) arr.push(s); else setLogsByLogId.set(s.workout_log_id, [s]);
        });

        const exerciseMetaMap = new Map<string, { properties: string[], equipment?: string, attachment?: string, movement_type?: string }>();
        exercisesDef.forEach(e => {
            if (e.id) {
                 let eq = e.equipment;
                 if (eq && typeof eq === 'string' && eq.startsWith('[')) {
                     try {
                         const parsed = JSON.parse(eq);
                         eq = Array.isArray(parsed) ? parsed[0] : parsed;
                     } catch {}
                 }
                 if (eq && typeof eq === 'string' && eq.startsWith('"')) {
                     try {
                         eq = JSON.parse(eq);
                     } catch {}
                 }
                 
                 let att = e.attachment;
                 if (att && typeof att === 'string' && att.startsWith('[')) {
                     try {
                         const parsed = JSON.parse(att);
                         att = Array.isArray(parsed) ? parsed[0] : parsed;
                     } catch {}
                 }
                 if (att && typeof att === 'string' && att.startsWith('"')) {
                     try {
                         att = JSON.parse(att);
                     } catch {}
                 }

                 exerciseMetaMap.set(e.id, {
                     properties: e.properties ? e.properties.split(',').map((s: string) => s.trim()) : [],
                     equipment: eq || undefined,
                     attachment: att || undefined,
                     movement_type: e.movement_type || undefined,
                 });
            }
        });
        
        // Helper to map DB row to object
        return logs.map(log => {
             const sets = setLogsByLogId.get(log.id) || [];
             const exercisesMap = new Map<string, Exercise>();
 
             sets.forEach(set => {
                 const exId = set.exercise_id || 'unknown';
                 const exName = set.exercise_name || 'Unknown Exercise';
 
                 if (!exercisesMap.has(exId)) {
                     const meta = exerciseMetaMap.get(exId);
                     
                     let setEq = set.equipment;
                     if (setEq && typeof setEq === 'string' && setEq.startsWith('[')) {
                         try {
                             const parsed = JSON.parse(setEq);
                             setEq = Array.isArray(parsed) ? parsed[0] : parsed;
                         } catch {}
                     }
                     if (setEq && typeof setEq === 'string' && setEq.startsWith('"')) {
                         try {
                             setEq = JSON.parse(setEq);
                         } catch {}
                     }

                     let setAtt = set.attachment;
                     if (setAtt && typeof setAtt === 'string' && setAtt.startsWith('[')) {
                         try {
                             const parsed = JSON.parse(setAtt);
                             setAtt = Array.isArray(parsed) ? parsed[0] : parsed;
                         } catch {}
                     }
                     if (setAtt && typeof setAtt === 'string' && setAtt.startsWith('"')) {
                         try {
                             setAtt = JSON.parse(setAtt);
                         } catch {}
                     }

                     const finalEq = setEq || meta?.equipment || inferEquipment(exName);
                     const finalAtt = setAtt || meta?.attachment || inferAttachment(exName);

                     exercisesMap.set(exId, {
                         id: exId,
                         name: exName,
                         sets: 0,
                         reps: 0,
                         completedSets: 0,
                         logs: [],
                         properties: meta?.properties || [],
                         equipment: finalEq,
                         attachment: finalAtt,
                         movementType: meta?.movement_type || inferMovementType(exName, finalEq),
                     });
                 }
 
                 const ex = exercisesMap.get(exId)!;
                 ex.logs?.push({
                      id: set.id,
                      weight: set.weight,
                      reps: set.reps,
                      reps_left: set.reps_left,
                      reps_right: set.reps_right,
                      distance: set.distance,
                      duration: set.duration,
                      bodyweight: set.bodyweight,
                      rpe: set.rpe,
                 });
                 ex.completedSets = (ex.completedSets || 0) + 1;
             });
 
             let parsedUrls: string[] = [];
             let singleUrl: string | undefined = undefined;
             if (log.image_url) {
                 if (log.image_url.startsWith('[')) {
                     try {
                         parsedUrls = JSON.parse(log.image_url);
                         singleUrl = parsedUrls[0];
                     } catch {
                         parsedUrls = [log.image_url];
                         singleUrl = log.image_url;
                     }
                 } else {
                     parsedUrls = [log.image_url];
                     singleUrl = log.image_url;
                 }
             }
 
             let route: LocalWorkoutLog['route'] = undefined;
             if (log.route) {
                 try {
                     route = JSON.parse(log.route);
                 } catch {
                     route = undefined;
                 }
             }

             return {
                 id: log.id,
                 userId: log.user_id,
                 date: log.workout_date,
                 workoutDate: log.workout_date,
                 name: log.workout_name,
                 duration: log.duration,
                 note: log.note,
                 notes: log.note,
                 exercises: Array.from(exercisesMap.values()),
                 createdAt: log.created_at,
                 syncStatus: log.sync_status,
                 updatedAt: log.updated_at || new Date(log.created_at).getTime(),
                 deletedAt: log.deleted_at,
                 imageUrl: singleUrl,
                 imageUrls: parsedUrls,
                 healthkitUuid: log.healthkit_uuid ?? undefined,
                 avgHeartRate: log.avg_heart_rate ?? undefined,
                 maxHeartRate: log.max_heart_rate ?? undefined,
                 calories: log.calories ?? undefined,
                 distance: log.distance ?? undefined,
                 elevationGain: log.elevation_gain ?? undefined,
                 route,
                 metricsSource: log.metrics_source ?? undefined,
             } as LocalWorkoutLog;
        });
    },

    getPendingWorkouts: async (): Promise<any[]> => {
        const db = await getDb();
        const rows = await db.getAllAsync<any>('SELECT * FROM workouts WHERE sync_status = "pending"');
        return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            exercises: row.exercises ? JSON.parse(row.exercises) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            syncStatus: row.sync_status
        }));
    },

    getHistory: async (): Promise<LocalWorkoutLog[]> => {
        const db = await getDb();
        const logs = await db.getAllAsync<any>('SELECT * FROM workout_logs WHERE deleted_at IS NULL ORDER BY workout_date DESC');
        const setLogs = await db.getAllAsync<any>('SELECT * FROM set_logs');
        const exercisesDef = await db.getAllAsync<any>('SELECT * FROM exercises');

        const setLogsByLogId = new Map<string, any[]>();
        setLogs.forEach(s => {
            const arr = setLogsByLogId.get(s.workout_log_id);
            if (arr) arr.push(s); else setLogsByLogId.set(s.workout_log_id, [s]);
        });

        const exerciseMetaMap = new Map<string, { properties: string[], equipment?: string, attachment?: string, movement_type?: string, muscleGroups?: string[] }>();
        exercisesDef.forEach(e => {
            if (e.id) {
                 let eq = e.equipment;
                 if (eq && typeof eq === 'string' && eq.startsWith('[')) {
                     try {
                         const parsed = JSON.parse(eq);
                         eq = Array.isArray(parsed) ? parsed[0] : parsed;
                     } catch {}
                 }
                 if (eq && typeof eq === 'string' && eq.startsWith('"')) {
                     try {
                         eq = JSON.parse(eq);
                     } catch {}
                 }
                 
                 let att = e.attachment;
                 if (att && typeof att === 'string' && att.startsWith('[')) {
                     try {
                         const parsed = JSON.parse(att);
                         att = Array.isArray(parsed) ? parsed[0] : parsed;
                     } catch {}
                 }
                 if (att && typeof att === 'string' && att.startsWith('"')) {
                     try {
                         att = JSON.parse(att);
                     } catch {}
                 }

                 exerciseMetaMap.set(e.id, {
                     properties: e.properties ? e.properties.split(',').map((s: string) => s.trim()) : [],
                     equipment: eq || undefined,
                     attachment: att || undefined,
                     movement_type: e.movement_type || undefined,
                     muscleGroups: e.muscle_groups ? JSON.parse(e.muscle_groups) : [],
                 });
            }
        });
        
        return logs.map(log => {
            const sets = setLogsByLogId.get(log.id) || [];

            // Group sets by exercise
            const exercisesMap = new Map<string, Exercise>();

            sets.forEach(set => {
                if (!set) return; // Defensive check
                const exId = set.exercise_id || 'unknown';
                const exName = set.exercise_name || 'Unknown Exercise';

                if (!exercisesMap.has(exId)) {
                    const meta = exerciseMetaMap.get(exId);
                    
                    let setEq = set.equipment;
                    if (setEq && typeof setEq === 'string' && setEq.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(setEq);
                            setEq = Array.isArray(parsed) ? parsed[0] : parsed;
                        } catch {}
                    }
                    if (setEq && typeof setEq === 'string' && setEq.startsWith('"')) {
                         try {
                             setEq = JSON.parse(setEq);
                         } catch {}
                    }

                    let setAtt = set.attachment;
                    if (setAtt && typeof setAtt === 'string' && setAtt.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(setAtt);
                            setAtt = Array.isArray(parsed) ? parsed[0] : parsed;
                        } catch {}
                    }
                    if (setAtt && typeof setAtt === 'string' && setAtt.startsWith('"')) {
                         try {
                             setAtt = JSON.parse(setAtt);
                         } catch {}
                    }

                    const finalEq = setEq || meta?.equipment || inferEquipment(exName);
                    const finalAtt = setAtt || meta?.attachment || inferAttachment(exName);

                    exercisesMap.set(exId, {
                        id: exId,
                        name: exName,
                        sets: 0,
                        reps: 0,
                        completedSets: 0,
                        logs: [],
                        properties: meta?.properties || [],
                        equipment: finalEq,
                        attachment: finalAtt,
                        movementType: meta?.movement_type || inferMovementType(exName, finalEq),
                        muscleGroups: meta?.muscleGroups || [],
                    });
                }

                const ex = exercisesMap.get(exId)!;
                ex.logs?.push({
                     id: set.id,
                     weight: set.weight,
                     reps: set.reps,
                     reps_left: set.reps_left,
                     reps_right: set.reps_right,
                     distance: set.distance,
                     duration: set.duration,
                     bodyweight: set.bodyweight, // Keep as number (0/1) if type expects number
                     rpe: set.rpe,
                });
                ex.completedSets = (ex.completedSets || 0) + 1;
            });

            let parsedUrls: string[] = [];
            let singleUrl: string | undefined = undefined;
            if (log.image_url) {
                if (log.image_url.startsWith('[')) {
                    try {
                        parsedUrls = JSON.parse(log.image_url);
                        singleUrl = parsedUrls[0];
                    } catch {
                        parsedUrls = [log.image_url];
                        singleUrl = log.image_url;
                    }
                } else {
                    parsedUrls = [log.image_url];
                    singleUrl = log.image_url;
                }
            }

            let route: LocalWorkoutLog['route'] = undefined;
            if (log.route) {
                try {
                    route = JSON.parse(log.route);
                } catch {
                    route = undefined;
                }
            }

            return {
                id: log.id,
                workoutId: undefined, // Template link not preserved in flat log table usually, but could add column if needed. schema has it? Schema in database.ts didn't have workout_id.
                userId: log.user_id,
                date: log.workout_date,
                workoutDate: log.workout_date,
                name: log.workout_name,
                duration: log.duration,
                note: log.note,
                notes: log.note,
                exercises: Array.from(exercisesMap.values()),
                createdAt: log.created_at,
                syncStatus: log.sync_status || 'synced',
                updatedAt: log.updated_at || new Date(log.created_at).getTime(),
                imageUrl: singleUrl,
                imageUrls: parsedUrls,
                healthkitUuid: log.healthkit_uuid ?? undefined,
                avgHeartRate: log.avg_heart_rate ?? undefined,
                maxHeartRate: log.max_heart_rate ?? undefined,
                calories: log.calories ?? undefined,
                distance: log.distance ?? undefined,
                elevationGain: log.elevation_gain ?? undefined,
                route,
                metricsSource: log.metrics_source ?? undefined,
            };
        });
    },

    saveHistory: async (logs: LocalWorkoutLog[]): Promise<void> => {
        const db = await getDb();
        await db.withTransactionAsync(async () => {
             for (const l of logs) {
                 if (!l) continue; // Defensive check
                 // 1. Save Log Header
                 await db.runAsync(`
                    INSERT OR REPLACE INTO workout_logs (id, user_id, workout_date, workout_name, duration, note, created_at, updated_at, deleted_at, sync_status, image_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `, [
                     l.id,
                     l.userId || null,
                     l.date || l.workoutDate || null,
                     l.name || null,
                     l.duration || null,
                     l.note || null,
                     l.createdAt || null,
                     l.updatedAt || Date.now(),
                     (l as any).deletedAt || null, 
                     l.syncStatus || 'synced',
                     l.imageUrls && l.imageUrls.length > 0 ? JSON.stringify(l.imageUrls) : (l.imageUrl || null)
                 ]);

                 // 2. Save Sets
                 if (l.exercises) {
                     for (const ex of l.exercises) {
                         if (ex.logs) {
                             for (const s of ex.logs) {
                                 if (!s) continue; // Defensive check
                                 await db.runAsync(`
                                    INSERT OR REPLACE INTO set_logs (id, workout_log_id, exercise_id, exercise_name, weight, reps, reps_left, reps_right, distance, duration, bodyweight, rpe, equipment, attachment, created_at, sync_status)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                 `, [
                                     s.id || uuid.v4(),
                                     l.id,
                                     ex.id ?? null,
                                     ex.name ?? null,
                                     s.weight ?? null,
                                     s.reps ?? null,
                                     s.reps_left ?? null,
                                     s.reps_right ?? null,
                                     s.distance ?? null,
                                     s.duration ?? null,
                                     s.bodyweight ? 1 : 0,
                                     s.rpe ?? null,
                                     ex.equipment ?? null,
                                     ex.attachment ?? null,
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

    deleteHistory: async (id: string): Promise<void> => {
        if (!id) {
            console.warn("[DataRepository] deleteHistory called with missing id");
            return;
        }
        const db = await getDb();
        await db.runAsync(`
            UPDATE workout_logs
            SET deleted_at = ?, sync_status = 'pending', updated_at = ?
            WHERE id = ?
        `, [Date.now(), Date.now(), id]);
    },

    saveLog: async (log: Omit<LocalWorkoutLog, 'updatedAt' | 'syncStatus' | 'id'> & { id?: string }): Promise<LocalWorkoutLog> => {
        if (!log) throw new Error("saveLog called with undefined log");
        const id = log.id || (uuid.v4() as string);
        const now = Date.now();
        const timestamp = new Date().toISOString(); 
        const db = await getDb();

        await db.withTransactionAsync(async () => {
            // 1. Save Header
            await db.runAsync(`
                INSERT OR REPLACE INTO workout_logs (id, user_id, workout_date, workout_name, duration, note, created_at, updated_at, deleted_at, sync_status, image_url, healthkit_uuid, avg_heart_rate, max_heart_rate, calories, distance, elevation_gain, route, metrics_source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                log.userId || null,
                log.date || timestamp,
                log.name || null,
                log.duration || null,
                log.note || null,
                timestamp,
                now,
                log.imageUrls && log.imageUrls.length > 0 ? JSON.stringify(log.imageUrls) : (log.imageUrl || null),
                log.healthkitUuid || null,
                log.avgHeartRate ?? null,
                log.maxHeartRate ?? null,
                log.calories ?? null,
                log.distance ?? null,
                log.elevationGain ?? null,
                log.route && log.route.length > 0 ? JSON.stringify(log.route) : null,
                log.metricsSource || null
            ]);

            // 2. Save Sets
            if (log.exercises) {
                for (const ex of log.exercises) {
                    if (ex.logs) {
                        for (const s of ex.logs) {
                            await db.runAsync(`
                                INSERT INTO set_logs (id, workout_log_id, exercise_id, exercise_name, weight, reps, reps_left, reps_right, distance, duration, bodyweight, rpe, equipment, attachment, created_at, sync_status)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                            `, [
                                s.id || uuid.v4(),
                                id,
                                ex.id ?? null,
                                ex.name ?? null,
                                s.weight ?? null,
                                s.reps ?? null,
                                s.reps_left ?? null,
                                s.reps_right ?? null,
                                s.distance ?? null,
                                s.duration ?? null,
                                s.bodyweight ? 1 : 0,
                                s.rpe ?? null,
                                ex.equipment ?? null,
                                ex.attachment ?? null,
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

    hasWorkoutLogWithHealthKitUuid: async (healthkitUuid: string): Promise<boolean> => {
        const db = await getDb();
        const row = await db.getFirstAsync<{ id: string }>(
            `SELECT id FROM workout_logs WHERE healthkit_uuid = ? AND deleted_at IS NULL LIMIT 1`,
            [healthkitUuid]
        );
        return !!row;
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

    seedDefaultExercises: async (): Promise<void> => {
        const db = await getDb();
        console.log(`Seeding ${ExerciseDefaultData.length} default exercises in chunks...`);
        
        // Use chunks to avoid overly large transactions and potential lock/memory issues
        const CHUNK_SIZE = 50;
        for (let i = 0; i < ExerciseDefaultData.length; i += CHUNK_SIZE) {
            const chunk = ExerciseDefaultData.slice(i, i + CHUNK_SIZE);
            console.log(`  Seeding chunk ${Math.floor(i / CHUNK_SIZE) + 1}...`);
            
            await db.withTransactionAsync(async () => {
                for (const exData of chunk) {
                    const ex = exData as any;
                    await db.runAsync(`
                        INSERT OR REPLACE INTO exercises (id, name, muscle_groups, properties, description, progression_id, difficulty, is_active_progression, next_variations, tips, instructions, equipment, movement_type, attachment, created_at, updated_at, sync_status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
                    `, [
                        ex.id, 
                        ex.name,
                        JSON.stringify([ex.muscle_group, ...(ex.secondary_muscles || [])].filter(Boolean)), 
                        ex.type,
                        ex.description || null,
                        ex.progressionId || null,
                        ex.difficulty !== undefined ? ex.difficulty : (ex.progressionLevel || null),
                        ex.isActiveProgression ? 1 : 0,
                        ex.nextVariations ? JSON.stringify(ex.nextVariations) : JSON.stringify([]),
                        ex.tips ? JSON.stringify(ex.tips) : null,
                        ex.instructions ? JSON.stringify(ex.instructions) : null,
                        ex.equipment ? (Array.isArray(ex.equipment) ? JSON.stringify(ex.equipment) : JSON.stringify([ex.equipment])) : null,
                        ex.movementType || null,
                        ex.attachment || null,
                        new Date().toISOString(),
                        Date.now()
                    ]);
                }
            });
        }
        console.log("Seeding complete.");
    },

    getStoredExerciseVersion: async (): Promise<number> => {
        try {
            const version = await AsyncStorage.getItem('exercise_data_version');
            return version ? parseInt(version, 10) : 0;
        } catch (e) {
            console.error("Failed to get stored exercise version", e);
            return 0;
        }
    },

    setStoredExerciseVersion: async (version: number): Promise<void> => {
        try {
            await AsyncStorage.setItem('exercise_data_version', version.toString());
        } catch (e) {
            console.error("Failed to set stored exercise version", e);
        }
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
        const result = await db.getAllAsync<any>('SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC');
        return result.map(row => {
            let eq = row.equipment;
            if (eq && typeof eq === 'string' && eq.startsWith('[')) {
                try {
                    eq = JSON.parse(eq);
                } catch {}
            }
            if (eq && !Array.isArray(eq)) {
                eq = [eq];
            }
            if (!eq) {
                eq = [inferEquipment(row.name)];
            }
            const mov = row.movement_type || inferMovementType(row.name, Array.isArray(eq) ? eq[0] : eq);
            const ang = row.angle || inferAngle(row.name);
            const att = row.attachment || inferAttachment(row.name);
            return {
                ...row,
                id: row.id,
                name: row.name,
                muscle_groups: row.muscle_groups ? JSON.parse(row.muscle_groups) : [],
                properties: row.properties ? row.properties.split(',').map((s: string) => s.trim()) : [],
                description: row.description, // Added description
                nextVariations: row.next_variations ? JSON.parse(row.next_variations) : [],
                tips: row.tips ? JSON.parse(row.tips) : [],
                instructions: (() => {
                    try {
                        const parsed = row.instructions ? JSON.parse(row.instructions) : [];
                        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                    } catch {}
                    const muscleGroups = row.muscle_groups ? JSON.parse(row.muscle_groups) : [];
                    return generateDefaultInstructions(row.name, row.description || '', muscleGroups);
                })(),
                // Legacy schema support for graceful fallback
                progressionId: row.progression_id,
                difficulty: row.difficulty || row.progression_level,
                isActiveProgression: row.is_active_progression === 1,
                equipment: eq,
                movementType: mov,
                angle: ang,
                attachment: att
            };
        });
    },

    deleteExercise: async (id: string): Promise<void> => {
        const db = await getDb();
        await db.runAsync(`
            UPDATE exercises
            SET deleted_at = ?, sync_status = 'pending', updated_at = ?
            WHERE id = ?
        `, [Date.now(), Date.now(), id]);
    },

    saveExercises: async (exercises: any[]): Promise<void> => {
        if (exercises.length === 0) return;
        const db = await getDb();
        const now = Date.now();
        
        // Bulk insert using transaction
        await db.withTransactionAsync(async () => {
            for (const ex of exercises) {
                await db.runAsync(`
                    INSERT OR REPLACE INTO exercises (id, name, muscle_groups, properties, description, progression_id, difficulty, is_active_progression, next_variations, tips, instructions, equipment, movement_type, attachment, created_at, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
                `, [
                    ex.id || ex.exercise_id, 
                    ex.name || ex.exercise_name,
                    JSON.stringify(ex.muscle_groups || ex.exercise_muscle_groups || []),
                    Array.isArray(ex.properties) ? ex.properties.join(',') : (ex.properties || ""), 
                    ex.description || null, // Added description
                    ex.progressionId || null,
                    ex.difficulty || null,
                    ex.isActiveProgression ? 1 : 0,
                    ex.nextVariations ? JSON.stringify(ex.nextVariations) : JSON.stringify([]),
                    ex.tips ? JSON.stringify(ex.tips) : null,
                    ex.instructions ? JSON.stringify(ex.instructions) : null,
                    ex.equipment || null,
                    ex.movementType || null,
                    ex.attachment || null,
                    new Date().toISOString(),
                    now
                ]);
            }
        });
    },

    getProgressPictures: async (userId: string | null): Promise<any[]> => {
        const db = await getDb();
        const rows = await db.getAllAsync<any>(
            'SELECT * FROM progress_pictures WHERE user_id = ? ORDER BY date DESC, created_at DESC',
            [userId || 'guest']
        );
        return rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            imageUri: r.image_uri,
            date: r.date,
            notes: r.notes || "",
            muscleGroups: r.muscle_groups ? JSON.parse(r.muscle_groups) : null,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            syncStatus: r.sync_status
        }));
    },

    saveProgressPicture: async (userId: string | null, pic: { id: string, imageUri: string, date: string, notes: string }): Promise<void> => {
        const db = await getDb();
        const now = Date.now();
        const timestamp = new Date().toISOString();
        await db.runAsync(`
            INSERT OR REPLACE INTO progress_pictures (id, user_id, image_uri, date, notes, created_at, updated_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pic.id,
            userId || 'guest',
            pic.imageUri,
            pic.date,
            pic.notes,
            timestamp,
            now,
            'pending'
        ]);
    },

    updateProgressPictureMuscleGroups: async (id: string, muscleGroups: unknown): Promise<void> => {
        const db = await getDb();
        await db.runAsync(
            'UPDATE progress_pictures SET muscle_groups = ?, updated_at = ? WHERE id = ?',
            [JSON.stringify(muscleGroups), Date.now(), id]
        );
    },

    deleteProgressPicture: async (id: string): Promise<void> => {
        const db = await getDb();
        await db.runAsync('DELETE FROM progress_pictures WHERE id = ?', [id]);
    },
    
    clearAllLocalData: async (): Promise<void> => {
        const db = await getDb();
        await db.withTransactionAsync(async () => {
            await db.runAsync('DELETE FROM workouts');
            await db.runAsync('DELETE FROM workout_logs');
            await db.runAsync('DELETE FROM set_logs');
            await db.runAsync('DELETE FROM body_measurements');
            await db.runAsync('DELETE FROM routines');
            await db.runAsync('DELETE FROM progress_pictures');
            
            // Delete custom exercises (those not in default data)
            // We use NOT IN clause.
            // Be careful with too many parameters if default data grows huge, but <900 is fine.
            const defaultIds = ExerciseDefaultData.map(e => e.id);
            if (defaultIds.length > 0) {
                const placeholders = defaultIds.map(() => '?').join(',');
                await db.runAsync(
                    `DELETE FROM exercises WHERE id NOT IN (${placeholders})`,
                    defaultIds
                );
            }
        });
    },




};
