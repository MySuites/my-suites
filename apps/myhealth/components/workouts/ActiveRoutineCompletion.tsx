import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ActiveRoutineCompletionProps {
  onClearRoutine: () => void;
}

export function ActiveRoutineCompletion({ onClearRoutine }: ActiveRoutineCompletionProps) {
  return (
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
  );
}
