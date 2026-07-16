import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BodyWeightChart } from './BodyWeightChart';
import { SegmentedControlOption } from '../ui/SegmentedControl';
import { HollowedCard, useUITheme, Skeleton, IconSymbol, RaisedCard } from '@mysuite/ui';
import { DateRange } from '../ui/TimeSeriesChart';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { MetricDetailModal } from '../dashboard/MetricDetailModal';

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'D', value: 'Day' },
  { label: 'W', value: 'Week' },
  { label: 'M', value: 'Month' },
  { label: '6M', value: '6Month' },
  { label: 'Y', value: 'Year' },
];

const RANGE_BADGE_LABEL: Partial<Record<DateRange, string>> = {
  Day: 'Day',
  Week: 'Week',
  Month: 'Month',
  '6Month': '6M',
  Year: 'Year',
};

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
  const { weightUnit } = useUnitPreference();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedPoint, setSelectedPoint] = React.useState<{ value: number; date: string } | null>(null);

  React.useEffect(() => {
    setSelectedPoint(null);
  }, [selectedRange, modalVisible]);

  const displayWeight = selectedPoint ? selectedPoint.value : (rangeAverage || weight);

  const getSelectionLabel = () => {
    if (!selectedPoint) {
      const labels: Record<string, string> = {
        Day: 'Today',
        Week: 'Week',
        Month: 'Month',
        '6Month': '6 Month',
        Year: 'Year',
      };
      return `${labels[selectedRange] || selectedRange} Average`;
    }

    const d = new Date(selectedPoint.date);
    const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

    if (selectedRange === 'Day') {
      const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `Today at ${timeStr}`;
    }

    if (selectedRange === 'Week' || selectedRange === 'Month') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (selectedRange === '6Month') {
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      const startStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `Weekly Average: ${startStr} - ${endStr}`;
    }

    if (selectedRange === 'Year') {
      const monthStr = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      return `Monthly Average: ${monthStr}`;
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View className="mb-4">
      {/* Widget Layout on Home Screen. RaisedCard is the plain visual
          background here (no onPress) — the tappable regions below are
          separate flex-sibling TouchableOpacitys, not nested inside each
          other or absolutely positioned, so there's no touch-dispatch
          ambiguity between the "open chart" area and the "+" button. */}
      <RaisedCard className="p-4">
        <View className="flex-col gap-2">
          {/* Top Row: opens the chart/trends modal */}
          <TouchableOpacity
            testID="bodyweight-widget-btn"
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center"
          >
            <View
              className="w-8 h-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: (primaryColor || theme.primary) + '15' }} // ~8% opacity tint
            >
              <IconSymbol name="scalemass.fill" size={16} color={primaryColor || theme.primary} />
            </View>

            <View className="flex-row items-center gap-1">
              <Text className="text-[10px] text-light-muted dark:text-dark-muted font-semibold bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                {RANGE_BADGE_LABEL[selectedRange] ?? selectedRange}
              </Text>
              <IconSymbol name="chevron.right" size={12} color={textColor || theme.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Bottom Row: info (opens modal) and "+" (logs weight) are flex
              siblings — neither is nested inside the other, so there's no
              touch-dispatch ambiguity between the two tap targets. */}
          <View className="flex-row justify-between items-end w-full">
            <TouchableOpacity
              testID="bodyweight-widget-info-btn"
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
              className="flex-1 mr-2"
            >
              <Text className="text-[10px] text-light-muted dark:text-dark-muted font-medium mb-0.5" numberOfLines={1}>
                Body Weight
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-lg font-bold text-light dark:text-dark" numberOfLines={1}>
                  {weight ? weight.toLocaleString() : '--'}
                </Text>
                <Text className="text-[10px] text-light-muted dark:text-dark-muted ml-0.5">{weightUnit}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="quick-log-weight-btn"
              onPress={onLogWeight}
              activeOpacity={0.7}
              className="w-8 h-8 items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg active:scale-95"
            >
              <IconSymbol name="plus" size={18} color={primaryColor || theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </RaisedCard>

      <MetricDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        icon="scalemass.fill"
        title="Body Weight Trends"
        headerActions={
          <RaisedCard
            testID="modal-log-weight-btn"
            onPress={() => {
              // Close this modal before opening the weight-entry one.
              // Two RN <Modal>s visible at once is unreliable (iOS in
              // particular) — closing the top one afterward can leave
              // the screen behind it touch-frozen.
              setModalVisible(false);
              onLogWeight();
            }}
            style={{ borderRadius: 9999 }}
            className="w-10 h-10 p-0 items-center justify-center active:h-9"
          >
            <IconSymbol name="plus" size={20} color={theme.primary} />
          </RaisedCard>
        }
        rangeOptions={RANGE_OPTIONS}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        primaryValue={displayWeight ? displayWeight.toLocaleString() : '0'}
        primaryUnit={weightUnit}
        selectionLabel={getSelectionLabel()}
        hasData={!!displayWeight}
        isLoading={isLoading}
        loadingPlaceholder={
          isLoading && !displayWeight ? (
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
          ) : undefined
        }
        emptyMessage="No weight metrics found. Log your first weight to see your progress!"
        primaryColor={primaryColor}
      >
        {history.length > 0 ? (
          <BodyWeightChart
            data={history}
            color={primaryColor}
            textColor={textColor}
            maxPoints={
              selectedRange === 'Day' ? 8 :
              selectedRange === 'Week' ? 7 :
              selectedRange === 'Month' ? 31 :
              selectedRange === '6Month' ? 26 :
              12
            }
            selectedRange={selectedRange}
            aggregation="avg"
            onPointSelect={(point) => {
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
              No data for {selectedRange === 'Day' ? 'today' : selectedRange === '6Month' ? 'this period' : selectedRange === 'Week' ? 'this week' : selectedRange === 'Month' ? 'this month' : 'this year'}.
            </Text>
          </View>
        )}
      </MetricDetailModal>
    </View>
  );
}
