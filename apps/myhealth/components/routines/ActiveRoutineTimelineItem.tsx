import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { RaisedCard } from '@mysuite/ui';

interface ActiveRoutineTimelineItemProps {
  item: any;
  index: number;
  dayIndex: number;
  isDayCompleted: boolean;
  activeRoutineLength: number;
  isLastInView: boolean;
  onJumpToDay: (index: number) => void;
  onStartWorkout: (exercises: any[], name?: string, workoutId?: string) => void;
  routineName: string;
}

export function ActiveRoutineTimelineItem({
  item,
  index,
  dayIndex,
  isDayCompleted,
  activeRoutineLength,
  isLastInView,
  onJumpToDay,
  onStartWorkout,
  routineName,
}: ActiveRoutineTimelineItemProps) {
  const isToday = index === 0;
  const isCompletedToday = isToday && isDayCompleted;

  // Safe date formatting
  const dateStr = React.useMemo(() => {
     if (!item.date) return "";
     const d = typeof item.date === 'string' ? new Date(item.date) : item.date;
     if (isNaN(d.getTime())) return "";
     return d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
     }).toUpperCase();
  }, [item.date]);

  return (
    <RaisedCard
      className={`mx-2 p-4 ${isToday ? 'border-2 border-primary/20 dark:border-primary-dark/20' : ''}`}
      style={{ width: isToday ? 280 : 180, height: 160 }}
    >
      <TouchableOpacity
        activeOpacity={isToday ? 1 : 0.7}
        onPress={() => {
          if (!isToday && item.originalIndex !== undefined) {
             Alert.alert("Jump to Day", `Skip to ${item.name || "this day"}?`, [
               { text: "Cancel", style: "cancel" },
               { text: "Yes", onPress: () => onJumpToDay(item.originalIndex) }
             ]);
          }
        }}
        className="flex-1 justify-between"
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
              {dateStr}
            </Text>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 18,
                lineHeight: 22,
                textDecorationLine: isCompletedToday ? 'line-through' : 'none',
              }}
              className={`${isCompletedToday ? 'text-gray-400 dark:text-gray-500' : 'text-black dark:text-white'}`}
              numberOfLines={2}
            >
              {item.type === 'rest' ? 'Rest Day' : item.name || 'Workout'}
            </Text>
          </View>

          <View>
            {isToday && !isCompletedToday && (
              <View className="bg-primary/10 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] text-primary font-bold">TODAY</Text>
              </View>
            )}
            {isCompletedToday && (
              <View className="bg-[#4CAF50]/10 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] text-[#4CAF50] font-bold">DONE</Text>
              </View>
            )}
          </View>
        </View>

        <View>
          {item.type !== 'rest' && !isCompletedToday ? (
             <TouchableOpacity
                className="h-12 w-full items-center justify-center rounded-xl bg-primary dark:bg-primary-dark active:opacity-80"
                onPress={() => {
                  if (item.workout) {
                    onStartWorkout(item.workout.exercises || [], item.name || routineName, item.workout.id);
                  }
                }}
              >
                <Text className="text-white font-bold text-lg">
                  {isToday ? 'Start Workout' : 'Jump & Start'}
                </Text>
              </TouchableOpacity>
          ) : item.type === 'rest' && isToday && !isCompletedToday ? (
             <TouchableOpacity
                className="h-12 w-full items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800 active:opacity-80"
                onPress={() => onJumpToDay(dayIndex)}
              >
                <Text className="text-gray-600 dark:text-gray-400 font-bold text-lg">Mark Complete</Text>
              </TouchableOpacity>
          ) : (
            <View className="h-12 items-center justify-center">
              <Text className="text-gray-400 dark:text-gray-500 font-medium">
                {isCompletedToday ? 'Finished!' : 'Upcoming'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </RaisedCard>
  );
}
