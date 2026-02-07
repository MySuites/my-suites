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

    // Simplified Data Prep - aggregation handled by Chart
    const chartData = React.useMemo(() => {
        if (!workoutName || !workoutHistory) return [];

        return workoutHistory.filter(log => 
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
    }, [workoutHistory, workoutName]);

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
             <View className="mb-4">
                 <View className="mb-2">
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
                    <Text className="text-light-muted dark:text-dark-muted text-base">lbs</Text>
                    <Text className="ml-2 text-[11px] font-medium text-light-muted dark:text-dark-muted">
                        {getSelectionLabel()}
                    </Text>
                 </View>
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
