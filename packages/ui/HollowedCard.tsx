import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps extends Omit<PressableProps, 'children'> {
  children?: React.ReactNode | ((state: { pressed: boolean; hovered?: boolean }) => React.ReactNode);
  onPress?: () => void;
  className?: string;
}

// Enable className support for Pressable
cssInterop(Pressable, { className: 'style' });

export function HollowedCard({ children, style, className, onPress, ...props }: CardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseClassName = `
    w-full mb-1 p-3 rounded-xl
    bg-light dark:bg-black/20
    border-t-[3px] border-l-[1px] border-b-[0px] border-r-[1px]
    border-t-black/10 border-l-black/10 border-b-white border-r-black/10
    dark:border-t-black/60 dark:border-l-black/60 dark:border-b-white/10 dark:border-r-black/60
    ${className || ''}
  `.replace(/\s+/g, ' ').trim();
  
  const shadowStyle = { 
    //   overflow: 'hidden' as const
  };

  return onPress ? (
    <Pressable 
        style={[style as any, shadowStyle]} 
        className={baseClassName} 
        onPress={onPress} 
        {...props}
    >
        {(state) => (
            <>
                <View style={{ zIndex: 1 }}>
                    {typeof children === 'function' ? children(state) : children}
                </View>
            </>
        )}
    </Pressable>
  ) : (
    <View style={[style, shadowStyle]} className={baseClassName} {...props}>
        {typeof children === 'function' ? children({ pressed: false }) : children}
    </View>
  );
}
