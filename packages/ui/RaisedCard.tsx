import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps, useWindowDimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue,
} from 'react-native-reanimated';
import { CardSwipeAction } from './CardSwipeAction';
import { cssInterop } from 'nativewind';
// cssInterop(Swipeable, { className: 'style' });
import { LinearGradient } from 'expo-linear-gradient';
import { useUITheme } from './theme';

cssInterop(Pressable, { className: 'style' });

interface CardProps extends ViewProps {
  onPress?: () => void;
  activeOpacity?: number;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function RaisedCard({ children, style, className, onPress, activeOpacity = 0.9, onDelete, onEdit, ...props }: CardProps) {
  const { width } = useWindowDimensions();
  const theme = useUITheme();
  // Refined Neumorphic RaisedCard: matches background, uses highlight top-border and soft bottom shadow
  const baseClassName = `bg-light dark:bg-dark-darker rounded-xl p-3 w-full mb-1 border border-light dark:border-dark border-t-highlight dark:border-t-highlight-dark border-l-highlight dark:border-l-highlight-dark ${className || ''}`;
  const shadowStyle = { 
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 4 }, 
      shadowOpacity: 0.15, 
      shadowRadius: 5, 
      elevation: 6,
      overflow: 'visible' as const
  };

  // Track if we are deep enough to delete
  const shouldDelete = React.useRef(false);
  const swipeableRef = React.useRef<any>(null);
  
  // Shared drag X for coordinating main card movement
  const sharedDragX = useSharedValue(0);
  const TRIGGER_THRESHOLD = -width * 0.45;

  const setReadyToDelete = (ready: boolean) => {
      shouldDelete.current = ready;
  };

  // Card Content Animation to snap off-screen
  const cardContentStyle = useAnimatedStyle(() => {
      // If we crossed the threshold, push the card completely off screen
      const drag = sharedDragX.value;
      if (drag < TRIGGER_THRESHOLD) {
          // Snap away
          return {
              transform: [{ translateX: -width - drag }]
          };
      }
      return {
          transform: [{ translateX: 0 }]
      };
  });

  const Gradient = (
    <LinearGradient
        colors={theme.dark 
          ? ['hsla(0, 0%, 50%, 0.2)', 'hsla(0, 0%, 20%, 0.3)'] 
          : ['hsla(0, 0%, 100%, 0.7)', 'hsla(0, 0%, 90%, 0.05)']}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }} // Steep vector to create diagonal look on wide cards
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

  const Content = (
    onPress ? (
        <Animated.View style={[cardContentStyle]}>
            <Pressable 
            style={[style, shadowStyle]} 
            className={baseClassName} 
            onPress={onPress} 
            {...(props as PressableProps)}
            >
             {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
                <>
                    {(pressed || hovered) && Gradient}
                    <View style={{ zIndex: 1 }}>
                        {children}
                    </View>
                </>
             )}
            </Pressable>
        </Animated.View>
      ) : (
        <Animated.View style={[cardContentStyle]}>
            <View style={[style, shadowStyle]} className={baseClassName} {...props}>
            {/* Non-interactive card does not show gradient on hover currently */}
            {children}
            </View>
        </Animated.View>
      )
  );

  if (onDelete) {
      return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={(progress, dragX) => (
                <CardSwipeAction 
                    dragX={dragX}
                    sharedDragX={sharedDragX}
                    onDelete={() => {
                        swipeableRef.current?.close();
                        onDelete();
                    }}
                    onEdit={onEdit}
                    onSetReadyToDelete={setReadyToDelete}
                />
            )}
            overshootRight={true} // Allow overshooting
            friction={2}
            rightThreshold={40}
            onSwipeableWillOpen={() => {
                // Trigger delete ONLY if we dragged past the deep threshold
                if (shouldDelete.current) {
                    swipeableRef.current?.close();
                    onDelete();
                }
            }}
            containerStyle={{ overflow: 'visible' }}
        >
            {Content}
        </Swipeable>
      );
  }

  return Content;
}
