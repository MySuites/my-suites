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

export function HollowedCard({ children, style, className, onPress, activeOpacity = 0.9, onDelete, onEdit, ...props }: CardProps) {
  const { width } = useWindowDimensions();
  // Neumorphic HollowedCard "Faux Inset" Style using NativeWind
  // Strategy: slightly darker BG + Asymmetric borders to simulate inner shadow/highlight
  // Light Mode: slightly darker BG (gray-200), Top-Left Border Darker (gray-300), Bottom-Right Border lighter (white)
  // Dark Mode: darker BG (black/20), Top-Left Border Black, Bottom-Right Border lighter (gray-800)
  
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
