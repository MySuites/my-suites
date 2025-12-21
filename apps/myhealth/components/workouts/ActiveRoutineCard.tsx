import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useUITheme } from '@mycsuite/ui';
import { IconSymbol } from '../../components/ui/icon-symbol';

interface ActiveRoutineCardProps {
  activeRoutineObj: {
    id: string;
    name: string;
    sequence: any[];
  };
  timelineDays: any[];
  dayIndex: number; // Current day index in the full sequence
  isDayCompleted: boolean;
  onClearRoutine: () => void;
  onStartWorkout: (exercises: any[], name?: string) => void;
  onMarkComplete: () => void;
  onJumpToDay: (index: number) => void;
}

export function ActiveRoutineCard({
  activeRoutineObj,
  timelineDays,
  dayIndex,
  isDayCompleted,
  onClearRoutine,
  onStartWorkout,
  onMarkComplete,
  onJumpToDay,
}: ActiveRoutineCardProps) {
  const theme = useUITheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const daysToShow = isCollapsed ? timelineDays.slice(0, 1) : timelineDays;

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark flex-1 mr-2" numberOfLines={1}>Active Routine - {activeRoutineObj.name}</Text>
        <View className="flex-row items-center gap-4">
             <TouchableOpacity 
                onPress={() => setIsCollapsed(!isCollapsed)} 
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

      <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm">
        {timelineDays.length === 0 ? (
          <View className="p-5 items-center">
            <Text className="text-lg font-semibold text-primary dark:text-primary_dark mb-2">
              Routine Completed!
            </Text>
            <Text className="text-gray-500 text-center">
              You have finished all days in this routine.
            </Text>
            <TouchableOpacity onPress={onClearRoutine} className="p-2.5 rounded-lg border border-transparent dark:border-white/10 bg-background dark:bg-background_dark mt-4">
              <Text className="text-apptext dark:text-apptext_dark">Close Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="py-2">
            {daysToShow.map((item: any, index: number) => {
              const isToday = index === 0; 
              
              
              const isLastInView = index === daysToShow.length - 1;
              const globalDayNum = dayIndex + index + 1;
              const isCompletedToday = isToday && isDayCompleted;


              const dotColor = isCompletedToday
                ? '#4CAF50' // Success Green
                : isToday
                ? theme.primary
                : theme.surface;

              return (
                <TouchableOpacity 
                    key={index} 
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
                      globalDayNum === activeRoutineObj.sequence.length && (
                        <View
                          style={{ backgroundColor: theme.surface }}
                          className="w-2 h-2 rounded-full -mt-1 z-[2]"
                        />
                      )}
                  </View>


                  <View className={`flex-1 pl-2 ${isLastInView ? '' : 'pb-6'}`}>
                    <View className="flex-row justify-between items-center">
                      <Text
                        style={{
                            fontWeight: isToday ? '700' : '500',
                            fontSize: isToday ? 18 : 16,
                            textDecorationLine: isCompletedToday ? 'line-through' : 'none',
                        }}
                        className={`flex-1 mr-2 ${isCompletedToday ? 'text-gray-500' : isToday ? 'text-apptext dark:text-apptext_dark' : 'text-gray-500'}`}
                      >
                        {item.type === 'rest'
                          ? 'Rest Day'
                          : item.name || 'Unknown Workout'}
                      </Text>
                      
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
                              onStartWorkout(item.workout.exercises || [], item.name || activeRoutineObj.name);
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
            })}
          </View>
        )}
      </View>
    </View>
  );
}
