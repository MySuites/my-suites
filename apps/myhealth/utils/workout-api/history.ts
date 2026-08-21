import { DataRepository } from "../../providers/DataRepository";

// Local-First: Always fetch from local DB
export async function fetchWorkoutHistory(user: any) {
    // We ignore the 'user' arg for fetching because DataRepository is the source of truth for the active device
    // But we can filter if needed. For now, assuming single-user local DB or SyncService handles the scope.

    try {
        const history = await DataRepository.getHistory();
        // If user is provided, we could filter, but typically SyncService ensures local DB only has relevant data
        // const filtered = user ? history.filter(h => h.userId === user.id) : history;
        return { data: history, error: null };
    } catch (e) {
        console.error("Local history fetch failed", e);
        return { data: [], error: e };
    }
}

export async function fetchWorkoutLogDetails(user: any, logId: string) {
    // Local-First: Always use DataRepository
    try {
        const history = await DataRepository.getHistory();
        const log = history.find((h) => h.id === logId);

        if (!log) return { data: [], error: "Workout log not found locally" };

        const mappedData = log.exercises.map((ex, index) => ({
            name: ex.name,
            position: index,
            attachment: ex.attachment,
            equipment: ex.equipment,
            movementType: ex.movementType,
            sets: ex.logs?.map((setLog, setIndex) => ({
                setNumber: setIndex + 1,
                details: {
                    ...setLog,
                    exercise_name: ex.name,
                    exercise_id: ex.id,
                },
                notes: null, // Local logs inside exercise don't store per-set notes currently
            })) || [],
            properties: ex.properties || [],
        }));

        return { data: mappedData, error: null };
    } catch (err: any) {
        console.warn("fetchWorkoutLogDetails failed", err);
        return { data: [], error: err.message || "Failed to load details" };
    }
}

export async function fetchFullWorkoutHistory(user: any) {
    // Just alias to the main local fetch
    return fetchWorkoutHistory(user);
}
