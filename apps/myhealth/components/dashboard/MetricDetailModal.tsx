import React from 'react';
import { View, Text, Modal, TouchableWithoutFeedback } from 'react-native';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';
import { HollowedCard, useUITheme, Skeleton, IconSymbol, RaisedCard } from '@mysuite/ui';
import { DateRange } from '../ui/TimeSeriesChart';

interface MetricDetailModalProps {
  visible: boolean;
  onClose: () => void;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  title: string;
  headerActions?: React.ReactNode;
  rangeOptions: SegmentedControlOption<DateRange>[];
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  primaryValue: string;
  primaryUnit?: string;
  selectionLabel: string;
  extraInfo?: React.ReactNode;
  hasData: boolean;
  isLoading?: boolean;
  // Fully replaces the header+chart body while loading with no data yet
  // (e.g. BodyWeightCard's skeleton-only first load). When absent, the
  // default behavior keeps the header/value row visible and only
  // skeletons the chart area (Total/Volume cards' behavior).
  loadingPlaceholder?: React.ReactNode;
  emptyMessage: string;
  primaryColor?: string;
  children: React.ReactNode;
}

// Large expanded modal: icon/title header (+ optional extra header actions),
// close button, range picker, big value row, then chart / loading / empty state.
export function MetricDetailModal({
  visible,
  onClose,
  icon,
  title,
  headerActions,
  rangeOptions,
  selectedRange,
  onRangeChange,
  primaryValue,
  primaryUnit,
  selectionLabel,
  extraInfo,
  hasData,
  isLoading,
  loadingPlaceholder,
  emptyMessage,
  primaryColor,
  children,
}: MetricDetailModalProps) {
  const theme = useUITheme();
  const color = primaryColor || theme.primary;

  // Rendered as functions (called only inside the branch that needs them)
  // rather than eagerly-built elements, so an unused branch never
  // constructs its children — e.g. Skeleton must not be touched unless
  // actually loading.
  const renderHeaderBlock = () => (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <SegmentedControl options={rangeOptions} value={selectedRange} onChange={onRangeChange} />
      </View>
      <View className="flex-row items-baseline flex-wrap mt-2">
        <Text
          className="text-3xl font-bold mr-1 text-light dark:text-dark shrink"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {primaryValue}
        </Text>
        {primaryUnit && (
          <Text className="text-light-muted dark:text-dark-muted text-base mr-3">{primaryUnit}</Text>
        )}
        <View className="flex-col justify-center">
          <Text
            className="text-[11px] font-semibold text-light-muted dark:text-dark-muted"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectionLabel}
          </Text>
          {extraInfo}
        </View>
      </View>
    </View>
  );

  const renderDefaultChartSkeleton = () => (
    <View className="h-40 items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
      <Skeleton height="70%" width="90%" borderRadius={4} />
    </View>
  );

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        <View className="w-full bg-light dark:bg-dark-lighter rounded-2xl overflow-hidden p-6" style={{ maxHeight: '90%' }}>
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center gap-2">
              <IconSymbol name={icon} size={20} color={color} />
              <Text className="text-lg font-bold text-light dark:text-dark">{title}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              {headerActions}
              <RaisedCard
                testID="close-modal-btn"
                onPress={onClose}
                style={{ borderRadius: 9999 }}
                className="w-10 h-10 p-0 rounded-full items-center justify-center active:h-9"
              >
                <IconSymbol name="xmark" size={20} color={theme.primary} />
              </RaisedCard>
            </View>
          </View>

          {hasData ? (
            <View className="w-full">
              {renderHeaderBlock()}
              {isLoading ? renderDefaultChartSkeleton() : children}
            </View>
          ) : isLoading ? (
            loadingPlaceholder ?? (
              <View className="w-full">
                {renderHeaderBlock()}
                {renderDefaultChartSkeleton()}
              </View>
            )
          ) : (
            <HollowedCard className="p-8 my-4">
              <Text className="text-light-muted dark:text-dark-muted text-center italic">{emptyMessage}</Text>
            </HollowedCard>
          )}
        </View>
      </View>
    </Modal>
  );
}
