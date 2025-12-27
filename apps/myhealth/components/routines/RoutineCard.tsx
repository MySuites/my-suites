import React from 'react';
import { View, Text } from 'react-native';
import { ActionCard } from '../../../../packages/ui/ActionCard';
import { RaisedButton } from '../../../../packages/ui/RaisedButton';

interface RoutineCardProps {
  routine: {
    id: string;
    name: string;
    sequence: any[];
    createdAt: string;
  };
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function RoutineCard({ routine, onPress, onLongPress, onDelete, onEdit }: RoutineCardProps) {
  const workoutCount = routine.sequence.filter((s) => s.type === 'workout').length;
  const totalDays = routine.sequence.length;

  return (
    <ActionCard 
        onPress={onPress} 
        onDelete={onDelete} 
        onEdit={onEdit}
        className="p-0 mb-0"
        activeOpacity={0.9}
    >
      <View className="flex-row justify-between items-center mb-0">
        <View className="flex-1 mr-2">
            <Text className="text-lg font-bold text-light dark:text-dark mb-1" numberOfLines={1}>
            {routine.name}
            </Text>
            <Text className="text-sm text-light-muted dark:text-dark-muted">
            {totalDays} Days • {workoutCount} Workouts
            </Text>
        </View>

        <View className="flex-row items-center gap-2">
            <RaisedButton 
                title="Set Active"
                onPress={onPress}
                className="px-4 py-2"
                textClassName="text-white font-semibold"
            />
        </View>
      </View>
    </ActionCard>
  );
}
