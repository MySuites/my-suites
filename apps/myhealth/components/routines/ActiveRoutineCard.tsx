import React from 'react';
import { View, ScrollView } from 'react-native';
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
  onStartWorkout: (exercises: any[], name?: string, workoutId?: string) => void;
  onJumpToDay: (index: number) => void;
  onMenuPress: () => void;
}

export function ActiveRoutineCard({
  activeRoutineObj,
  timelineDays,
  dayIndex,
  isDayCompleted,
  onStartWorkout,
  onJumpToDay,
  onMenuPress,
}: ActiveRoutineCardProps) {

  // Calculate snap offsets for mixed widths (280 for Today, 240 for others)
  const snapToOffsets = React.useMemo(() => {
    const offsets = [0];
    let current = 0;
    timelineDays.forEach((_, i) => {
      const width = i === 0 ? 280 : 180;
      current += width + 16; // width + horizontal margins (mx-2 = 8+8)
      offsets.push(current);
    });
    return offsets;
  }, [timelineDays]);

  return (
    <View className="mb-6">
      {/* Horizontal Cards Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToOffsets={snapToOffsets}
        snapToAlignment="start"
        className="-mx-4"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {timelineDays.map((item: any, index: number) => (
          <ActiveRoutineTimelineItem
            key={index}
            item={item}
            index={index}
            dayIndex={dayIndex}
            isDayCompleted={isDayCompleted}
            activeRoutineLength={activeRoutineObj.sequence.length}
            isLastInView={index === timelineDays.length - 1}
            onJumpToDay={onJumpToDay}
            onStartWorkout={onStartWorkout}
            routineName={activeRoutineObj.name}
          />
        ))}
      </ScrollView>
    </View>
  );
}
