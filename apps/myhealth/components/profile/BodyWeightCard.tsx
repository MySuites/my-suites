import React from 'react';
import { View, Text } from 'react-native';
import { BodyWeightChart } from './BodyWeightChart';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';
import { RaisedCard, HollowedCard, useUITheme, Skeleton, IconSymbol } from '@mysuite/ui';

// Defined locally to avoid circular dependencies if any
type DateRange = 'W' | 'M' | '6M' | 'Y';

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'W', value: 'W' },
  { label: 'M', value: 'M' },
  { label: '6M', value: '6M' },
  { label: 'Y', value: 'Y' },
];

interface BodyWeightCardProps {
  weight: number | null;
  history: { value: number; label: string; date: string; spineIndex?: number }[];
  onLogWeight: () => void;
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  rangeAverage: number | null;
  primaryColor?: string;
  textColor?: string;
  isLoading?: boolean;
}

export function BodyWeightCard({ 
  weight, 
  history, 
  onLogWeight,
  selectedRange,
  onRangeChange,
  rangeAverage,
  primaryColor,
  textColor,
  isLoading,
}: BodyWeightCardProps) {
  const theme = useUITheme();
  const [selectedPoint, setSelectedPoint] = React.useState<{ value: number; date: string } | null>(null);

  React.useEffect(() => {
    setSelectedPoint(null);
  }, [selectedRange]);

  const displayWeight = selectedPoint ? selectedPoint.value : (rangeAverage || weight);

  const getSelectionLabel = () => {
    if (!selectedPoint) {
      const labels: Record<DateRange, string> = {
        W: 'Week',
        M: 'Month',
        '6M': '6 Month',
        Y: 'Year',
      };
      return `${labels[selectedRange]} Average`;
    }
    
    const d = new Date(selectedPoint.date);
    const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    
    if (selectedRange === 'W' || selectedRange === 'M') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (selectedRange === '6M') {
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      const startStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `Weekly Average: ${startStr} - ${endStr}`;
    }
    
    if (selectedRange === 'Y') {
      const monthStr = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      return `Monthly Average: ${monthStr}`;
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <RaisedCard className="p-4 mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                 <IconSymbol name="scalemass.fill" size={18} color={primaryColor || '#3b82f6'} />
            </View>
            <Text className="font-semibold text-base text-light dark:text-dark">Body Weight</Text>
        </View>
        <RaisedCard 
            onPress={onLogWeight}
            className="w-10 h-10 p-0 items-center justify-center"
            style={{ borderRadius: 20 }}
        >
          <IconSymbol name="plus" size={24} color={primaryColor || theme.primary} />
        </RaisedCard>
      </View>
      
      <View className="mt-2">
        {displayWeight ? (
            <View>
                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-1 w-full">
                        <View className="flex-row items-baseline">
                            <Text className="text-3xl font-bold mr-1 text-light dark:text-dark">{displayWeight}</Text>
                            <Text className="text-light-muted dark:text-dark-muted text-sm">lbs</Text>
                        </View>
                        
                        <SegmentedControl
                            options={RANGE_OPTIONS}
                            value={selectedRange}
                            onChange={onRangeChange}
                        />
                    </View>
                    <Text className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                        {getSelectionLabel()}
                    </Text>
                </View>
                {isLoading ? (
                    <View className="h-40 items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                        <Skeleton height="70%" width="90%" borderRadius={4} />
                    </View>
                ) : history.length > 0 ? (
                    <BodyWeightChart 
                        data={history} 
                        color={primaryColor}
                        textColor={textColor}
                        maxPoints={
                            selectedRange === 'W' ? 7 : 
                            selectedRange === 'M' ? 31 : 
                            selectedRange === '6M' ? 26 : 
                            12
                        }
                        selectedRange={selectedRange}
                        onPointSelect={(point) => {
                            // If the same point is clicked again, reset to average
                            if (point && selectedPoint && point.date === selectedPoint.date) {
                                setSelectedPoint(null);
                            } else {
                                setSelectedPoint(point);
                            }
                        }}
                    />
                ) : (
                    <View className="py-8 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                        <Text className="text-light-muted dark:text-dark-muted text-center italic text-sm">
                            No data for this {selectedRange === '6M' ? 'period' : selectedRange === 'W' ? 'week' : selectedRange === 'M' ? 'month' : 'year'}.
                        </Text>
                    </View>
                )}
            </View>
        ) : isLoading ? (
            <View>
                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-1">
                        <View className="flex-row items-baseline">
                            <Skeleton height={32} width={60} className="mr-2" />
                            <Skeleton height={14} width={20} />
                        </View>
                        <Skeleton height={32} width={120} borderRadius={16} />
                    </View>
                    <Skeleton height={12} width={100} />
                </View>
                <View className="h-40 items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <Skeleton height="70%" width="90%" borderRadius={4} />
                </View>
            </View>
        ) : (
            <HollowedCard className="p-8">
                <Text className="text-light-muted dark:text-dark-muted text-center italic">
                    No weight metrics found. Log your first weight to see your progress!
                </Text>
            </HollowedCard>
        )}
      </View>
    </RaisedCard>
  );
}
