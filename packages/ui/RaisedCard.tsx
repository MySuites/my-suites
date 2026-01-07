import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps, useWindowDimensions, GestureResponderEvent } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

cssInterop(Pressable, { className: 'style' });

interface CardProps extends ViewProps {
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity?: number;
  disabled?: boolean;
}

export function RaisedCard({ children, style, className, onPress, activeOpacity = 0.9, ...props }: CardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  // Refined Neumorphic RaisedCard: matches background, uses highlight top-border and soft bottom shadow
  const baseClassName = `bg-light dark:bg-dark-lighter rounded-xl border border-light dark:border-dark border-t-highlight dark:border-t-highlight-dark border-l-highlight dark:border-l-highlight-dark ${className || ''}`;
  const shadowStyle = { 
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 4 }, 
      shadowOpacity: 0.15, 
      shadowRadius: 5, 
      elevation: 6,
      overflow: 'visible' as const
  };

  const HoverGradient = (
    <LinearGradient
        colors={isDark 
          ? ['hsla(0, 0%, 15%, 0.3)', 'hsla(0, 0%, 0%, 0.4)'] 
          : ['hsla(0, 0%, 98%, 0.85)', 'hsla(0, 0%, 90%, 0.15)']}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 3 }}
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12, // matches rounded-xl
            zIndex: -1,
        }}
        pointerEvents="none"
    />
  );

  const PressedGradient = (
    <LinearGradient
        colors={isDark 
            ? ['hsla(0, 0%, 0%, 0.3)', 'hsla(0, 0%, 0%, 0.4)'] 
            : ['hsla(0, 0%, 80%, 0.1)', 'hsla(0, 0%, 60%, 0.05)']}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
            zIndex: -1,
        }}
        pointerEvents="none"
    />
  );

  return onPress ? (
    <Pressable 
        style={[style, shadowStyle]} 
        className={baseClassName} 
        onPress={onPress} 
        {...(props as PressableProps)}
    >
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => {
            return (
        <>
            {hovered && !pressed && HoverGradient}
            {pressed && PressedGradient}
            <View style={{ zIndex: 1 }}>
                {children}
            </View>
        </>
        );
        }}
    </Pressable>
  ) : (
    <View style={[style, shadowStyle]} className={baseClassName} {...props}>
        {/* Non-interactive card does not show gradient on hover currently */}
        {children}
    </View>
  );
}
