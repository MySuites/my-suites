import { useState, useMemo } from 'react';
import { DateRange } from '../../components/ui/TimeSeriesChart';
import { WorkoutLog, Exercise, SetLog } from '../../providers/WorkoutManagerProvider';
import { getEffectiveSetWeight } from '../../utils/workout-logic';

export function useWorkoutVolumeTrend(workoutHistory: WorkoutLog[] | undefined) {
  const [selectedVolumeRange, setSelectedVolumeRange] = useState<DateRange>('Week');

  const { volumeHistoryData, rangeAverageVolume, rangeTotalVolume, rangeWorkoutCount } = useMemo(() => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return { volumeHistoryData: [], rangeAverageVolume: null, rangeTotalVolume: null, rangeWorkoutCount: 0 };
    }

    const rawVolumeLogs = workoutHistory.map((log: WorkoutLog) => {
      let totalVolume = 0;
      if (log.exercises) {
        log.exercises.forEach((ex: Exercise) => {
          if (ex.logs) {
            ex.logs.forEach((set: SetLog) => {
              const weight = getEffectiveSetWeight(set);
              const reps = parseInt(set.reps as any) || 0;
              totalVolume += (weight * reps);
            });
          }
        });
      }
      return {
        value: totalVolume,
        date: log.workoutDate,
      };
    });

    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (selectedVolumeRange === 'Week') {
      startDate.setDate(now.getDate() - 6);
    } else if (selectedVolumeRange === 'Month') {
      startDate.setDate(now.getDate() - 30);
    } else if (selectedVolumeRange === '6Month') {
      startDate.setDate(now.getDate() - 180);
    } else if (selectedVolumeRange === 'Year') {
      startDate.setDate(now.getDate() - 365);
    }

    const filtered = rawVolumeLogs.filter((item: { value: number; date: string }) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    const total = filtered.reduce((sum: number, item: { value: number; date: string }) => sum + item.value, 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;

    return {
      volumeHistoryData: rawVolumeLogs,
      rangeAverageVolume: count > 0 ? avg : null,
      rangeTotalVolume: count > 0 ? total : null,
      rangeWorkoutCount: count,
    };
  }, [workoutHistory, selectedVolumeRange]);

  return {
    volumeHistoryData,
    rangeAverageVolume,
    rangeTotalVolume,
    rangeWorkoutCount,
    selectedVolumeRange,
    setSelectedVolumeRange,
  };
}
