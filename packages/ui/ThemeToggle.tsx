import * as React from 'react';
import { View, Text, Switch } from 'react-native';
import { useUITheme } from './index';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const ThemeToggle = ({ preference, setPreference }: ThemeToggleProps) => {
  const theme = useUITheme();
  // If preference is 'system', we default to off (light) for the switch state, 
  // unless user manually toggles it. 
  // Ideally we'd know system state, but for this simple toggle:
  // ON = Dark, OFF = Light.
  const isDark = preference === 'dark';

  return (
    <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
      <Text className="text-base text-light dark:text-dark">Dark Mode</Text>
      <Switch
        value={isDark}
        onValueChange={(val) => setPreference(val ? 'dark' : 'light')}
        trackColor={{ false: theme.card, true: theme.primary }}
        thumbColor={isDark ? "#ffffff" : "#f4f3f4"}
      />
    </View>
  );
};

