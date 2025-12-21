import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ActiveRoutineHeader } from './ActiveRoutineHeader';
import { ActiveRoutineCompletion } from './ActiveRoutineCompletion';
import { ActiveRoutineTimelineItem } from './ActiveRoutineTimelineItem';

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
  onMarkComplete: () => void;
  onJumpToDay: (index: number) => void;
  onWorkoutPress: (workout: any) => void;
  viewMode: 'next_3' | 'next_7' | 'week';
  onViewModeChange: (mode: 'next_3' | 'next_7' | 'week') => void;
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
  onWorkoutPress,
  viewMode,
  onViewModeChange,
}: ActiveRoutineCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const daysToShow = isCollapsed ? timelineDays.slice(0, 1) : timelineDays;

  return (
    <View className="mb-6">
      <ActiveRoutineHeader
        routineName={activeRoutineObj.name}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onClearRoutine={onClearRoutine}
      />

      <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm">
        {timelineDays.length === 0 ? (
          <ActiveRoutineCompletion onClearRoutine={onClearRoutine} />
        ) : (
          <View className="py-2">
            <View className="flex-row justify-end items-center mb-2 px-4">
              <TouchableOpacity 
                onPress={() => {
                    Alert.alert("View Options", "Choose how many upcoming items to see", [
                        { text: "Next 3 Workouts", onPress: () => onViewModeChange('next_3') },
                        { text: "Next 7 Workouts", onPress: () => onViewModeChange('next_7') },
                        { text: "Next Week", onPress: () => onViewModeChange('week') },
                        { text: "Cancel", style: "cancel" }
                    ]);
                }}
              >
                <Text className="text-primary dark:text-primary_dark font-medium">
                    {viewMode === 'next_3' ? 'Next 3' : viewMode === 'next_7' ? 'Next 7' : 'Next Week'}
                </Text>
              </TouchableOpacity>
            </View>
            {daysToShow.map((item: any, index: number) => (
              <ActiveRoutineTimelineItem
                key={index}
                item={item}
                index={index}
                dayIndex={dayIndex}
                isDayCompleted={isDayCompleted}
                activeRoutineLength={activeRoutineObj.sequence.length}
                isLastInView={index === daysToShow.length - 1}
                isCollapsed={isCollapsed}
                onJumpToDay={onJumpToDay}
                onWorkoutPress={onWorkoutPress}
                onStartWorkout={onStartWorkout}
                onMarkComplete={onMarkComplete}
                routineName={activeRoutineObj.name}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
