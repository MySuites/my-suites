import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, InteractionManager } from "react-native";
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@mysuite/auth';
import { RaisedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SettingsButton } from '../../components/ui/SettingsButton';
import { BurgerMenu } from '../../components/ui/BurgerMenu';
import { BodyWeightCard } from '../../components/bodyweight/BodyWeightCard';
import { WeightLogModal } from '../../components/bodyweight/WeightLogModal';
import { BodyWeightService, BodyWeightEntry } from '../../services/BodyWeightService';
import { DateRange } from '../../components/ui/TimeSeriesChart';
import { useWorkoutManager, WorkoutLog, Exercise, SetLog } from '../../providers/WorkoutManagerProvider';
import { VolumeTrendCard } from '../../components/workouts/VolumeTrendCard';
import { TotalWorkoutsCard } from '../../components/workouts/TotalWorkoutsCard';
import { MuscleHeatmap } from '../../components/dashboard/MuscleHeatmap';
import { WeeklyCompletionRing, getCurrentWeekRange } from '../../components/dashboard/WeeklyCompletionRing';
import { StrengthRankCard } from '../../components/dashboard/StrengthRankCard';
import { useStrengthRanks } from '../../hooks/workouts/useStrengthRanks';
import { storage } from '../../utils/storage';
import { WEEKLY_GOAL_STORAGE_KEY, DEFAULT_WEEKLY_GOAL } from '../../utils/weeklyGoal';
import { RANKING_SEX_STORAGE_KEY, DEFAULT_RANKING_SEX, StrengthSex } from '../../utils/strengthStandards';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { lbToDisplay, roundForDisplay } from '../../utils/units';

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const { showToast } = useToast();
  const { unitSystem } = useUnitPreference();
  const [menuVisible, setMenuVisible] = useState(false);

  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [allWeightHistory, setAllWeightHistory] = useState<BodyWeightEntry[]>([]);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>('Week');
  const { workoutHistory, isLoading: workoutsLoading } = useWorkoutManager();
  const [selectedVolumeRange, setSelectedVolumeRange] = useState<DateRange>('Week');
  const [selectedWorkoutsRange, setSelectedWorkoutsRange] = useState<DateRange>('Week');

  const fetchLatestWeight = useCallback(async () => {
    const weight = await BodyWeightService.getLatestWeight(user?.id || null);
    setLatestWeight(weight);
  }, [user]);

  const fetchAllWeightHistory = useCallback(async () => {
    setIsLoading(true);
    const history = await BodyWeightService.getWeightHistory(user?.id || null);
    setAllWeightHistory(history);
    setIsLoading(false);
  }, [user]);

  const { weightHistory, rangeAverage } = useMemo(() => {
    let spine: string[] = [];
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    if (selectedRange === 'Day') {
        for (let i = 0; i < 24; i++) {
             const h = i < 10 ? `0${i}` : `${i}`;
             spine.push(`${todayStr}T${h}:00:00`);
        }
    } else if (selectedRange === 'Week') {
        const d = new Date(todayStr);
        for (let i = 6; i >= 0; i--) {
            const temp = new Date(d);
            temp.setUTCDate(d.getUTCDate() - i);
            spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === 'Month') {
        const d = new Date(todayStr);
        for (let i = 29; i >= 0; i--) {
            const temp = new Date(d);
            temp.setUTCDate(d.getUTCDate() - i);
            spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === '6Month') {
        const lastWeekStart = new Date(todayStr);
        lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 6);
        for (let i = 25; i >= 0; i--) {
             const temp = new Date(lastWeekStart);
             temp.setUTCDate(lastWeekStart.getUTCDate() - (i * 7));
             spine.push(temp.toISOString().split('T')[0]); 
        }
    } else if (selectedRange === 'Year') {
        const currentMonthStartStr = `${todayY}-${todayM}-01`;
        const d = new Date(currentMonthStartStr);
        for (let i = 11; i >= 0; i--) {
             const temp = new Date(d);
             temp.setUTCMonth(d.getUTCMonth() - i);
             spine.push(temp.toISOString().split('T')[0].substring(0, 7) + '-01'); 
        }
    }

    if (allWeightHistory.length === 0) {
        return { weightHistory: [], rangeAverage: null };
    }

    const spineStartDate = spine[0].split('T')[0];
    const groups: Record<string, { total: number, count: number }> = {};
    
    allWeightHistory.forEach(item => {
        if (item.date < spineStartDate) return;

        let key = '';
        if (selectedRange === 'Day') {
             if (item.date === todayStr) {
                 if (item.created_at) {
                     const t = new Date(item.created_at);
                     const h = t.getHours();
                     const hStr = h < 10 ? `0${h}` : `${h}`;
                     key = `${todayStr}T${hStr}:00:00`;
                 }
             }
        } else if (selectedRange === 'Week' || selectedRange === 'Month') {
            key = item.date;
        } else if (selectedRange === '6Month') {
            const itemDate = new Date(item.date).getTime();
            for (let i = spine.length - 1; i >= 0; i--) {
                const spineDate = new Date(spine[i]).getTime();
                if (itemDate >= spineDate) {
                    key = spine[i];
                    break;
                }
            }
        } else if (selectedRange === 'Year') {
            key = item.date.substring(0, 7) + '-01';
        }

        if (key && spine.includes(key)) {
            if (!groups[key]) groups[key] = { total: 0, count: 0 };
            groups[key].total += parseFloat(item.weight.toString());
            groups[key].count += 1;
        }
    });
    
    const result: { value: number; label: string; date: string; spineIndex: number }[] = [];
    
    const formatLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        
        if (selectedRange === 'Day') return utcDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        if (selectedRange === 'Week' || selectedRange === 'Month' || selectedRange === '6Month') return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (selectedRange === 'Year') return utcDate.toLocaleDateString(undefined, { month: 'short' });
        return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    spine.forEach((date, index) => {
        if (groups[date]) {
             let label = '';
             const len = spine.length;
             const indices = [
                0,
                Math.floor((len - 1) * 0.25),
                Math.floor((len - 1) * 0.5),
                Math.floor((len - 1) * 0.75),
                len - 1
             ];
             
             if (indices.includes(index)) {
                 label = formatLabel(date);
             }

             result.push({
                 value: parseFloat((groups[date].total / groups[date].count).toFixed(2)),
                 label: label,
                 date: date,
                 spineIndex: index
             });
        }
    });
 
    let avg = null;
    if (result.length > 0) {
        const totalSum = result.reduce((sum, item) => sum + item.value, 0);
        avg = Math.round((totalSum / result.length) * 100) / 100;
    }

    return { weightHistory: result, rangeAverage: avg };
  }, [allWeightHistory, selectedRange]);

  // Body weight is stored in lb everywhere (BodyWeightService, strength-rank
  // math). These are display-only conversions for BodyWeightCard — the
  // underlying `latestWeight`/`weightHistory`/`rangeAverage` stay in lb for
  // consumers (like StrengthRankCard's bodyweight-relative ratios) that need
  // the canonical unit.
  const displayLatestWeight = useMemo(
    () => (latestWeight != null ? roundForDisplay(lbToDisplay(latestWeight, unitSystem), unitSystem) : null),
    [latestWeight, unitSystem]
  );
  const displayWeightHistory = useMemo(
    () => weightHistory.map((item) => ({ ...item, value: roundForDisplay(lbToDisplay(item.value, unitSystem), unitSystem) })),
    [weightHistory, unitSystem]
  );
  const displayRangeAverage = useMemo(
    () => (rangeAverage != null ? roundForDisplay(lbToDisplay(rangeAverage, unitSystem), unitSystem) : null),
    [rangeAverage, unitSystem]
  );

  // Memoized workout volume history & summary stats
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
              const weight = parseFloat(set.weight as any) || 0;
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

  // Memoized workout count history & summary stats
  const { workoutsHistoryData, totalWorkoutCount } = useMemo(() => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return { workoutsHistoryData: [], totalWorkoutCount: 0 };
    }

    const rawWorkoutsCount = workoutHistory.map((log: WorkoutLog) => ({
      value: 1,
      date: log.workoutDate,
    }));

    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (selectedWorkoutsRange === 'Week') {
      startDate.setDate(now.getDate() - 6);
    } else if (selectedWorkoutsRange === 'Month') {
      startDate.setDate(now.getDate() - 30);
    } else if (selectedWorkoutsRange === '6Month') {
      startDate.setDate(now.getDate() - 180);
    } else if (selectedWorkoutsRange === 'Year') {
      startDate.setDate(now.getDate() - 365);
    }

    const filtered = rawWorkoutsCount.filter((item: { value: number; date: string }) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    return {
      workoutsHistoryData: rawWorkoutsCount,
      totalWorkoutCount: filtered.length,
    };
  }, [workoutHistory, selectedWorkoutsRange]);

  const muscleVolumes = useMemo(() => {
    const results: Record<string, { muscle: string; sets: number; exercises: string[] }> = {};
    const supportedMuscles = [
      'Chest', 'Shoulders', 'Biceps', 'Forearms', 'Abdominals', 'Quadriceps', 
      'Adductors', 'Tibialis', 'Traps', 'Lats', 'Lower back', 'Triceps', 'Glutes', 'Hamstrings', 'Calves'
    ];
    supportedMuscles.forEach(m => {
      results[m] = { muscle: m, sets: 0, exercises: [] };
    });

    const mapMuscleName = (name: string): string => {
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
    };

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

     useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            fetchLatestWeight();
            fetchAllWeightHistory().catch(err => console.error(err));
        });
        return () => task.cancel();
     }, [user, fetchLatestWeight, fetchAllWeightHistory]);

  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);
  useEffect(() => {
    storage.getItem<number>(WEEKLY_GOAL_STORAGE_KEY).then((goal) => {
      if (goal !== null) setWeeklyGoal(goal);
    });
  }, []);
  // Re-check the goal whenever Home regains focus, so a change made in
  // Settings shows up immediately without needing to reload the whole app.
  useFocusEffect(
    useCallback(() => {
      storage.getItem<number>(WEEKLY_GOAL_STORAGE_KEY).then((goal) => {
        if (goal !== null) setWeeklyGoal(goal);
      });
    }, [])
  );

  const weeklyCompletedCount = useMemo(() => {
    const { start, end } = getCurrentWeekRange();
    return (workoutHistory || []).filter((log: WorkoutLog) => {
      if (!log.workoutDate) return false;
      const d = new Date(log.workoutDate);
      return d >= start && d < end;
    }).length;
  }, [workoutHistory]);

  const [rankingSex, setRankingSex] = useState<StrengthSex>(DEFAULT_RANKING_SEX);
  useEffect(() => {
    storage.getItem<StrengthSex>(RANKING_SEX_STORAGE_KEY).then((sex) => {
      if (sex === 'male' || sex === 'female') setRankingSex(sex);
    });
  }, []);
  const handleChangeRankingSex = async (sex: StrengthSex) => {
    setRankingSex(sex);
    await storage.setItem(RANKING_SEX_STORAGE_KEY, sex);
  };
  const { bests: strengthBests, isLoading: strengthLoading } = useStrengthRanks(user);

  const handleSaveWeight = async (weight: number, date: Date) => {
    try {
        await BodyWeightService.saveWeight(user?.id || null, weight, date);
        fetchLatestWeight();
        fetchAllWeightHistory();
    } catch (error) {
        console.log('Error saving weight:', error);
        showToast({ message: "Failed to save weight", type: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader 
        title="Home" 
        leftAction={<SettingsButton />} 
        rightAction={
            <RaisedCard 
                onPress={() => setMenuVisible(!menuVisible)}
                style={{ borderRadius: 9999 }}
                className="w-12 p-0 items-center justify-center"
            >
                <IconSymbol 
                    name="line.3.horizontal" 
                    size={24} 
                    color={theme.primary} 
                />
            </RaisedCard>} 
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 140 }}>
        <View className="mb-6">
          <WeeklyCompletionRing completed={weeklyCompletedCount} goal={weeklyGoal} />
        </View>
        <View className="mb-6">
          <StrengthRankCard
            bests={strengthBests}
            bodyweight={latestWeight}
            sex={rankingSex}
            onChangeSex={handleChangeRankingSex}
            isLoading={strengthLoading}
          />
        </View>
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2 mb-6">
             <BodyWeightCard
                weight={displayLatestWeight}
                history={displayWeightHistory}
                rangeAverage={displayRangeAverage}
                onLogWeight={() => setIsWeightModalVisible(true)} 
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                primaryColor={theme.primary}
                textColor={theme.textMuted}
                isLoading={isLoading}
             />
          </View>
          <View className="w-1/2 pl-2 mb-6">
               <VolumeTrendCard
                  history={volumeHistoryData}
                  selectedRange={selectedVolumeRange}
                  onRangeChange={setSelectedVolumeRange}
                  rangeAverage={rangeAverageVolume}
                  rangeTotal={rangeTotalVolume}
                  workoutCount={rangeWorkoutCount}
                  primaryColor={theme.primary}
                  textColor={theme.textMuted}
                  isLoading={isLoading}
               />
          </View>
          <View className="w-1/2 pr-2 mb-6">
               <TotalWorkoutsCard
                  history={workoutsHistoryData}
                  selectedRange={selectedWorkoutsRange}
                  onRangeChange={setSelectedWorkoutsRange}
                  workoutCount={totalWorkoutCount}
                  primaryColor={theme.primary}
                  textColor={theme.textMuted}
                  isLoading={isLoading}
               />
          </View>
          <View className="w-full mb-6">
               <MuscleHeatmap volumes={muscleVolumes} isLoading={workoutsLoading} />
          </View>
        </View>
      </ScrollView>

      <WeightLogModal
        visible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />

      <BurgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}