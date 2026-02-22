import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps, useWindowDimensions, GestureResponderEvent } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';


cssInterop(Pressable, { className: 'style' });

interface CardProps extends ViewProps {
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity?: number;
  disabled?: boolean;
}

export function RaisedCard({ children, style, className, onPress, activeOpacity = 0.9, ...props }: CardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomBorderClass = onPress 
    ? "border-b-[4px] border-b-black/15 dark:border-b-black/50 active:border-b-[0px] active:mt-1" 
    : "border-b-[3px] border-b-black/15 dark:border-b-white/5";
  const hasBg = className && (className.includes('bg-') && !className.includes('bg-opacity'));
  const defaultBg = hasBg ? '' : 'bg-lighter dark:bg-dark-lighter';
  
  const baseClassName = `${defaultBg} rounded-xl border-x border-t border-black/5 dark:border-white/5 ${bottomBorderClass} ${className || ''}`;
  
  return onPress ? (
    <Pressable 
        style={({ pressed }) => [
            typeof style === 'function' ? (style as any)(pressed) : style,
            pressed && { opacity: activeOpacity }
        ]} 
        className={baseClassName} 
        onPress={onPress} 
        {...(props as PressableProps)}
    >
        {children}
    </Pressable>
  ) : (
    <View style={style} className={baseClassName} {...props}>
        {children}
    </View>
  );
}
