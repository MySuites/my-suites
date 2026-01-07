import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps extends Omit<PressableProps, 'children'> {
  children?: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

// Enable className support for Pressable
cssInterop(Pressable, { className: 'style' });

export function HollowedCard({ children, style, className, onPress, ...props }: CardProps) {
  // Neumorphic HollowedCard "Faux Inset" Style using NativeWind
  // Strategy: slightly darker BG + Asymmetric borders to simulate inner shadow/highlight
  // Light Mode: slightly darker BG (gray-200), Top-Left Border Darker (gray-300), Bottom-Right Border lighter (white)
  // Dark Mode: darker BG (black/20), Top-Left Border Black, Bottom-Right Border lighter (gray-800)
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseClassName = `
    w-full mb-1 p-3 rounded-xl
    bg-gray-100 dark:bg-black/20
    border-t-[3px] border-l-[3px] border-b-[1px] border-r-[1px]
    border-t-gray-300 border-l-gray-300 border-b-white border-r-white
    dark:border-t-black/60 dark:border-l-black/60 dark:border-b-white/10 dark:border-r-white/10
    ${className || ''}
  `.replace(/\s+/g, ' ').trim();
  
  const shadowStyle = { 
    //   overflow: 'hidden' as const
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
            borderRadius: 12,
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
        style={[style as any, shadowStyle]} 
        className={baseClassName} 
        onPress={onPress} 
        {...props}
    >
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
            <>
                {hovered && !pressed && HoverGradient}
                {pressed && PressedGradient}
                <View style={{ zIndex: 1 }}>
                    {children}
                </View>
            </>
        )}
    </Pressable>
  ) : (
    <View style={[style, shadowStyle]} className={baseClassName} {...props}>
        {children}
    </View>
  );
}
