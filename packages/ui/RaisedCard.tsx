import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps, GestureResponderEvent } from 'react-native';
import { cssInterop } from 'nativewind';


cssInterop(Pressable, { className: 'style' });

interface CardProps extends ViewProps {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  delayLongPress?: number;
  activeOpacity?: number;
  disabled?: boolean;
}

export function RaisedCard({ children, style, className, onPress, onLongPress, delayLongPress, activeOpacity = 0.9, ...props }: CardProps) {
  const hasBg = className && className.includes('bg-') && !className.includes('bg-opacity');
  // Cards with their own solid background color (e.g. bg-primary buttons) need
  // a semi-transparent BLACK bottom border — black darkens any color underneath
  // it, so the "raised button" shadow stays visible regardless of the card's
  // color. A light white/5 tint (right for default neutral bg-lighter cards,
  // matching static cards like Recent Activity) is nearly invisible on a solid
  // color and makes the button look flat.
  const bottomBorderClass = onPress
    ? (hasBg
        ? "border-b-[4px] border-b-black/15 dark:border-b-black/25 active:border-b-[0px] active:mt-1"
        : "border-b-[4px] border-b-black/15 dark:border-b-white/5 active:border-b-[0px] active:mt-1")
    : (hasBg
        ? "border-b-[3px] border-b-black/15 dark:border-b-black/25"
        : "border-b-[3px] border-b-black/15 dark:border-b-white/5");
  const defaultBg = hasBg ? '' : 'bg-lighter dark:bg-dark-lighter';
  
  const baseClassName = `${defaultBg} rounded-xl border-x border-t border-black/5 dark:border-white/5 ${bottomBorderClass} ${className || ''}`;
  
  return onPress ? (
    <Pressable 
        style={({ pressed }) => {
            const userStyle = typeof style === 'function' ? (style as any)(pressed) : style;
            return {
                ...(userStyle || {}),
                ...(pressed ? { opacity: activeOpacity } : {})
            };
        }} 
        className={baseClassName} 
        onPress={onPress} 
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
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
