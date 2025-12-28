import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RaisedButton, useUITheme } from '@mysuite/ui';
import { IconSymbol } from '../ui/icon-symbol';

interface ActiveRoutineHeaderProps {
  routineName: string;
  onClearRoutine: () => void;
  onMenuPress: () => void;
}

export function ActiveRoutineHeader({
  routineName,
  onClearRoutine,
  onMenuPress,
}: ActiveRoutineHeaderProps) {
  const theme = useUITheme();

  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-lg font-semibold mb-2 text-light dark:text-dark flex-1 mr-2" numberOfLines={1}>
        Active Routine - {routineName}
      </Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={onClearRoutine}>
          <Text className="text-xs text-gray-500">Exit</Text>
        </TouchableOpacity>
        <RaisedButton 
            onPress={onMenuPress}
            borderRadius={20}
            className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
        >
            <IconSymbol 
                name="line.3.horizontal" 
                size={20} 
                color={theme.primary} 
            />
        </RaisedButton>
      </View>
    </View>
  );
}
