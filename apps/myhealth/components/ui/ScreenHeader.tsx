import { View, Text, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  className?: string; // Allow additional styling if needed, though we aim for consistency
}

export function ScreenHeader({ title, rightAction, leftAction, className }: ScreenHeaderProps) {
  const colorScheme = useColorScheme();

  return (
    <BlurView 
      tint={colorScheme === 'dark' ? 'dark' : 'light'}
      intensity={5}
      className={`absolute top-0 left-0 right-0 py-4 pt-16 rounded-b-3xl overflow-hidden bg-light/60 dark:bg-dark/60 ${className || ''}`}
      style={{ zIndex: 50 }}
    >
      <View className="flex-row justify-center items-center relative min-h-[44px]">
        {leftAction && (
            <View className="absolute left-5 z-10 flex-row h-12">
                {leftAction}
            </View>
        )}
        <Text className="text-xl font-bold text-light dark:text-dark text-center flex-1 mx-16" numberOfLines={1}>{title}</Text>
        {rightAction && (
          <View className="absolute right-5 flex-row h-12">
              {rightAction}
          </View>
        )}
      </View>
    </BlurView>
  );
}
