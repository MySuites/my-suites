import * as React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolateColor 
} from 'react-native-reanimated';
import { useUITheme } from './theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
  circle?: boolean;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8, 
  className, 
  style,
  circle = false
}: SkeletonProps) {
  const theme = useUITheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const baseStyle: ViewStyle = {
    width: width as any,
    height: height as any,
    borderRadius: circle ? (typeof height === 'number' ? height / 2 : 999) : borderRadius,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  };

  return (
    <Animated.View 
      className={className}
      style={[baseStyle, animatedStyle, style]} 
    />
  );
}
