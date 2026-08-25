import ExerciseDefaultData, {
    Groups,
} from "../../assets/data/default-exercises";
import { MUSCLE_GROUPS } from "../../assets/data/muscle-groups";
import { DataRepository, inferAngle, inferAttachment } from "../../providers/DataRepository";

// Epley formula — the most common e1RM estimate, accurate for the
// low-to-moderate rep ranges (roughly 1-12) that strength sets fall in.
// Returns null for inputs that can't produce a meaningful estimate.
function estimateOneRepMax(weight: number, reps: number): number | null {
    if (!isFinite(weight) || !isFinite(reps) || weight <= 0 || reps <= 0) return null;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
}

export async function fetchExercises(user: any) {
    let data;

    // Always fetch from local DB (which is synced via useSyncService)
    const localExercises = await DataRepository.getExercises();

    // If local DB is empty (first run, no sync yet), fallback to default data?
    // Or just return what we have (empty) and let sync happen?
    // Best UX: If empty and user is Guest, use default data.
    // If empty and user is Auth, might be syncing... but we can't block.
    // Let's use localExercises if available.

    if (localExercises.length > 0) {
        data = localExercises;
    } else {
        // Fallback or Guest default
        // If we are fully local-first, we should populate DB with defaults on init?
        // OR just fallback to JSON here if DB is empty.
        data = ExerciseDefaultData.map((e: any) => ({
            id: e.id,
            name: e.name,
            properties: e.type,
            muscle_groups: [
                {
                    role: "primary",
                    muscle_groups: { name: e.muscle_group },
                },
                ...(e.secondary_muscles || []).map((m: string) => ({
                    role: "secondary",
                    muscle_groups: { name: m },
                })),
            ],
            nextVariations: e.nextVariations || [],
            progressionId: e.progressionId,
            difficulty: e.difficulty,
            isActiveProgression: e.isActiveProgression,
            equipment: e.equipment,
            movementType: e.movementType,
            angle: e.angle || inferAngle(e.name),
            attachment: e.attachment || inferAttachment(e.name),
            description: e.description,
            instructions: e.instructions,
            tips: e.tips
        }));
    }

    // Build a reverse lookup for groups once
    // Map<ExerciseID, GroupName>
    const groupLookup = new Map<string, string>();
    Object.entries(Groups || {}).forEach(
        ([groupName, groupExercises]: [string, any[]]) => {
            groupExercises.forEach((e) => {
                groupLookup.set(e.id, groupName);
            });
        },
    );

    const mapped = data.map((e: any) => {
        // Local DB has 'muscle_groups' which is array of { role, muscle_groups: { name } }
        // OR default data mapped above matches this.

        let firstMuscle = null;
        if (e.muscle_groups && e.muscle_groups.length > 0) {
            // Handle simple string array (Local DB format: ["Chest"])
            if (typeof e.muscle_groups[0] === "string") {
                firstMuscle = e.muscle_groups[0];
            } else {
                // Handle complex object (Supabase format: [{ role: 'primary', muscle_groups: { name: 'Chest' } }])
                const primary = e.muscle_groups.find((m: any) =>
                    m.role === "primary"
                );
                if (primary && primary.muscle_groups) {
                    firstMuscle = primary.muscle_groups.name;
                } else if (e.muscle_groups[0].muscle_groups) {
                    firstMuscle = e.muscle_groups[0].muscle_groups.name;
                }
            }
        }

        // Parse properties if array or string (Local DB returns string array, Default is string? checked above)
        // DataRepo.getExercises returns properties as string[] (split by comma).
        // DefaultJSON properties is string?
        // Supabase properties is string/array?
        // Let's be robust.

        let props = e.properties;
        // If it's the raw string from DB before mapping (wait, DataRepo maps it to array)
        // If it comes from DefaultData, it is string "Strength" etc.
        const id = e.id || e.exercise_id; // Local uses id, Supabase raw uses exercise_id

        return {
            id,
            name: e.name || e.exercise_name,
            category: firstMuscle || "General",
            muscle_groups: e.muscle_groups || [firstMuscle || "General"],
            group: groupLookup.get(id) || "Other",
            properties: Array.isArray(props)
                ? props
                : (typeof props === "string"
                    ? props.split(",").map((s) => s.trim())
                    : []),
            rawType: e.properties, // Keep raw if needed
            progressionId: e.progressionId,
            difficulty: e.difficulty,
            isActiveProgression: e.isActiveProgression,
            nextVariations: e.nextVariations || [],
            equipment: e.equipment,
            movementType: e.movementType,
            description: e.description,
            instructions: e.instructions,
            tips: e.tips,
            attachment: e.attachment
        };
    });

    return { data: mapped, error: null };
}

// Fetch all available muscle groups
export async function fetchMuscleGroups() {
    return { data: MUSCLE_GROUPS, error: null };
}

// Fetch stats for chart
export async function fetchExerciseStats(
    user: any,
    exerciseId: string,
    metric: "weight" | "reps" | "duration" | "distance" | "volume" | "max_volume" | "estimated_1rm" = "weight",
    preloaded?: { history?: any[]; exercises?: any[] },
) {
    // Local-First: Calculate from local history for ALL users (guest and auth).
    try {
        const history = preloaded?.history ?? await DataRepository.getHistory();
        const allExercises = preloaded?.exercises ?? await DataRepository.getExercises();
        const targetExercise = allExercises.find(e => e.id === exerciseId);
        const targetName = targetExercise?.name?.toLowerCase();

        const grouped = new Map();
        let debugLogStr = `Target: ${targetName || exerciseId}\n`;

        history.forEach((h: any) => {
            h.exercises.forEach((e: any) => {
                // Check if matches by ID or Name (robust matching)
                const logExId = e.id;
                const logExName = e.name?.toLowerCase();
                
                const isIdMatch = logExId === exerciseId;
                const isNameMatch = targetName && logExName === targetName;
                
                if ((isIdMatch || isNameMatch) && e.logs) {
                    const dateKey = h.date ? new Date(h.date).toDateString() : 'UnknownDate';
                    debugLogStr += `[Match ${dateKey} logs:${e.logs.length}] `;

                    e.logs.forEach((log: any) => {
                        let val = 0;
                        let valid = false;

                        // Check weight vs reps
                        let rawVal = null;
                        if (metric === "weight") rawVal = log.weight;
                        else if (metric === "reps") rawVal = log.reps;
                        else if (metric === "duration") rawVal = log.duration;
                        else if (metric === "distance") rawVal = log.distance;
                        else if (metric === "volume" || metric === "max_volume") {
                            rawVal = (parseFloat(log.weight) || 0) * (parseInt(log.reps) || 0);
                        } else if (metric === "estimated_1rm") {
                            rawVal = estimateOneRepMax(parseFloat(log.weight) || 0, parseInt(log.reps) || 0);
                        }

                        debugLogStr += `(${rawVal})`;

                        if (rawVal !== undefined && rawVal !== null) {
                            val = parseFloat(rawVal);
                            valid = !isNaN(val);
                        }

                        if (valid) {
                            if (!grouped.has(dateKey)) {
                                grouped.set(dateKey, {
                                    date: h.date,
                                    max: val,
                                    total: val,
                                    dataPointText: val.toString(),
                                });
                            } else {
                                const entry = grouped.get(dateKey);
                                if (val > entry.max) {
                                    entry.max = val;
                                    entry.dataPointText = val.toString();
                                }
                                entry.total += val;
                            }
                        }
                    });
                }
            });
        });

        const sorted = Array.from(grouped.values()).sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const chartData = sorted.map((item: any) => ({
            value: metric === "volume" ? item.total : item.max,
            label: new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            dataPointText: metric === "volume"
                ? Math.round(item.total).toString()
                : (metric === "max_volume" || metric === "estimated_1rm")
                    ? Math.round(item.max).toString()
                    : item.dataPointText,
        }));

        return { data: chartData, error: null, debugLogStr };
    } catch (e) {
        console.error("Local stats error", e);
        return { data: [], error: e, debugLogStr: "Error" };
    }
}

export async function fetchLastExercisePerformance(
    user: any,
    exerciseId: string,
    exerciseName?: string,
) {
    // Local-First: Calculate from local history for ALL users.
    try {
        const history = await DataRepository.getHistory();
        // Sort history desc by date
        const sortedHistory = [...history].sort((a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (const h of sortedHistory) {
            const ex = h.exercises.find((e: any) =>
                e.id === exerciseId || e.name === exerciseName
            );
            if (ex && ex.logs && ex.logs.length > 0) {
                // Found latest session
                const logs = ex.logs.map((log: any) => ({
                    ...log,
                    exercise_name: ex.name, // Ensure context if needed
                    exercise_id: ex.id,
                }));
                return { data: logs, error: null };
            }
        }
        return { data: null, error: "No previous performance found" };
    } catch (e) {
        return { data: null, error: e };
    }
}
// Average logged RPE per set index across the last few sessions of an
// exercise — feeds the progressive-overload suggestion so it can back off
// when recent sets have been grinding (high RPE) or push harder when recent
// sets have been easy (low RPE), instead of blindly adding a rep every time.
export async function fetchRecentSetRpeAverages(
    user: any,
    exerciseId: string,
    exerciseName?: string,
    sessionsToConsider: number = 3,
): Promise<Record<number, number>> {
    try {
        const history = await DataRepository.getHistory();
        const sortedHistory = [...history].sort((a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // setIndex -> collected RPE values from the most recent matching sessions
        const rpesByIndex: Record<number, number[]> = {};
        let sessionsSeen = 0;

        for (const h of sortedHistory) {
            const ex = h.exercises.find((e: any) =>
                e.id === exerciseId || e.name === exerciseName
            );
            if (!ex || !ex.logs || ex.logs.length === 0) continue;

            sessionsSeen++;
            ex.logs.forEach((log: any, idx: number) => {
                const rpe = parseFloat(log?.rpe);
                if (!isNaN(rpe)) {
                    if (!rpesByIndex[idx]) rpesByIndex[idx] = [];
                    rpesByIndex[idx].push(rpe);
                }
            });

            if (sessionsSeen >= sessionsToConsider) break;
        }

        const averages: Record<number, number> = {};
        Object.entries(rpesByIndex).forEach(([idx, values]) => {
            averages[parseInt(idx, 10)] = values.reduce((a, b) => a + b, 0) / values.length;
        });
        return averages;
    } catch (e) {
        return {};
    }
}

// Helper to get default properties for an exercise ID (to handle stale data)
export function getExerciseDefaultProperties(id: string): string[] {
    const def = ExerciseDefaultData.find((e: any) => e.id === id);
    if (def && def.type) {
        return def.type.split(",").map((s: string) => s.trim());
    }
    return [];
}
