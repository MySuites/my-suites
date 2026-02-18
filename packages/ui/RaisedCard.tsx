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
  // Flat Design: No shadows, no gradients, thick bottom border
  // Determine border color based on theme context or default manually if needed, 
  // but utility classes handle it best.
  // Using a darker shade for the bottom border to simulate "thickness" depth or just opacity.
  
  const bottomBorderClass = onPress 
    ? "border-b-[4px] border-b-black/15 dark:border-b-black/50 active:border-b-[0px] active:translate-y-[4px]" 
    : "border-b-[3px] border-b-black/15 dark:border-b-white/5";

  const baseClassName = `bg-light dark:bg-dark-lighter rounded-xl border-x border-t border-black/5 dark:border-white/5 ${bottomBorderClass} ${className || ''}`;
  
  // Note: active:translate-y-[4px] and active:border-b-[0px] creates a "button press" effect 
  // where the border disappears and the card moves down.
  // If not desired, just keep border static. User asked for "flat design... thick bottom border". 
  // Usually this implies the retro/neobrutalist click effect, but let's stick to valid border first.
  
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
