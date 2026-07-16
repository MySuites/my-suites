import React from 'react';
import { View, Text } from 'react-native';
import { IconSymbol, RaisedCard, useUITheme } from '@mysuite/ui';

interface MetricWidgetCardProps {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  onPress: () => void;
  badgeLabel: string;
  label: string;
  value: string;
  unit?: string;
  primaryColor?: string;
  textColor?: string;
  testID?: string;
}

// Small collapsed home-screen widget: icon badge + range badge/chevron row,
// then a label + big value row. Tapping anywhere opens the detail modal.
export function MetricWidgetCard({
  icon,
  onPress,
  badgeLabel,
  label,
  value,
  unit,
  primaryColor,
  textColor,
  testID,
}: MetricWidgetCardProps) {
  const theme = useUITheme();
  const color = primaryColor || theme.primary;

  return (
    <RaisedCard
      testID={testID}
      onPress={onPress}
      className="p-4 active:opacity-90"
      style={{ borderRadius: 16 }}
    >
      <View className="flex-col gap-2">
        <View className="flex-row justify-between items-center">
          <View
            className="w-8 h-8 items-center justify-center rounded-xl"
            style={{ backgroundColor: color + '15' }} // ~8% opacity tint
          >
            <IconSymbol name={icon} size={16} color={color} />
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] text-light-muted dark:text-dark-muted font-semibold bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
              {badgeLabel}
            </Text>
            <IconSymbol name="chevron.right" size={12} color={textColor || theme.textMuted} />
          </View>
        </View>

        <View>
          <Text className="text-[10px] text-light-muted dark:text-dark-muted font-medium mb-0.5" numberOfLines={1}>
            {label}
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-lg font-bold text-light dark:text-dark" numberOfLines={1}>
              {value}
            </Text>
            {unit && (
              <Text className="text-[10px] text-light-muted dark:text-dark-muted ml-0.5">{unit}</Text>
            )}
          </View>
        </View>
      </View>
    </RaisedCard>
  );
}
