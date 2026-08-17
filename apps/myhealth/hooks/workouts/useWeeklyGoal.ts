import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { storage } from '../../utils/storage';
import { WEEKLY_GOAL_STORAGE_KEY, DEFAULT_WEEKLY_GOAL } from '../../utils/weeklyGoal';
import { getCurrentWeekRange } from '../../components/dashboard/WeeklyCompletionRing';
import { WorkoutLog } from '../../providers/WorkoutManagerProvider';

export function useWeeklyGoal(workoutHistory: WorkoutLog[] | undefined) {
  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);

  const loadGoal = useCallback(() => {
    storage.getItem<number>(WEEKLY_GOAL_STORAGE_KEY).then((goal) => {
      if (goal !== null) setWeeklyGoal(goal);
    });
  }, []);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  // Re-check the goal whenever the screen regains focus, so a change made in
  // Settings shows up immediately without needing to reload the whole app.
  useFocusEffect(useCallback(() => {
    loadGoal();
  }, [loadGoal]));

  const weeklyCompletedCount = useMemo(() => {
    const { start, end } = getCurrentWeekRange();
    return (workoutHistory || []).filter((log: WorkoutLog) => {
      if (!log.workoutDate) return false;
      const d = new Date(log.workoutDate);
      return d >= start && d < end;
    }).length;
  }, [workoutHistory]);

  return { weeklyGoal, weeklyCompletedCount };
}
