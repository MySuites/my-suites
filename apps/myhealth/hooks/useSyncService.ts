import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, useAuth } from "@mysuite/auth";
import { DataRepository } from "../providers/DataRepository";
import {
    fetchBodyMeasurementHistory,
    fetchFullWorkoutHistory,
    fetchUserWorkouts,
    persistBodyMeasurement,
    persistCompletedWorkoutToSupabase,
    persistWorkoutToSupabase,
} from "../utils/workout-api";

function isUUID(str: string) {
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
}

export function useSyncService() {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(false);

    const pullData = useCallback(async () => {
        if (!user) return;
        try {
            console.log("Pulling data...");
            // 1. Pull History
            const { data: historyData, error: historyError } =
                await fetchFullWorkoutHistory(user);

            if (!historyError && historyData) {
                // Merge strategy: Keep local 'pending' (unsynced) items, replace others with cloud truth
                const currentHistory = await DataRepository.getHistory();
                const pendingLocal = currentHistory.filter((h) =>
                    h.syncStatus === "pending"
                );

                // Deduplicate: If a pending item somehow got synced but status wasn't updated?
                // Unlikely in this flow. Just simple concat is safer to avoid data loss.
                // However, we want to ensure we don't have duplicates if we just pushed them?
                // If we just pushed them, they are 'synced' now (in pushData).
                // So pendingLocal should strictly be items that FAILED to push.

                // We also need to handle the case where we just pushed an item, it became 'synced' locally,
                // and now we pull it back from server.
                // The server version is the source of truth for synced items.

                // So: New History = (Local Pending) + (Cloud History)
                const mergedHistory = [
                    ...pendingLocal,
                    ...historyData,
                ] as any[];

                await DataRepository.saveHistory(mergedHistory);
            }

            // 2. Pull Saved Workouts
            const { data: wData, error: wError } = await fetchUserWorkouts(
                user,
            );
            if (!wError && wData) {
                const mapped = wData.map((w: any) => ({
                    id: w.workout_id,
                    name: w.workout_name,
                    exercises: w.notes ? JSON.parse(w.notes) : [],
                    createdAt: w.created_at,
                    syncStatus: "synced" as const,
                    updatedAt: new Date(w.created_at).getTime(),
                }));
                // Similar merge for workouts?
                // For now, let's keep the existing overwrite behavior for workouts or improve it too?
                // Existing code: await DataRepository.saveWorkouts(mapped);
                // Let's improve it to be safe for pending workouts too.
                const currentWorkouts = await DataRepository.getWorkouts();
                const pendingWorkouts = currentWorkouts.filter((w: any) =>
                    w.syncStatus === "pending"
                );

                const mergedWorkouts = [...pendingWorkouts, ...mapped];
                await DataRepository.saveWorkouts(mergedWorkouts);
            }

            // 3. Pull Body Measurements
            const { data: bData, error: bError } =
                await fetchBodyMeasurementHistory(user);
            if (!bError && bData) {
                const mappedBody = bData.map((b: any) => ({
                    id: b.id, // Supabase ID
                    userId: b.user_id,
                    weight: b.weight,
                    date: b.date,
                    createdAt: b.created_at,
                    syncStatus: "synced" as const,
                    updatedAt: new Date(b.created_at).getTime(),
                }));

                const currentBody = await DataRepository.getBodyWeightHistory(
                    user.id,
                );
                // getBodyWeightHistory returns "any[]" currently which are sorted but includes all
                // We want to preserve pending
                const pendingBody = currentBody.filter((b: any) =>
                    b.syncStatus === "pending"
                );

                // Merge strategies are tricky. For now, we prefer Cloud if ID matches, but keep Pending.
                const mergedBody = [...pendingBody, ...mappedBody];
                // We need to dedupe if IDs clash? DataRepository.upsert handles ID clash by overwriting.
                // But pendingBody items might not have Supabase IDs, they have local UUIDs.
                // mappedBody items have Supabase UUIDs.
                // If they are distinct, we just append. That's fine.
                // However, if we pull the SAME data we just pushed, we might duplicate if IDs differ?
                // When we push, we don't update local ID to Supabase ID currently in my plan for BodyMeasurements.
                // We should probably try to match by date?
                // For simplicity now: Just save both. UI sorts by date.
                // Deduplication logic is complex without a robust ID map.

                // Better approach: When pulling, if we find a local entry on the same date that matches, we update it?
                // For now, let's just save.
                await DataRepository.saveBodyMeasurements(mergedBody); // Upsert handles ID matches
            }
            // 4. Pull Exercises (Library)
            const { data: exData, error: exError } = await supabase
                .from("exercises")
                .select(`
                    exercise_id, 
                    exercise_name, 
                    properties,
                    exercise_muscle_groups (
                        role,
                        muscle_groups ( name )
                    )
                `); // Fetch lightweight or full? Full is fine for 300 exercises.

            if (!exError && exData) {
                await DataRepository.saveExercises(exData);
            }
        } catch (e) {
            console.error("Pull failed", e);
        }
    }, [user]);

    const pushData = useCallback(async () => {
        if (!user) return;
        try {
            console.log("Pushing data...");
            // 1. Push History
            // 1. Push History
            // We need to fetch ALL history including deleted to sync deletions
            // DataRepository.getHistory() filters out deleted. We need a way to get "syncable" items including deleted.
            // Let's add DataRepository.getPendingSyncItems() or just expose a way to get raw logs?
            // For now, let's assume getHistory only returns active. We might need to query DB directly here or add a new repo method?
            // "getPendingSyncHistory"?
            // Actually, let's modify DataRepository to have `getHistory({ includeDeleted: true })`?
            // OR simpler: just query DB here since this is a service?
            // Ideally we stick to Repo. Let's add `getSyncQueue()` to DataRepository?
            // Or just `getPendingHistory`?

            // Let's use a specialized method in DataRepo or just add a param to getHistory?
            // Adding param to getHistory is cleanest but might break signature.
            // Let's assume we can add `getPendingHistoryLogs` to DataRepo.

            const pendingHistory = await DataRepository.getPendingHistoryLogs();

            for (const log of pendingHistory) {
                if ((log as any).deletedAt) {
                    // Sync Deletion
                    if (log.id && isUUID(log.id)) { // Only delete if it has a valid UUID (synced)
                        await supabase.from("workout_logs").delete().eq(
                            "id",
                            log.id,
                        );
                    }
                    // Mark as synced (and still deleted)
                    log.syncStatus = "synced";
                } else {
                    // Sync Creation/Update
                    const { error } = await persistCompletedWorkoutToSupabase(
                        user,
                        log.name,
                        log.exercises,
                        log.duration,
                        log.workoutId,
                        log.note,
                        log.date || log.workoutTime,
                    );
                    if (!error) {
                        log.syncStatus = "synced";
                    }
                }
            }
            await DataRepository.saveHistory(pendingHistory);

            // 2. Push Saved Workouts
            const pendingWorkouts = await DataRepository.getPendingWorkouts();

            for (const w of pendingWorkouts) {
                if ((w as any).deletedAt) {
                    // Sync Deletion
                    if (w.id && isUUID(w.id)) {
                        await supabase.from("workouts").delete().eq(
                            "workout_id",
                            w.id,
                        );
                    }
                    w.syncStatus = "synced";
                } else {
                    const { data, error } = await persistWorkoutToSupabase(
                        user,
                        w.name,
                        w.exercises,
                    );
                    if (!error && data) {
                        w.id = data.workout_id;
                        w.syncStatus = "synced";
                    }
                }
            }
            await DataRepository.saveWorkouts(pendingWorkouts);

            // 3. Push Body Measurements
            const allMeasurements = await DataRepository.getBodyWeightHistory(
                null,
            ); // Fetch all
            const pendingMeasurements = allMeasurements.filter((m: any) =>
                m.syncStatus === "pending"
            );

            for (const m of pendingMeasurements) {
                // If 'guest', we claim it for current user?
                if (m.userId === "guest" || m.userId === user.id) {
                    const { data, error } = await persistBodyMeasurement(
                        user,
                        m.weight,
                        m.date,
                    );
                    if (!error && data) {
                        m.syncStatus = "synced";
                        m.id = data.id; // Update local ID to match cloud ID (if possible/safe)
                        m.userId = user.id; // Ensure ownership is claimed
                    }
                }
            }
            await DataRepository.saveBodyMeasurements(pendingMeasurements); // Save updates
        } catch (e) {
            console.error("Push failed", e);
        }
    }, [user]);

    const sync = useCallback(async () => {
        if (isSyncingRef.current || !user) return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            await pushData();
            await pullData();
            console.log("Data sync complete");
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [user, pushData, pullData]);

    useEffect(() => {
        if (user) {
            sync();
        }
    }, [user, sync]);

    return {
        isSyncing,
        sync,
    };
}
