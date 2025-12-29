import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps, useWindowDimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue,
    useAnimatedReaction,
    runOnJS,
} from 'react-native-reanimated';
import { CardSwipeAction } from './CardSwipeAction';
import { cssInterop } from 'nativewind';

cssInterop(Pressable, { className: 'style' });

interface ActionCardProps extends ViewProps {
  onPress?: () => void;
  activeOpacity?: number;
  onDelete?: () => void;
  onEdit?: () => void;
  swipeGroupId?: string;
  activeSwipeId?: string | null;
  onSwipeStart?: (id: string) => void;
}

export function ActionCard({ children, style, className, onPress, activeOpacity = 0.9, onDelete, onEdit, swipeGroupId, activeSwipeId, onSwipeStart, ...props }: ActionCardProps) {
  const { width } = useWindowDimensions();
  
  // Flat ActionCard: Simple background, border, no heavy neumorphic shadows
  const baseClassName = `bg-light dark:bg-dark-lighter rounded-xl p-3 w-full ${className || ''}`;

  // Minimal shadow for separation, but flat style
  const shadowStyle = { 
      overflow: 'hidden' as const
  };

  // Track if we are deep enough to delete
  const shouldDelete = React.useRef(false);
  const swipeableRef = React.useRef<any>(null);
  
  // Shared drag X for coordinating main card movement
  const sharedDragX = useSharedValue(0);
  const cardWidth = useSharedValue(0);
  const TRIGGER_THRESHOLD = -width * 0.45;

  const [isSwiped, setIsSwiped] = React.useState(false);

  useAnimatedReaction(
    () => sharedDragX.value,
    (drag) => {
        // If dragged left (negative) beyond a small threshold, consider it swiped/interacting
        const swiped = drag < -5;
        if (swiped !== isSwiped) {
            runOnJS(setIsSwiped)(swiped);
        }
    },
    [isSwiped]
  );

  const setReadyToDelete = (ready: boolean) => {
      shouldDelete.current = ready;
  };

  React.useEffect(() => {
    if (activeSwipeId && swipeGroupId && activeSwipeId !== swipeGroupId) {
        swipeableRef.current?.close();
    }
  }, [activeSwipeId, swipeGroupId]);

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
        <Animated.View style={[cardContentStyle]} onLayout={(e) => cardWidth.value = e.nativeEvent.layout.width}>
            <Pressable 
            style={[style, shadowStyle]} 
            className={`${className || ''}`} 
            onPress={onPress} 
            {...(props as PressableProps)}
            >
            {({ pressed }) => (
                <View 
                  style={{ opacity: 1 }} 
                  className={`w-full rounded-xl p-3 ${
                    pressed || isSwiped
                      ? 'bg-light-darker dark:bg-dark-lightest' 
                      : 'bg-light dark:bg-dark-lighter'
                  }`}
                >
                    {children}
                </View>
             )}
            </Pressable>
        </Animated.View>
      ) : (
        <Animated.View style={[cardContentStyle]} onLayout={(e) => cardWidth.value = e.nativeEvent.layout.width}>
            <View 
                style={[style, shadowStyle]} 
                className={`rounded-xl p-3 w-full ${className || ''} ${
                    isSwiped 
                    ? 'bg-light-darker dark:bg-dark-lightest' 
                    : 'bg-light dark:bg-dark-lighter'
                }`} 
                {...props}
            >
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
                    cardWidth={cardWidth}
                />
            )}
            overshootRight={true} // Allow overshooting
            friction={2}
            rightThreshold={40}
            onSwipeableWillOpen={() => {
                if (onSwipeStart && swipeGroupId) {
                    onSwipeStart(swipeGroupId);
                }
                // Trigger delete ONLY if we dragged past the deep threshold
                if (shouldDelete.current) {
                    swipeableRef.current?.close();
                    onDelete();
                }
            }}
            containerStyle={{ overflow: 'hidden' }}
        >
            {Content}
        </Swipeable>
      );
  }

  return Content;
}
