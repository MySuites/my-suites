import { useCallback, useEffect, useMemo, useState } from "react";
import { createSequenceItem } from "../../utils/workout-logic";
import { Routine } from "../../types";

export function useRoutineManager(routines: any[]) {
    // Active Routine progress state
    const [activeRoutine, setActiveRoutine] = useState<
        {
            id: string;
            dayIndex: number; // 0-based index in sequence
            lastUpdatedDate?: string;
            lastCompletedDate?: string;
        } | null
    >(null);

    function startActiveRoutine(routineId: string) {
        setActiveRoutine({
            id: routineId,
            dayIndex: 0,
            lastUpdatedDate: new Date().toISOString(),
        });
    }

    function setActiveRoutineIndex(index: number) {
        setActiveRoutine((prev) =>
            prev
                ? { ...prev, dayIndex: index, lastUpdatedDate: new Date().toISOString(), lastCompletedDate: undefined }
                : null
        );
    }

    const markRoutineDayComplete = useCallback(() => {
        if (!activeRoutine) return;

        // 1. Mark today as complete
        setActiveRoutine((prev) =>
            prev
                ? ({
                    ...prev,
                    lastCompletedDate: new Date().toISOString(),
                })
                : null
        );
    }, [activeRoutine]);

    // Auto-advance routine day if the date has changed
    useEffect(() => {
        if (!activeRoutine) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Use lastUpdatedDate as the source of truth for "when were we last on this dayIndex?"
        // Fallback for migration: use lastCompletedDate or today if both are missing
        const lastUpdateStr = activeRoutine.lastUpdatedDate || activeRoutine.lastCompletedDate;
        const lastDate = lastUpdateStr ? new Date(lastUpdateStr) : new Date();
        lastDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > 0) {
            // Find routine to know length for wrapping
            const routine = routines.find((r) => r.id === activeRoutine.id);
            const sequenceLength = routine?.sequence?.length || 1;

            setActiveRoutine((prev) =>
                prev
                    ? ({
                        ...prev,
                        dayIndex: (prev.dayIndex + daysDiff) % sequenceLength,
                        lastUpdatedDate: today.toISOString(),
                        lastCompletedDate: undefined, // Clear completion for the new day
                    })
                    : null
            );
        } else if (!activeRoutine.lastUpdatedDate) {
            // If the field is missing (migration), initialize it
            setActiveRoutine(prev => prev ? { ...prev, lastUpdatedDate: today.toISOString() } : null);
        }
    }, [activeRoutine?.id, activeRoutine?.lastUpdatedDate, routines]);

    function clearActiveRoutine() {
        setActiveRoutine(null);
    }

    const setRoutineState = useCallback((newState: typeof activeRoutine) => {
        setActiveRoutine(newState);
    }, []);

    return {
        activeRoutine,
        startActiveRoutine,
        setActiveRoutineIndex,
        markRoutineDayComplete,
        clearActiveRoutine,
        setRoutineState, // for persistence loading
    };
}

export const useRoutineDraft = (initialSequence: any[] = []) => {
    const [routineSequence, setRoutineSequence] = useState<any[]>(
        initialSequence,
    );

    function addDay(item: any) {
        const newItem = createSequenceItem(item);
        setRoutineSequence((s) => [...s, newItem]);
    }

    function removeDay(id: string) {
        setRoutineSequence((s) => s.filter((x) => x.id !== id));
    }

    return {
        routineSequence,
        setRoutineSequence,
        addDay,
        removeDay,
    };
};

export const useRoutineTimeline = (
    activeRoutineObj: Routine | undefined,
    dayIndex: number,
    routineViewMode: "next_3" | "next_7" | "week",
) => {
    return useMemo(() => {
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
