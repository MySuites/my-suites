import { useEffect, useMemo, useState } from "react";
import { fetchExerciseStats } from "../../providers/WorkoutManagerProvider";

export const useExerciseStats = (user: any, exercise: any) => {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(true);
    const [debugStr, setDebugStr] = useState<string>("");
    const [selectedMetric, setSelectedMetric] = useState<
        "weight" | "reps" | "duration" | "distance"
    >("weight");

    const availableMetrics = useMemo(() => {
        if (!exercise || (!exercise.properties && !exercise.rawType)) return [];
        const props = exercise.properties ||
            (Array.isArray(exercise.rawType)
                ? exercise.rawType
                : [exercise.rawType]);
        const metrics: ("weight" | "reps" | "duration" | "distance")[] = [];
        if (Array.isArray(props)) {
            props.forEach((p: string) => {
                const lower = String(p).toLowerCase();
                if (
                    (lower.includes("weight") &&
                        !lower.includes("bodyweight")) ||
                    lower.includes("weighted")
                ) metrics.push("weight");
                if (lower.includes("reps")) metrics.push("reps");
                if (lower.includes("duration") || lower.includes("time")) {
                    metrics.push("duration");
                }
                if (lower.includes("distance")) metrics.push("distance");
            });
        }
        return Array.from(new Set(metrics));
    }, [exercise]);

    useEffect(() => {
        if (
            availableMetrics.length > 0 &&
            !availableMetrics.includes(selectedMetric)
        ) {
            setSelectedMetric(availableMetrics[0]);
        }
    }, [availableMetrics, selectedMetric]);

    useEffect(() => {
        let isMounted = true;
        async function loadStats() {
            if (
                exercise?.id && availableMetrics.length > 0 &&
                availableMetrics.includes(selectedMetric)
            ) {
                try {
                    // Reset loading state when metric changes to show loading indicator
                    setLoadingChart(true);
                    const response = await fetchExerciseStats(
                        user,
                        exercise.id,
                        selectedMetric,
                    );
                    if (isMounted && response.data) {
                        setChartData(response.data);
                        setDebugStr(response.debugLogStr || "");
                        setLoadingChart(false);
                    }
                } catch (e) {
                    console.error("Fetch error", e);
                    if (isMounted) setLoadingChart(false);
                }
            } else {
                if (isMounted) setLoadingChart(false);
            }
        }
        loadStats();
        return () => {
            isMounted = false;
        };
    }, [exercise, user, selectedMetric, availableMetrics]);

    return {
        chartData,
        loadingChart,
        selectedMetric,
        setSelectedMetric,
        availableMetrics,
        debugStr
    };
};
