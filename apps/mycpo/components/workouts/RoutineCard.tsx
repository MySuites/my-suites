import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';


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
    <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 w-full mb-3 border border-black/5 dark:border-white/10 shadow-sm">
      <View className="flex-row justify-between items-center mb-0">
        <TouchableOpacity 
            className="flex-1 mr-2"
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <Text className="text-lg font-bold text-apptext dark:text-apptext_dark mb-1" numberOfLines={1}>
            {routine.name}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
            {totalDays} Days • {workoutCount} Workouts
            </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
             {onEdit && (
                <TouchableOpacity 
                    onPress={onEdit}
                    className="bg-primary dark:bg-primary_dark px-4 py-2 rounded-lg"
                >
                    <Text className="text-white font-semibold">Edit</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                onPress={onPress}
                className="bg-primary dark:bg-primary_dark px-4 py-2 rounded-lg"
            >
                <Text className="text-white font-semibold">Set Active</Text>
            </TouchableOpacity>

            {onDelete && (
                  <TouchableOpacity 
                    onPress={onDelete}
                    className="p-2 ml-1"
                >
                    <Text className="text-red-500 font-bold text-lg">×</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>
    </View>
  );
}
