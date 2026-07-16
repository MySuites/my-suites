import React from 'react';
import { View } from 'react-native';
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

interface TotalWorkoutsCardProps {
  history: { value: number; label?: string; date: string; spineIndex?: number }[];
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  workoutCount: number;
  primaryColor?: string;
  textColor?: string;
  isLoading?: boolean;
}

export function TotalWorkoutsCard({
  history,
  selectedRange,
  onRangeChange,
  workoutCount,
  primaryColor,
  textColor,
  isLoading,
}: TotalWorkoutsCardProps) {
  const theme = useUITheme();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedPoint, setSelectedPoint] = React.useState<{ value: number; date: string } | null>(null);

  React.useEffect(() => {
    setSelectedPoint(null);
  }, [selectedRange, modalVisible]);

  // Main metric displays the selected point workout count, or the range total count as fallback
  const displayCount = selectedPoint ? selectedPoint.value : workoutCount;

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
        return `Weekly: ${startStr} - ${endStr}`;
      }

      if (selectedRange === 'Year') {
        const monthStr = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        return `Monthly: ${monthStr}`;
      }

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Default label: Range summary
    const labels: Record<string, string> = {
      Week: 'This Week',
      Month: 'This Month',
      '6Month': '6 Months',
      Year: 'This Year',
    };
    return `${labels[selectedRange] || selectedRange} Total`;
  };

  return (
    <View className="mb-4">
      <MetricWidgetCard
        icon="flame.fill"
        onPress={() => setModalVisible(true)}
        badgeLabel={RANGE_BADGE_LABEL[selectedRange] ?? 'Year'}
        label="Total Workouts"
        value={workoutCount.toLocaleString()}
        unit={`workout${workoutCount !== 1 ? 's' : ''}`}
        primaryColor={primaryColor}
        textColor={textColor}
      />

      <MetricDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        icon="flame.fill"
        title="Workout Frequency"
        rangeOptions={RANGE_OPTIONS}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        primaryValue={displayCount !== null ? displayCount.toLocaleString() : '0'}
        primaryUnit={`workout${displayCount !== 1 ? 's' : ''}`}
        selectionLabel={getSelectionLabel()}
        hasData={history.length > 0}
        isLoading={isLoading}
        emptyMessage="No workout data found. Complete your first workout to see your frequency!"
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
