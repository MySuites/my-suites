import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUITheme } from '@mycsuite/ui';
import { IconSymbol } from '../../components/ui/icon-symbol';

interface ActiveRoutineHeaderProps {
  routineName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClearRoutine: () => void;
}

export function ActiveRoutineHeader({
  routineName,
  isCollapsed,
  onToggleCollapse,
  onClearRoutine,
}: ActiveRoutineHeaderProps) {
  const theme = useUITheme();

  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark flex-1 mr-2" numberOfLines={1}>
        Active Routine - {routineName}
      </Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={onToggleCollapse}
          className="p-2 bg-black/5 dark:bg-white/10 rounded-full"
        >
          <IconSymbol
            name={isCollapsed ? "chevron.down" : "chevron.up"}
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClearRoutine}>
          <Text className="text-xs text-gray-500">Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
