import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemePreference } from '../../providers/AppThemeProvider';

export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();

  return (
    <View 
      className="flex-row items-center my-3 p-1 h-12 w-full rounded-full bg-gray-100 dark:bg-dark-darker border-t-[3px] border-l-[3px] border-b-[1px] border-r-[1px] border-t-gray-300 border-l-gray-300 border-b-white border-r-white dark:border-t-black/60 dark:border-l-black/60 dark:border-b-white/10 dark:border-r-white/10"
    >
      <TouchableOpacity
        onPress={() => setPreference('light')}
        className={`flex-1 items-center justify-center rounded-full h-full ${preference === 'light' ? 'bg-light-lighter' : 'bg-transparent'}`}
        activeOpacity={0.8}
      >
        <Text className={`font-semibold ${preference === 'light' ? 'text-black' : 'text-gray-500'}`}>Light</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => setPreference('dark')}
        className={`flex-1 items-center justify-center rounded-full h-full ${preference === 'dark' ? 'bg-dark-lighter' : 'bg-transparent'}`}
        activeOpacity={0.8}
      >
        <Text className={`font-semibold ${preference === 'dark' ? 'text-white' : 'text-gray-500'}`}>Dark</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ThemeToggle;
