import { useEffect, useState } from "react";
import { DataRepository } from "../../providers/DataRepository";
import { fetchExerciseStats } from "../../providers/WorkoutManagerProvider";
import { RANKED_LIFTS } from "../../utils/strengthStandards";

export interface LiftBest {
    exerciseId: string;
    bestEstimatedOneRepMax: number | null;
}

// All-time best estimated 1RM per "big three" lift, for strength ranking.
export const useStrengthRanks = (user: any) => {
    const [bests, setBests] = useState<LiftBest[]>(
        RANKED_LIFTS.map((l) => ({ exerciseId: l.exerciseId, bestEstimatedOneRepMax: null }))
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function load() {
            setIsLoading(true);
            // Load history + exercises once and share across all ranked lifts,
            // instead of each lift re-reading the full history from SQLite.
            const [history, exercises] = await Promise.all([
                DataRepository.getHistory(),
                DataRepository.getExercises(),
            ]);
            const results = await Promise.all(
                RANKED_LIFTS.map(async (lift) => {
                    try {
                        const response = await fetchExerciseStats(user, lift.exerciseId, "estimated_1rm", { history, exercises });
                        const values = (response.data || []).map((d: any) => d.value).filter((v: number) => isFinite(v) && v > 0);
                        const best = values.length > 0 ? Math.max(...values) : null;
                        return { exerciseId: lift.exerciseId, bestEstimatedOneRepMax: best };
                    } catch {
                        return { exerciseId: lift.exerciseId, bestEstimatedOneRepMax: null };
                    }
                })
            );
            if (isMounted) {
                setBests(results);
                setIsLoading(false);
            }
        }
        load();
        return () => {
            isMounted = false;
        };
    }, [user]);

    return { bests, isLoading };
};
