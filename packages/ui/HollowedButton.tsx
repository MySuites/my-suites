import { Text, Pressable, View } from 'react-native';
import type { PressableProps } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

// Enable className support for React Native components (if not already enabled globally)
cssInterop(Pressable, { className: 'style' });
cssInterop(Text, { className: 'style' });

export const HollowedButton = ({ title, className, textClassName, style, ...props }: { title: string; className?: string; textClassName?: string } & PressableProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Neumorphic HollowedCard "Faux Inset" Style
  // Strategy: slightly darker BG + Asymmetric borders to simulate inner shadow/highlight
  const defaultClasses = `
    w-full mb-1 p-4 rounded-xl items-center justify-center
    bg-gray-100 dark:bg-black/20
    border-t-[3px] border-l-[3px] border-b-[1px] border-r-[1px]
    border-t-gray-300 border-l-gray-300 border-b-white border-r-white
    dark:border-t-black/60 dark:border-l-black/60 dark:border-b-white/10 dark:border-r-white/10
  `.replace(/\s+/g, ' ').trim();

  const combined = `${defaultClasses}${className ? ' ' + className : ''}`;

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

  return (
    <Pressable
      {...props}
      className={combined}
      style={style as any}
    >
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
        <>
            {hovered && !pressed && HoverGradient}
            {pressed && PressedGradient}
            <View style={{ zIndex: 1 }}>
                <Text className={textClassName || "text-center text-primary font-bold text-lg"}>{title}</Text>
            </View>
        </>
      )}
    </Pressable>
  );
};
