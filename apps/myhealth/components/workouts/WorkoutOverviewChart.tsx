import React from 'react';
import { View, Text } from 'react-native';
import { TimeSeriesChart, DateRange } from '../ui/TimeSeriesChart';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { RaisedCard, useUITheme } from '@mysuite/ui';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';

interface WorkoutOverviewChartProps {
    workoutName: string;
}

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'M', value: 'Month' },
  { label: '3M', value: '3Month' },
  { label: '6M', value: '6Month' },
  { label: 'Y', value: 'Year' },
];

export function WorkoutOverviewChart({ workoutName }: WorkoutOverviewChartProps) {
    const { workoutHistory } = useWorkoutManager();
    const theme = useUITheme();
    const [selectedRange, setSelectedRange] = React.useState<DateRange>('6Month');
    const [selectedPoint, setSelectedPoint] = React.useState<{ value: number; date: string } | null>(null);

    React.useEffect(() => {
        setSelectedPoint(null);
    }, [selectedRange]);

    // Filter history for this workout name
    // And calculate volume for each log
    // Then map to range buckets
    const chartData = React.useMemo(() => {
        if (!workoutName || !workoutHistory) return [];

        const filtered = workoutHistory.filter(log => 
            log.workoutName === workoutName && log.exercises && log.exercises.length > 0
        ).map(log => {
            let totalVolume = 0;
            if (log.exercises) {
                log.exercises.forEach(ex => {
                    if (ex.logs) {
                        ex.logs.forEach(set => {
                            const weight = set.weight || 0;
                            const reps = set.reps || 0;
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

        // Date Logic
        const now = new Date();
        const buckets: { value: number; label: string; date: string; spineIndex: number }[] = [];
        
        // let maxPoints = 0; // Unused variable
        let startDate = new Date();

        if (selectedRange === 'Month') {
            // maxPoints = 31;
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);

            filtered.forEach(log => {
                const d = new Date(log.date);
                if (d >= startDate) {
                    const diffTime = d.getTime() - startDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                     if (diffDays >= 0 && diffDays < 31) {
                         const existing = buckets.find(b => b.spineIndex === diffDays);
                         if (existing) {
                              existing.value += log.value;
                              if (new Date(log.date) > new Date(existing.date)) existing.date = log.date;
                         } else {
                                  buckets.push({
                                     value: log.value,
                                     label: new Date(log.date).toLocaleDateString(),
                                     date: log.date,
                                     spineIndex: diffDays
                                 });
                         }
                     }
                }
            });

        } else if (selectedRange === '3Month') {
            startDate.setDate(now.getDate() - (12 * 7)); // 13 weeks ideally, but let's stick to simple math or 90 days? Data in config is 13 weeks.
            // 3 months ~ 90 days ~ 13 weeks.
            startDate.setHours(0, 0, 0, 0);

            filtered.forEach(log => {
                const d = new Date(log.date);
                if (d >= startDate) {
                    const diffTime = d.getTime() - startDate.getTime();
                    // Bucket by Week for 3M? Config says unit: 'week'
                    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                    
                    if (diffWeeks >= 0 && diffWeeks < 13) {
                         const existing = buckets.find(b => b.spineIndex === diffWeeks);
                         if (existing) {
                              existing.value += log.value;
                              if (new Date(log.date) > new Date(existing.date)) existing.date = log.date;
                         } else {
                                  buckets.push({
                                      value: log.value,
                                      label: new Date(log.date).toLocaleDateString(),
                                      date: log.date,
                                      spineIndex: diffWeeks
                                  });
                         }
                    }
                }
            });

        } else if (selectedRange === '6Month') {
            startDate.setDate(now.getDate() - (25 * 7));
            startDate.setHours(0, 0, 0, 0);

            filtered.forEach(log => {
                const d = new Date(log.date);
                if (d >= startDate) {
                    const diffTime = d.getTime() - startDate.getTime();
                    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                    
                    if (diffWeeks >= 0 && diffWeeks < 26) {
                         const existing = buckets.find(b => b.spineIndex === diffWeeks);
                         if (existing) {
                              existing.value += log.value;
                              if (new Date(log.date) > new Date(existing.date)) existing.date = log.date;
                         } else {
                                  buckets.push({
                                      value: log.value,
                                      label: new Date(log.date).toLocaleDateString(),
                                      date: log.date,
                                      spineIndex: diffWeeks
                                  });
                         }
                    }
                }
            });

        } else if (selectedRange === 'Year') {
             // maxPoints = 12; // Months
             startDate.setMonth(now.getMonth() - 11);
             startDate.setDate(1); // Start of that month
             startDate.setHours(0,0,0,0);

             filtered.forEach(log => {
                 const d = new Date(log.date);
                 if (d >= startDate) {
                     // Calculate month diff
                     // (d.Year - start.Year) * 12 + (d.Month - start.Month)
                     const diffMonths = (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
                     
                     if (diffMonths >= 0 && diffMonths < 12) {
                        const existing = buckets.find(b => b.spineIndex === diffMonths);
                        if (existing) {
                             existing.value += log.value;
                             if (new Date(log.date) > new Date(existing.date)) existing.date = log.date;
                        } else {
                                  buckets.push({
                                      value: log.value,
                                      label: new Date(log.date).toLocaleDateString(),
                                      date: log.date,
                                      spineIndex: diffMonths
                                  });
                        }
                     }
                 }
             });
        }

        return buckets.sort((a, b) => (a.spineIndex || 0) - (b.spineIndex || 0));

    }, [workoutHistory, workoutName, selectedRange]);

    const displayValue = selectedPoint ? selectedPoint.value : (chartData.length > 0 ? chartData[chartData.length - 1].value : 0);

    const getSelectionLabel = () => {
        if (selectedPoint) {
             return new Date(selectedPoint.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }
        // Default text
        const labels: Record<string, string> = {
            Week: 'Week',
            Month: 'Month',
            '6Month': '6 Month',
            Year: 'Year',
        };
        return `${labels[selectedRange] || selectedRange} History`;
    };

    return (
        <RaisedCard className="p-4 mb-4">
             <View className="flex-row justify-between items-center mb-2">
                 <View>
                    <Text className="font-semibold text-base text-light dark:text-dark">Total Volume</Text>
                 </View>
                 <SegmentedControl
                    options={RANGE_OPTIONS}
                    value={selectedRange}
                    onChange={setSelectedRange}
                 />
             </View>
             
             <View className="mb-2">
                 <View className="flex-row items-baseline">
                    <Text className="text-3xl font-bold mr-1 text-light dark:text-dark">{displayValue.toLocaleString()}</Text>
                    <Text className="text-light-muted dark:text-dark-muted text-sm">lbs</Text>
                 </View>
                 <Text className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                    {getSelectionLabel()}
                 </Text>
             </View>

            {chartData.length === 0 ? (
                <View className="h-[150px] justify-center items-center bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                     <Text className="text-light-muted dark:text-dark-muted italic text-sm">
                        No data for this period
                     </Text>
                </View>
            ) : (
                <TimeSeriesChart 
                    data={chartData}
                    color={theme.primary}
                    textColor={theme.textMuted}
                    selectedRange={selectedRange}
                    aggregation="sum"
                    maxPoints={
                        selectedRange === 'Month' ? 31 :
                        selectedRange === '3Month' ? 13 : 
                        selectedRange === '6Month' ? 26 : 
                        12
                    }
                    height={150}
                    onPointSelect={setSelectedPoint}
                />
            )}
        </RaisedCard>
    );
}
