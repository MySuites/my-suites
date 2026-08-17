import { useMemo } from 'react';
import { WorkoutLog, Exercise } from '../../providers/WorkoutManagerProvider';

const SUPPORTED_MUSCLES = [
  'Chest', 'Shoulders', 'Biceps', 'Forearms', 'Abdominals', 'Quadriceps',
  'Adductors', 'Tibialis', 'Traps', 'Lats', 'Lower back', 'Triceps', 'Glutes', 'Hamstrings', 'Calves'
];

function mapMuscleName(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === 'pectoral' || n === 'pectorals' || n === 'chest') return 'Chest';
  if (n === 'deltoid' || n === 'deltoids' || n === 'shoulders' || n === 'shoulder') return 'Shoulders';
  if (n === 'bicep' || n === 'biceps') return 'Biceps';
  if (n === 'tricep' || n === 'triceps') return 'Triceps';
  if (n === 'forearm' || n === 'forearms') return 'Forearms';
  if (n === 'abdominal' || n === 'abdominals' || n === 'abs') return 'Abdominals';
  if (n === 'quadriceps' || n === 'quads' || n === 'quad') return 'Quadriceps';
  if (n === 'adductors' || n === 'adductor' || n === 'adduction') return 'Adductors';
  if (n === 'shin' || n === 'shins' || n === 'tibialis') return 'Tibialis';
  if (n === 'trap' || n === 'traps' || n === 'trapezius') return 'Traps';
  if (n === 'lat' || n === 'lats' || n === 'latissimus dorsi') return 'Lats';
  if (n === 'lower back' || n === 'erectors') return 'Lower back';
  if (n === 'glute' || n === 'glutes' || n === 'gluteus') return 'Glutes';
  if (n === 'hamstring' || n === 'hamstrings') return 'Hamstrings';
  if (n === 'calf' || n === 'calves') return 'Calves';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function useMuscleVolumes(workoutHistory: WorkoutLog[] | undefined) {
  return useMemo(() => {
    const results: Record<string, { muscle: string; sets: number; exercises: string[] }> = {};
    SUPPORTED_MUSCLES.forEach(m => {
      results[m] = { muscle: m, sets: 0, exercises: [] };
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logsInLast7Days = (workoutHistory || []).filter((log: WorkoutLog) => {
      if (!log.workoutDate) return false;
      try {
        const d = new Date(log.workoutDate);
        return d >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    logsInLast7Days.forEach((log: WorkoutLog) => {
      if (!log.exercises) return;
      log.exercises.forEach((ex: Exercise) => {
        const setsCount = ex.logs?.length || ex.completedSets || 0;
        if (setsCount === 0) return;

        const mGroups = ex.muscleGroups || [];
        if (mGroups.length === 0) return;

        // 1. Primary Muscle (1.0 weight)
        const primary = mapMuscleName(mGroups[0]);
        if (results[primary]) {
          results[primary].sets += setsCount;
          if (!results[primary].exercises.includes(ex.name)) {
            results[primary].exercises.push(ex.name);
          }
        }

        // 2. Secondary Muscles (0.5 weight)
        mGroups.slice(1).forEach((sec: string) => {
          const secondary = mapMuscleName(sec);
          if (results[secondary]) {
            results[secondary].sets += Math.round(setsCount * 0.5 * 10) / 10;
            if (!results[secondary].exercises.includes(ex.name)) {
              results[secondary].exercises.push(ex.name);
            }
          }
        });
      });
    });

    Object.keys(results).forEach((k: string) => {
      results[k].sets = Math.round(results[k].sets * 10) / 10;
    });

    return results;
  }, [workoutHistory]);
}
