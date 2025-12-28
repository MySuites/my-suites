import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ActiveRoutineHeader } from './ActiveRoutineHeader';
import { ActiveRoutineCompletion } from './ActiveRoutineCompletion';
import { ActiveRoutineTimelineItem } from './ActiveRoutineTimelineItem';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';
import { RaisedCard, useUITheme } from '@mysuite/ui';
import { IconSymbol } from '../ui/icon-symbol';

type ViewMode = 'next_3' | 'next_7' | 'week';

const VIEW_MODE_OPTIONS: SegmentedControlOption<ViewMode>[] = [
  { label: 'Next 3', value: 'next_3' },
  { label: 'Next 7', value: 'next_7' },
  { label: 'Week', value: 'week' },
];

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
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onMenuPress: () => void;
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
  onMenuPress,
}: ActiveRoutineCardProps) {
  const theme = useUITheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const daysToShow = isCollapsed ? timelineDays.slice(0, 1) : timelineDays;

  return (
    <View className="mb-6">
      <RaisedCard className="p-4">
        <ActiveRoutineHeader
          routineName={activeRoutineObj.name}
          onClearRoutine={onClearRoutine}
          onMenuPress={onMenuPress}
        />
        {timelineDays.length === 0 ? (
          <ActiveRoutineCompletion onClearRoutine={onClearRoutine} />
        ) : (
          <View className="py-2">
            <View className="flex-row justify-end items-center mb-4 px-1 gap-2">
              <SegmentedControl
                options={VIEW_MODE_OPTIONS}
                value={viewMode}
                onChange={onViewModeChange}
              />
              <TouchableOpacity
                onPress={() => setIsCollapsed(!isCollapsed)}
                className="p-2 bg-light dark:bg-dark rounded-xl h-[28px] w-[28px] items-center justify-center"
              >
                <IconSymbol
                  name={isCollapsed ? "chevron.down" : "chevron.up"}
                  size={16}
                  color={theme.primary}
                />
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
      </RaisedCard>
    </View>
  );
}
