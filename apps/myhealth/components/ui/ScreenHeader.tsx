import React from 'react';
import { View, Text } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  className?: string; // Allow additional styling if needed, though we aim for consistency
}

export function ScreenHeader({ title, rightAction, leftAction, className }: ScreenHeaderProps) {
  const shadowStyle = {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 6,
      zIndex: 50,
  };

  return (
    <View 
      className={`py-4 pt-16 bg-light dark:bg-dark-lighter rounded-b-3xl ${className || ''}`}
      style={shadowStyle}
    >
      <View className="flex-row justify-center items-center relative">
        {leftAction && (
            <View className="absolute left-5 z-10">
                {leftAction}
            </View>
        )}
        <Text className="text-3xl font-bold text-light dark:text-dark text-center">{title}</Text>
        {rightAction && (
          <View className="absolute right-5">
              {rightAction}
          </View>
        )}
      </View>
    </View>
  );
}
