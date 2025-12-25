import React, { useRef } from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps, useWindowDimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue,
} from 'react-native-reanimated';
import { CardSwipeAction } from './CardSwipeAction';

interface CardProps extends ViewProps {
  onPress?: () => void;
  activeOpacity?: number;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function Card({ children, style, className, onPress, activeOpacity = 0.9, onDelete, onEdit, ...props }: CardProps) {
  const { width } = useWindowDimensions();
  // Base styling from RoutineCard
  const baseClassName = `bg-light-darker dark:bg-dark-lighter rounded-xl p-3 w-full mb-1 border border-light dark:border-dark border-t-highlight dark:border-t-highlight-dark ${className || ''}`;
  const shadowStyle = { 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.20, 
      shadowRadius: 3, 
      elevation: 8,
      overflow: 'visible' as const
  };

  // Track if we are deep enough to delete
  const shouldDelete = useRef(false);
  const swipeableRef = useRef<any>(null);
  
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

  const Content = (
    onPress ? (
        <Animated.View style={[cardContentStyle]}>
            <TouchableOpacity 
            style={[style, shadowStyle]} 
            className={baseClassName} 
            onPress={onPress} 
            activeOpacity={activeOpacity}
            {...(props as TouchableOpacityProps)}
            >
            {children}
            </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={[cardContentStyle]}>
            <View style={[style, shadowStyle]} className={baseClassName} {...props}>
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

