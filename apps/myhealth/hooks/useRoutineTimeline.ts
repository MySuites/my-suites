import React from "react";
import { Routine } from "../types";

export const useRoutineTimeline = (
    activeRoutineObj: Routine | undefined,
    dayIndex: number,
    routineViewMode: "next_3" | "next_7" | "week",
) => {
    return React.useMemo(() => {
        if (!activeRoutineObj?.sequence) return [];
        const seq = activeRoutineObj.sequence;
        const total = seq.length;
        if (total === 0) return [];

        const result = [];
        // Show up to 7 visible days (skipping future rest days)
        let i = 0;

        // Limits based on mode
        const countLimit = routineViewMode === "next_3"
            ? 3
            : routineViewMode === "next_7"
            ? 7
            : 7; // Week uses day limit, not count limit primarily
        const dayLimit = routineViewMode === "week" ? 7 : 30; // Next 3/7 look ahead further

        // Safety break at 30 days to prevent infinite loops if routine is weird
        while (result.length < countLimit && i < dayLimit) {
            const index = (dayIndex + i) % total;
            const item = seq[index];

            // Allow today (i=0) even if rest, otherwise skip rest days
            if (i === 0 || item.type !== "rest") {
                const d = new Date();
                d.setDate(d.getDate() + i);
                result.push({
                    ...item,
                    originalIndex: index,
                    date: d,
                });
            }
            i++;
        }
        return result;
    }, [activeRoutineObj, dayIndex, routineViewMode]);
};
