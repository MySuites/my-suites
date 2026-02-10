import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Alert, ScrollView, Switch } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { useUITheme, ThemeToggle, IconSymbol, useToast, RaisedCard } from '@mysuite/ui';
import { DataRepository } from '../../providers/DataRepository';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { BodyWeightCard } from '../../components/profile/BodyWeightCard';
import { WeightLogModal } from '../../components/profile/WeightLogModal';
import { BodyWeightService, BodyWeightEntry } from '../../services/BodyWeightService';
import { HealthKitService } from '../../services/HealthKitService';

import { DateRange } from '../../components/ui/TimeSeriesChart';

export default function SettingsScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const { preference, setPreference } = useThemePreference();
  const { showToast } = useToast();

  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [allWeightHistory, setAllWeightHistory] = useState<BodyWeightEntry[]>([]);
  // Derived state for chart
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>('Week');

  const fetchLatestWeight = useCallback(async () => {
    // Fetch the most recent weight entry
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
    // 1. Generate Spine
    let spine: string[] = [];
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    if (selectedRange === 'Day') {
        // Today's hourly spine
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

    // 2. Filter & Aggregate
    const spineStartDate = spine[0].split('T')[0]; // Safe for Day too
    const groups: Record<string, { total: number, count: number }> = {};
    
    allWeightHistory.forEach(item => {
        if (item.date < spineStartDate) return;

        let key = '';
        if (selectedRange === 'Day') {
             if (item.date === todayStr) {
                 if (item.created_at) {
                     const t = new Date(item.created_at);
                     // Round to nearest hour
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
    
    // 3. Map to Spine
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
 
    // 4. Calculate Average
    let avg = null;
    if (result.length > 0) {
        const totalSum = result.reduce((sum, item) => sum + item.value, 0);
        avg = Math.round((totalSum / result.length) * 100) / 100;
    }

    return { weightHistory: result, rangeAverage: avg };

  }, [allWeightHistory, selectedRange]);

  useEffect(() => {
     fetchLatestWeight();
     fetchAllWeightHistory().catch(err => console.error(err));
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

  const handleDeleteData = () => {
    Alert.alert(
        "Delete All Data?",
        user 
          ? "This will permanently delete ALL workouts, logs, and measurements from both this device AND the cloud. This action cannot be undone."
          : "This will permanently delete ALL workouts, logs, and measurements stored on this device. This action cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        setIsLoading(true);
                        
                        // 1. Delete Local Data (Always)
                        await DataRepository.clearAllLocalData();
                        
                        // 2. Delete Cloud Data (If signed in)
                        if (user) {
                            await supabase.from('workouts').delete().eq('user_id', user.id);
                            await supabase.from('workout_logs').delete().eq('user_id', user.id);
                            await supabase.from('set_logs').delete().eq('user_id', user.id).then(async ({error}) => {
                            });
                             await supabase.from('body_measurements').delete().eq('user_id', user.id);
                             await supabase.from('routines').delete().eq('user_id', user.id);
                        }

                        // 3. Disable HealthKit Sync
                        await HealthKitService.disableSync();

                        // 4. Refresh State
                        await checkHealthStatus();
                        await fetchLatestWeight();
                        await fetchAllWeightHistory();
                        
                        showToast({ message: "All data deleted", type: 'success' });
                    } catch (error) {
                        console.error("Delete data error:", error);
                        Alert.alert("Error", "Failed to delete data.");
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        ]
    );
  };

  const [isHealthConnected, setIsHealthConnected] = useState(false);

  useEffect(() => {
    checkHealthStatus();
    // Auto-sync when visiting settings
    BodyWeightService.syncWithHealthKit(user?.id || null).then(() => {
        // Refresh local data after sync
        fetchLatestWeight();
        fetchAllWeightHistory();
    });
  }, []);

  const checkHealthStatus = async () => {
    const isAuth = await HealthKitService.isAuthorized();
    setIsHealthConnected(isAuth);
  };

  const handleConnectHealth = async () => {
    try {
      setIsLoading(true);
      await HealthKitService.initHealthKit();
      await HealthKitService.enableSync();
      await BodyWeightService.syncWithHealthKit(user?.id || null);
      showToast({ message: "HealthKit synced successfully", type: 'success' });
      await checkHealthStatus();
      await fetchLatestWeight();
      await fetchAllWeightHistory();
    } catch (error) {
      console.error("HealthKit init error:", error);
      showToast({ message: "Failed to sync HealthKit", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader 
        title="Settings" 
        leftAction={<BackButton />} 
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 140 }}>
        
        <View className="mb-6">
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

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Appearance</Text>
          <ThemeToggle preference={preference} setPreference={setPreference} />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Legal</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Privacy Policy</Text>
            <RaisedCard 
              onPress={() => Alert.alert('Privacy Policy', 'Link to Privacy Policy')}
              className="w-10 h-10 p-0 rounded-full items-center justify-center"
              style={{ borderRadius: 9999 }}
            >
              <IconSymbol name="chevron.right" size={20} color={theme.primary} />
            </RaisedCard>
          </View>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Terms of Service</Text>
            <RaisedCard 
              onPress={() => Alert.alert('Terms of Service', 'Link to Terms of Service')}
              className="w-10 h-10 p-0 rounded-full items-center justify-center"
              style={{ borderRadius: 9999 }}
            >
              <IconSymbol name="chevron.right" size={20} color={theme.primary} />
            </RaisedCard>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Integrations</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-light dark:text-dark">Apple Health</Text>
            <Switch
              value={isHealthConnected}
              onValueChange={async (value) => {
                if (value) {
                    await handleConnectHealth();
                } else {
                    await HealthKitService.disableSync();
                    await checkHealthStatus();
                    showToast({ message: "HealthKit sync stopped", type: 'success' });
                }
              }}
              trackColor={{ false: theme.card, true: theme.primary }}
              thumbColor={isHealthConnected ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Data</Text>
          <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className="text-base text-danger">Delete Data</Text>
            <RaisedCard
              testID="delete-data-btn"
              onPress={handleDeleteData}
              className="w-10 h-10 p-0 rounded-full items-center justify-center"
              style={{ borderRadius: 9999 }}
            >
              <IconSymbol name="trash.fill" size={20} color={theme.danger} />
            </RaisedCard>
          </View>
        </View>
        
        <Text className="text-center text-xs text-gray-500 mt-6">Version 1.0.0</Text>
      </ScrollView>

      <WeightLogModal
        visible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />
    </View>
  );
}
