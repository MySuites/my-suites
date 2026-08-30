import React from 'react';
import { View, Text } from 'react-native';
import { TimeSeriesChart, DateRange } from '../ui/TimeSeriesChart';
import { SegmentedControlOption } from '../ui/SegmentedControl';
import { MetricWidgetCard } from '../dashboard/MetricWidgetCard';
import { MetricDetailModal } from '../dashboard/MetricDetailModal';
import { useUITheme } from '@mysuite/ui';

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
      <MetricWidgetCard
        icon="dumbbell.fill"
        onPress={() => setModalVisible(true)}
        badgeLabel={RANGE_BADGE_LABEL[selectedRange] ?? 'Year'}
        label="Workout Volume"
        value={rangeAverage ? Math.round(rangeAverage).toLocaleString() : '0'}
        unit="lbs"
        primaryColor={primaryColor}
        textColor={textColor}
      />

      <MetricDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        icon="dumbbell.fill"
        title="Volume Trends"
        rangeOptions={RANGE_OPTIONS}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        primaryValue={displayVolume ? Math.round(displayVolume).toLocaleString() : '0'}
        primaryUnit="lbs"
        selectionLabel={getSelectionLabel()}
        extraInfo={
          !selectedPoint && rangeTotal !== null && (
            <Text className="text-[12px] text-gray-500 dark:text-gray-400">
              Total: {Math.round(rangeTotal).toLocaleString()} lbs ({workoutCount} workout{workoutCount !== 1 ? 's' : ''})
            </Text>
          )
        }
        hasData={history.length > 0}
        isLoading={isLoading}
        emptyMessage="No workout volume data found. Complete your first workout to see your progress!"
        primaryColor={primaryColor}
      >
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
      </MetricDetailModal>
    </View>
  );
}
