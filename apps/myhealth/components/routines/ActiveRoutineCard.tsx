import React from 'react';
import { View, Text } from 'react-native';
import { ActiveRoutineTimelineItem } from './ActiveRoutineTimelineItem';
import { RaisedCard, RaisedButton, useUITheme, IconSymbol } from '@mysuite/ui';

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
  onStartWorkout: (exercises: any[], name?: string, workoutId?: string) => void;
  onJumpToDay: (index: number) => void;
  onMenuPress: () => void;
}

export function ActiveRoutineCard({
  activeRoutineObj,
  timelineDays,
  dayIndex,
  isDayCompleted,
  onClearRoutine,
  onStartWorkout,
  onJumpToDay,
  onMenuPress,
}: ActiveRoutineCardProps) {
  const theme = useUITheme();

  const daysToShow = timelineDays;

  return (
    <View className="mb-6">
      <RaisedCard className="p-4">
        {/* Active Routine Header */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold mb-2 text-light dark:text-dark flex-1 mr-2" numberOfLines={1}>
            {activeRoutineObj.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <RaisedButton
              onPress={onClearRoutine}
              borderRadius={20}
              className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
            >
              <IconSymbol 
                  name="stop.fill" 
                  size={18} 
                  color={theme.primary} 
              />
            </RaisedButton>
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
        {/* Active Routine Timeline */}
        <View className="py-2">
          {daysToShow.map((item: any, index: number) => (
            <ActiveRoutineTimelineItem
              key={index}
              item={item}
              index={index}
              dayIndex={dayIndex}
              isDayCompleted={isDayCompleted}
              activeRoutineLength={activeRoutineObj.sequence.length}
              isLastInView={index === daysToShow.length - 1}
              onJumpToDay={onJumpToDay}
              onStartWorkout={onStartWorkout}
              routineName={activeRoutineObj.name}
            />
          ))}
        </View>
      </RaisedCard>
    </View>
  );
}
