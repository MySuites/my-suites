import React from 'react';
import { View, Text, Modal, TouchableWithoutFeedback } from 'react-native';
import { TimeSeriesChart, DateRange } from '../ui/TimeSeriesChart';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';
import { HollowedCard, useUITheme, Skeleton, IconSymbol, RaisedCard } from '@mysuite/ui';

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'W', value: 'Week' },
  { label: 'M', value: 'Month' },
  { label: '6M', value: '6Month' },
  { label: 'Y', value: 'Year' },
];

// Short badge label per range; anything unlisted falls back to 'Year'.
const RANGE_BADGE_LABEL: Partial<Record<DateRange, string>> = {
  Week: 'Week',
  Month: 'Month',
  '6Month': '6M',
};

interface VolumeTrendCardProps {
  history: { value: number; label?: string; date: string; spineIndex?: number }[];
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  rangeAverage: number | null;
  rangeTotal: number | null;
  workoutCount: number;
  primaryColor?: string;
  textColor?: string;
  isLoading?: boolean;
}

export function VolumeTrendCard({ 
  history, 
  selectedRange,
  onRangeChange,
  rangeAverage,
  rangeTotal,
  workoutCount,
  primaryColor,
  textColor,
  isLoading,
}: VolumeTrendCardProps) {
  const theme = useUITheme();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedPoint, setSelectedPoint] = React.useState<{ value: number; date: string } | null>(null);

  React.useEffect(() => {
    setSelectedPoint(null);
  }, [selectedRange, modalVisible]);

  // Main metric displays the selected point volume, or the range average workout volume as fallback
  const displayVolume = selectedPoint ? selectedPoint.value : rangeAverage;

  const getSelectionLabel = () => {
    if (selectedPoint) {
      const d = new Date(selectedPoint.date);
      const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      
      if (selectedRange === 'Week' || selectedRange === 'Month') {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      if (selectedRange === '6Month') {
        const end = new Date(date);
        end.setDate(date.getDate() + 6);
        const startStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return `Weekly Total: ${startStr} - ${endStr}`;
      }
      
      if (selectedRange === 'Year') {
        const monthStr = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        return `Monthly Total: ${monthStr}`;
      }
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Default label: Range summary
    const labels: Record<string, string> = {
      Week: 'This Week',
      Month: 'This Month',
      '6Month': '6 Month',
      Year: 'Year',
    };
    return `${labels[selectedRange] || selectedRange} Avg / Workout`;
  };

  return (
    <View className="mb-4">
      {/* Widget Layout on Home Screen */}
      <RaisedCard 
        onPress={() => setModalVisible(true)}
        className="p-4 active:opacity-90"
        style={{ borderRadius: 16 }}
      >
        <View className="flex-col gap-2">
          {/* Top Row: Icon and Period Badge */}
          <View className="flex-row justify-between items-center">
            <View 
              className="w-8 h-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: (primaryColor || theme.primary) + '15' }} // ~8% opacity tint
            >
              <IconSymbol name="dumbbell.fill" size={16} color={primaryColor || theme.primary} />
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px] text-light-muted dark:text-dark-muted font-semibold bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                {RANGE_BADGE_LABEL[selectedRange] ?? 'Year'}
              </Text>
              <IconSymbol name="chevron.right" size={12} color={textColor || theme.textMuted} />
            </View>
          </View>
          
          {/* Stats Info */}
          <View>
            <Text className="text-[10px] text-light-muted dark:text-dark-muted font-medium mb-0.5" numberOfLines={1}>
              Workout Volume
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-lg font-bold text-light dark:text-dark" numberOfLines={1}>
                {rangeAverage ? Math.round(rangeAverage).toLocaleString() : '0'}
              </Text>
              <Text className="text-[10px] text-light-muted dark:text-dark-muted ml-0.5">lbs</Text>
            </View>
          </View>
        </View>
      </RaisedCard>

      {/* Chart Overlay Modal Window */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>

          <View className="w-full bg-light dark:bg-dark-lighter rounded-2xl overflow-hidden p-6" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-2">
                <IconSymbol name="dumbbell.fill" size={20} color={primaryColor || theme.primary} />
                <Text className="text-lg font-bold text-light dark:text-dark">Volume Trends</Text>
              </View>
              <RaisedCard 
                testID="close-modal-btn"
                onPress={() => setModalVisible(false)} 
                style={{ borderRadius: 9999 }}
                className="w-10 h-10 p-0 rounded-full items-center justify-center active:h-9"
              >
                <IconSymbol name="xmark" size={20} color={theme.primary} />
              </RaisedCard>
            </View>

            {/* Modal Body */}
            {history.length > 0 || isLoading ? (
              <View className="w-full">
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <SegmentedControl
                      options={RANGE_OPTIONS}
                      value={selectedRange}
                      onChange={onRangeChange}
                    />
                  </View>
                  <View className="flex-row items-baseline flex-wrap mt-2">
                    <Text 
                      className="text-3xl font-bold mr-1 text-light dark:text-dark shrink"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {displayVolume ? Math.round(displayVolume).toLocaleString() : '0'}
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted text-base mr-3">lbs</Text>
                    
                    <View className="flex-col justify-center">
                      <Text 
                        className="text-[11px] font-semibold text-light-muted dark:text-dark-muted"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {getSelectionLabel()}
                      </Text>
                      {!selectedPoint && rangeTotal !== null && (
                        <Text className="text-[10px] text-gray-500 dark:text-gray-400">
                          Total: {Math.round(rangeTotal).toLocaleString()} lbs ({workoutCount} workout{workoutCount !== 1 ? 's' : ''})
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {isLoading ? (
                  <View className="h-40 items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <Skeleton height="70%" width="90%" borderRadius={4} />
                  </View>
                ) : (
                  <TimeSeriesChart 
                    data={history} 
                    color={primaryColor || theme.primary}
                    textColor={textColor || theme.textMuted}
                    maxPoints={
                      selectedRange === 'Week' ? 7 : 
                      selectedRange === 'Month' ? 31 : 
                      selectedRange === '6Month' ? 26 : 
                      12
                    }
                    selectedRange={selectedRange}
                    aggregation="sum"
                    onPointSelect={(point) => {
                      if (point && selectedPoint && point.date === selectedPoint.date) {
                        setSelectedPoint(null);
                      } else {
                        setSelectedPoint(point);
                      }
                    }}
                  />
                )}
              </View>
            ) : (
              <HollowedCard className="p-8 my-4">
                <Text className="text-light-muted dark:text-dark-muted text-center italic">
                  No workout volume data found. Complete your first workout to see your progress!
                </Text>
              </HollowedCard>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
