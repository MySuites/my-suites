import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useUITheme } from '@mycsuite/ui';

interface ActiveRoutineTimelineItemProps {
  item: any;
  index: number;
  dayIndex: number;
  isDayCompleted: boolean;
  activeRoutineLength: number;
  isLastInView: boolean;
  isCollapsed: boolean;
  onJumpToDay: (index: number) => void;
  onWorkoutPress: (workout: any) => void;
  onStartWorkout: (exercises: any[], name?: string, workoutId?: string) => void;
  onMarkComplete: () => void;
  routineName: string;
}

export function ActiveRoutineTimelineItem({
  item,
  index,
  dayIndex,
  isDayCompleted,
  activeRoutineLength,
  isLastInView,
  isCollapsed,
  onJumpToDay,
  onWorkoutPress,
  onStartWorkout,
  onMarkComplete,
  routineName,
}: ActiveRoutineTimelineItemProps) {
  const theme = useUITheme();
  
  const isToday = index === 0;
  const globalDayNum = dayIndex + index + 1;
  const isCompletedToday = isToday && isDayCompleted;

  const dotColor = isCompletedToday
    ? '#4CAF50' // Success Green
    : isToday
    ? theme.primary
    : theme.surface;

  return (
    <TouchableOpacity
      className="flex-row"
      activeOpacity={isToday ? 1 : 0.7}
      onPress={() => {
        if (!isToday && item.originalIndex !== undefined) {
          Alert.alert("Jump to Day", `Skip to ${item.name || "this day"}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => onJumpToDay(item.originalIndex) }
          ]);
        }
      }}
    >
      <View className="w-[30px] items-center">
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: dotColor,
            borderWidth: isToday && !isCompletedToday ? 0 : 2,
            borderColor: isToday
              ? dotColor
              : theme.options?.borderColor || 'rgba(150,150,150,0.3)',
          }}
          className="z-[2] mt-1"
        />

        {!isLastInView && (
          <View
            className="w-[2px] flex-1 bg-surface dark:bg-surface_dark -my-0.5 z-[1]"
          />
        )}

        {isLastInView && !isCollapsed &&
          globalDayNum === activeRoutineLength && (
            <View
              style={{ backgroundColor: theme.surface }}
              className="w-2 h-2 rounded-full -mt-1 z-[2]"
            />
          )}
      </View>

      <View className={`flex-1 pl-2 ${isLastInView ? '' : 'pb-6'}`}>
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="flex-1 mr-2"
            onPress={() => {
              if (item.workout) {
                onWorkoutPress(item.workout);
              } else if (item.type === 'rest') {
                // Maybe show rest details?
              }
            }}
          >
            <Text
              style={{
                fontWeight: isToday ? '700' : '500',
                fontSize: isToday ? 18 : 16,
                textDecorationLine: isCompletedToday ? 'line-through' : 'none',
              }}
              className={`${isCompletedToday ? 'text-gray-500' : isToday ? 'text-apptext dark:text-apptext_dark' : 'text-gray-500'}`}
            >
              {item.type === 'rest'
                ? 'Rest Day'
                : item.name || 'Unknown Workout'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            {!isToday && (
              <TouchableOpacity
                onPress={() => {
                  if (item.originalIndex !== undefined) {
                    Alert.alert("Jump to Day", `Skip to ${item.name || "this day"}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Yes", onPress: () => onJumpToDay(item.originalIndex) }
                    ]);
                  }
                }}
                className="mr-2 bg-primary/10 dark:bg-white/10 px-3 py-1 rounded-md"
              >
                <Text className="text-primary dark:text-white text-xs font-bold">Start</Text>
              </TouchableOpacity>
            )}

            <View className="items-end w-[75px]">
              {item.date && !isToday && (
                <Text className="text-xs text-gray-500 mb-0.5 text-right" numberOfLines={1}>
                  {item.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              )}
              {isToday && !isCompletedToday && (
                <View className="bg-surface dark:bg-surface_dark px-2 py-0.5 rounded">
                  <Text className="text-[10px] text-gray-500 font-bold">
                    TODAY
                  </Text>
                </View>
              )}
              {isCompletedToday && (
                <View className="bg-[#4CAF50]/10 px-2 py-0.5 rounded">
                  <Text className="text-[10px] text-[#4CAF50] font-bold">
                    DONE
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isToday && !isCompletedToday && (
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              className="p-2.5 rounded-lg bg-primary dark:bg-primary_dark flex-1 items-center justify-center"
              onPress={() => {
                if (item?.type === 'workout' && item.workout) {
                  console.log("ActiveRoutineCard: item.workout ID:", item.workout.id);
                  onStartWorkout(item.workout.exercises || [], item.name || routineName, item.workout.id);
                } else {
                  Alert.alert('Rest Day', 'Enjoy your rest!', [
                    { text: 'Mark Complete', onPress: () => onMarkComplete() },
                  ]);
                }
              }}
            >
              <Text className="text-white font-semibold">
                {item?.type === 'rest' ? 'Mark Complete' : 'Start Workout'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-2.5 rounded-lg border border-transparent dark:border-white/10 bg-background dark:bg-background_dark px-4 items-center justify-center"
              onPress={() => onMarkComplete()}
            >
              <Text className="text-apptext dark:text-apptext_dark">Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
