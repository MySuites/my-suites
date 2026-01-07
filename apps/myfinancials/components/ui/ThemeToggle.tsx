import React from 'react';
import { View, Text } from 'react-native';
import { useThemePreference } from '@/app/providers/AppThemeProvider';
import { RaisedCard } from '@mysuite/ui';

export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
      <RaisedCard
        onPress={() => setPreference('light')}
        className={`px-3 py-2 my-0 mr-2 rounded-md items-center justify-center ${preference === 'light' ? 'bg-primary/90 dark:bg-primary-dark/90' : 'bg-light dark:bg-light-lighter'}`}
      >
        <Text className={`font-semibold ${preference === 'light' ? 'text-white' : 'text-primary dark:text-primary-dark'}`}>Light</Text>
      </RaisedCard>

      <RaisedCard
        onPress={() => setPreference('dark')}
        className={`px-3 py-2 my-0 mr-2 rounded-md items-center justify-center ${preference === 'dark' ? 'bg-primary/90 dark:bg-primary-dark/90' : 'bg-light dark:bg-light-lighter'}`}
      >
        <Text className={`font-semibold ${preference === 'dark' ? 'text-white' : 'text-primary dark:text-primary-dark'}`}>Dark</Text>
      </RaisedCard>

      <RaisedCard
        onPress={() => setPreference('system')}
        className={`px-3 py-2 my-0 rounded-md items-center justify-center ${preference === 'system' ? 'bg-primary/90 dark:bg-primary-dark/90' : 'bg-light dark:bg-light-lighter'}`}
      >
        <Text className={`font-semibold ${preference === 'system' ? 'text-white' : 'text-primary dark:text-primary-dark'}`}>System</Text>
      </RaisedCard>
    </View>
  );
};

export default ThemeToggle;
