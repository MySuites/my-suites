// hooks/useSyncService.ts
// Sync temporarily disabled while Supabase is removed.
// Returns a no-op interface so WorkoutManagerProvider compiles unchanged.

export function useSyncService() {
    return {
        isSyncing: false,
        lastSyncedAt: null as Date | null,
        sync: async () => {},
    };
}
