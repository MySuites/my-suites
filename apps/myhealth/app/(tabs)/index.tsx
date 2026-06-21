import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, InteractionManager } from "react-native";
import { useAuth } from '@mysuite/auth';
import { RaisedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SettingsButton } from '../../components/ui/SettingsButton';
import { BodyWeightCard } from '../../components/bodyweight/BodyWeightCard';
import { WeightLogModal } from '../../components/bodyweight/WeightLogModal';
import { BodyWeightService, BodyWeightEntry } from '../../services/BodyWeightService';
import { DateRange } from '../../components/ui/TimeSeriesChart';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { VolumeTrendCard } from '../../components/workouts/VolumeTrendCard';
import { TotalWorkoutsCard } from '../../components/workouts/TotalWorkoutsCard';

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const { showToast } = useToast();
  const [menuVisible, setMenuVisible] = useState(false);

  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [allWeightHistory, setAllWeightHistory] = useState<BodyWeightEntry[]>([]);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>('Week');
  const { workoutHistory } = useWorkoutManager();
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

  // Memoized workout volume history & summary stats
  const { volumeHistoryData, rangeAverageVolume, rangeTotalVolume, rangeWorkoutCount } = useMemo(() => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return { volumeHistoryData: [], rangeAverageVolume: null, rangeTotalVolume: null, rangeWorkoutCount: 0 };
    }

    const rawVolumeLogs = workoutHistory.map(log => {
      let totalVolume = 0;
      if (log.exercises) {
        log.exercises.forEach(ex => {
          if (ex.logs) {
            ex.logs.forEach(set => {
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

    const filtered = rawVolumeLogs.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    const total = filtered.reduce((sum, item) => sum + item.value, 0);
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

    const rawWorkoutsCount = workoutHistory.map(log => ({
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

    const filtered = rawWorkoutsCount.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    return {
      workoutsHistoryData: rawWorkoutsCount,
      totalWorkoutCount: filtered.length,
    };
  }, [workoutHistory, selectedWorkoutsRange]);

     useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            fetchLatestWeight();
            fetchAllWeightHistory().catch(err => console.error(err));
        });
        return () => task.cancel();
     }, [user, fetchLatestWeight, fetchAllWeightHistory]);

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
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2 mb-6">
             <BodyWeightCard 
                weight={latestWeight} 
                history={weightHistory}
                rangeAverage={rangeAverage}
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
        </View>
      </ScrollView>

      <WeightLogModal
        visible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />
    </View>
  );
}