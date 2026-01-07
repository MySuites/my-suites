import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface SegmentedControlOption<T> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  containerClassName?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  containerClassName = '',
}: SegmentedControlProps<T>) {
  return (
    <View className={`flex-row bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5 ${containerClassName}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className="px-4 py-2 rounded-md"
            style={[
              styles.segment,
              isActive && styles.activeSegment,
            ]}
          >
            <Text
              className="text-xs font-medium text-center"
              style={{ color: isActive ? '#111827' : '#6b7280' }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: 'transparent',
  },
  activeSegment: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
});
