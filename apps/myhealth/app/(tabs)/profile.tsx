import { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { useUITheme } from '@mysuite/ui';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BodyWeightCard } from '../../components/profile/BodyWeightCard';
import { WeightLogModal } from '../../components/profile/WeightLogModal';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

type DateRange = 'Week' | 'Month' | '6Month' | 'Year';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<{ value: number; label: string; date: string }[]>([]);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>('Week');
  const theme = useUITheme();
  
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.log('Error fetching profile:', error);
          if (data) {
            setUsername(data.username);
          }
        });
    }
  }, [user]);

  const fetchLatestWeight = useCallback(async () => {
    if (!user) return;
    
    // Fetch the most recent weight entry
    const { data: latestData, error: latestError } = await supabase
      .from('body_measurements')
      .select('weight')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
        console.log('Error fetching weight:', latestError);
    } else if (latestData) {
        setLatestWeight(latestData.weight);
    }
  }, [user]);


  // Helper to format date label
  const formatDateLabel = (dateStr: string, range: DateRange) => {
      // Use UTC to prevent off-by-one errors when formatting labels
      // toLocaleDateString uses local timezone of device.
      // If dateStr="2025-12-24" (UTC), and we are EST. date Obj is Dec 23 19:00.
      // label becomes Dec 23. This IS confusing.
      // We want label "Dec 24".
      
      const d = new Date(dateStr);
      const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      
      if (range === 'Week' || range === 'Month' || range === '6Month') return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (range === 'Year') return utcDate.toLocaleDateString(undefined, { month: 'short' });
      return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const fetchWeightHistory = useCallback(async () => {
    if (!user) return;

    // 1. Generate Spine (Target Dates)
    let spine: string[] = [];
    const now = new Date();
    // Get "Today" as YYYY-MM-DD string (Local)
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    if (selectedRange === 'Week') {
        // Last 7 days
        const d = new Date(todayStr); // UTC Mid
        for (let i = 6; i >= 0; i--) {
            const temp = new Date(d);
            temp.setUTCDate(d.getUTCDate() - i);
            spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === 'Month') {
        // Last 30 days
        const d = new Date(todayStr);
        for (let i = 29; i >= 0; i--) {
            const temp = new Date(d);
            temp.setUTCDate(d.getUTCDate() - i);
            spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === '6Month') {
        // Last 26 weeks (6 months)
        // A "week" here ends on today. So the start of the current week is today - 6 days.
        const lastWeekStart = new Date(todayStr);
        lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 6);
        
        for (let i = 25; i >= 0; i--) {
             const temp = new Date(lastWeekStart);
             temp.setUTCDate(lastWeekStart.getUTCDate() - (i * 7));
             spine.push(temp.toISOString().split('T')[0]); 
        }
    } else if (selectedRange === 'Year') {
        // Last 12 months
        const currentMonthStartStr = `${todayY}-${todayM}-01`;
        const d = new Date(currentMonthStartStr);
        for (let i = 11; i >= 0; i--) {
             const temp = new Date(d);
             temp.setUTCMonth(d.getUTCMonth() - i);
             spine.push(temp.toISOString().split('T')[0].substring(0, 7) + '-01'); 
        }
    }

    // 2. Fetch Data
    const { data: rawData, error } = await supabase
      .from('body_measurements')
      .select('weight, date')
      .eq('user_id', user.id)
      .gte('date', spine[0])
      .order('date', { ascending: true });
      
    if (error) {
        console.log('Error fetching weight history:', error);
        return;
    }

    if (!rawData || rawData.length === 0) {
        setWeightHistory([]);
        return;
    }

    // 3. Process Data (Aggregation)
    const groups: Record<string, { total: number, count: number }> = {};
    rawData.forEach(item => {
        let key = '';
        if (selectedRange === 'Week' || selectedRange === 'Month') {
            key = item.date;
        } else if (selectedRange === '6Month') {
            // Find the closest preceding spine date
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
            groups[key].total += item.weight;
            groups[key].count += 1;
        }
    });
    
    // 4. Map existing data to their positions in the spine.
    const result: { value: number; label: string; date: string; spineIndex: number }[] = [];
    
    spine.forEach((date, index) => {
        if (groups[date]) {
             // 5. Label Logic (Divide into 4 sections)
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
                 label = formatDateLabel(date, selectedRange);
             }

             result.push({
                 value: parseFloat((groups[date].total / groups[date].count).toFixed(2)),
                 label: label,
                 date: date,
                 spineIndex: index
             });
        }
    });

    setWeightHistory(result);
  }, [user, selectedRange]);

  useEffect(() => {
    if (user) {
        fetchLatestWeight();
    }
  }, [user, fetchLatestWeight]);

  useEffect(() => {
      if (user) {
          fetchWeightHistory().catch(err => console.error(err));
      }
  }, [user, fetchWeightHistory]);

  const handleSaveWeight = async (weight: number, date: Date) => {
    if (!user) return;

    const dateStr = date.toISOString().split('T')[0];

    // Check if entry exists for this date
    const { data: existingData, error: fetchError } = await supabase
        .from('body_measurements')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

    if (fetchError) {
        console.log('Error checking existing weight:', fetchError);
        return;
    }

    let error;

    if (existingData) {
        // Update existing
        const { error: updateError } = await supabase
            .from('body_measurements')
            .update({ weight: weight })
            .eq('id', existingData.id);
        error = updateError;
    } else {
        // Insert new
        const { error: insertError } = await supabase
            .from('body_measurements')
            .insert({
                user_id: user.id,
                weight: weight,
                date: dateStr,
            });
        error = insertError;
    }

    if (error) {
        console.log('Error saving weight:', error);
    } else {
        fetchLatestWeight(); // Refresh display
        fetchWeightHistory(); // Refresh chart
    }
  };
  
  return (
    <View className="flex-1 p-4 bg-light dark:bg-dark">
      <ScreenHeader 
        title={username || 'Profile'} 
        rightAction={
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <IconSymbol name="gearshape.fill" size={24} color={theme.text} />
            </TouchableOpacity>
        } 
      />
      

      <BodyWeightCard 
        weight={latestWeight} 
        history={weightHistory}
        onLogWeight={() => setIsWeightModalVisible(true)} 
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        primaryColor={theme.primary}
        textColor={theme.textMuted}
      />

      <WeightLogModal
        visible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />
    </View>
  );
}