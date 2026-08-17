import { useState, useCallback, useMemo, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { BodyWeightService, BodyWeightEntry } from '../../services/BodyWeightService';
import { DateRange } from '../../components/ui/TimeSeriesChart';
import { UnitSystem, lbToDisplay, roundForDisplay } from '../../utils/units';

export function useBodyWeightTrend(userId: string | null, unitSystem: UnitSystem) {
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [allWeightHistory, setAllWeightHistory] = useState<BodyWeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>('Week');

  const fetchLatestWeight = useCallback(async () => {
    const weight = await BodyWeightService.getLatestWeight(userId);
    setLatestWeight(weight);
  }, [userId]);

  const fetchAllWeightHistory = useCallback(async () => {
    setIsLoading(true);
    const history = await BodyWeightService.getWeightHistory(userId);
    setAllWeightHistory(history);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchLatestWeight();
      fetchAllWeightHistory().catch(err => console.error(err));
    });
    return () => task.cancel();
  }, [userId, fetchLatestWeight, fetchAllWeightHistory]);

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
      return { weightHistory: [], rangeAverage: null as number | null };
    }

    const spineStartDate = spine[0].split('T')[0];
    const groups: Record<string, { total: number; count: number }> = {};

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
  // math). These are display-only conversions — the underlying `latestWeight`
  // stays in lb for consumers (like StrengthRankCard's bodyweight-relative
  // ratios) that need the canonical unit.
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

  const saveWeight = useCallback(async (weight: number, date: Date) => {
    await BodyWeightService.saveWeight(userId, weight, date);
    fetchLatestWeight();
    fetchAllWeightHistory();
  }, [userId, fetchLatestWeight, fetchAllWeightHistory]);

  return {
    latestWeight,
    displayLatestWeight,
    displayWeightHistory,
    displayRangeAverage,
    selectedRange,
    setSelectedRange,
    isLoading,
    saveWeight,
  };
}
