import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useUITheme, RaisedCard } from '@mysuite/ui';

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
  const theme = useUITheme();
  
  const isToday = index === 0;
  const globalDayNum = dayIndex + index + 1;
  const isCompletedToday = isToday && isDayCompleted;

  const dotColor = isCompletedToday
    ? '#4CAF50' // Success Green
    : isToday
    ? theme.primary
    : theme.bgDark;

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
            className="w-[2px] flex-1 bg-dark dark:bg-dark-darker -my-0.5 z-[1]"
          />
        )}

        {isLastInView &&
          globalDayNum === activeRoutineLength && (
            <View
              style={{ backgroundColor: theme.bgDark }}
              className="w-2 h-2 rounded-full -mt-1 z-[2]"
            />
          )}
      </View>

      <View className={`flex-1 pl-2 ${isLastInView ? '' : 'pb-6'}`}>
        <View className="flex-row justify-between items-center">
          <View
            className="flex-1 mr-2"
          >
            <Text
              style={{
                fontWeight: isToday ? '700' : '500',
                fontSize: isToday ? 18 : 16,
                textDecorationLine: isCompletedToday ? 'line-through' : 'none',
              }}
              className={`${isCompletedToday ? 'text-light-muted dark:text-dark-muted' : isToday ? 'text-light dark:text-dark' : 'text-light-muted dark:text-dark-muted'}`}
            >
              {item.type === 'rest'
                ? 'Rest Day'
                : item.name || 'Unknown Workout'}
            </Text>
          </View>

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
                <Text className="text-xs text-light-muted dark:text-dark-muted mb-0.5 text-right" numberOfLines={1}>
                  {item.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              )}
              {isToday && !isCompletedToday && (
                <View className="px-2 py-0.5 rounded">
                  <Text className="text-xs text-light-muted dark:text-dark-muted font-bold">
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
            <RaisedCard
              className="flex-1 mr-0 my-0 h-10 items-center justify-center"
              onPress={() => {
                if (item?.type === 'workout' && item.workout) {
                  console.log("ActiveRoutineCard: item.workout ID:", item.workout.id);
                  onStartWorkout(item.workout.exercises || [], item.name || routineName, item.workout.id);
                } else {
                  Alert.alert('Rest Day', 'Enjoy your rest!');
                }
              }}
            >
              <Text className="text-center text-primary font-bold text-lg">
                {item?.type === 'rest' ? 'Mark Complete' : 'Start Workout'}
              </Text>
            </RaisedCard>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
