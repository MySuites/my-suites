import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useUITheme } from '@mysuite/ui';

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
  const theme = useUITheme();
  return (
    <View className={`flex-row bg-light/50 dark:bg-dark/50 rounded-lg p-0.5 ${containerClassName}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className="flex-1 py-1.5 rounded-md items-center justify-center"
            style={[
              styles.segment,
              isActive && {
                backgroundColor: theme.bgLight,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
          >
            <Text
              className="text-xs font-medium text-center"
              style={{ color: isActive ? theme.text : theme.textMuted }}
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
});
