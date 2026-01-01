import * as React from 'react';
import { View, Pressable, ViewProps, PressableProps, useWindowDimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue,
    useAnimatedReaction,
    runOnJS,
    interpolate,
    Extrapolation,
    withTiming,
    useDerivedValue,
    SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './IconSymbol';
import { RaisedButton } from './RaisedButton';
import { cssInterop } from 'nativewind';

cssInterop(Pressable, { className: 'style' });

// Constants
const BUTTON_HEIGHT = 40; 
const GAP = 10; // Between buttons
const MARGIN = 0; // Right edge margin (Card has no margin now)
const CARD_GAP = 10; // Padding from the card
const GAP_SMALL = 5;
const TRIGGER_OFFSET = 40;
const BORDER_RADIUS = BUTTON_HEIGHT / 2;

// Animation Constants
const SCALE_RANGE_START = -50;
const OPACITY_RANGE_START = -50;
const OPACITY_RANGE_END = -10;
const EDIT_OPACITY_START = -60;

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



interface CardSwipeActionProps { 
    dragX: SharedValue<number>; 
    sharedDragX: SharedValue<number>;
    onDelete: () => void;
    onEdit?: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
    cardWidth: SharedValue<number>;
}

function CardSwipeAction({ 
    dragX, 
    sharedDragX,
    onDelete,
    onEdit,
    onSetReadyToDelete,
    cardWidth
}: CardSwipeActionProps) {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    // Trigger when card is swiped past 45% of screen width
    const TRIGGER_THRESHOLD = -width * 0.45;
    
    // Layout width for buttons + all spacing
    const hasEdit = !!onEdit;
    const LAYOUT_WIDTH = hasEdit 
        ? (BUTTON_HEIGHT * 2) + GAP + MARGIN + CARD_GAP 
        : BUTTON_HEIGHT + MARGIN + CARD_GAP + GAP_SMALL; 

    // Sync dragX to parent shared value
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            sharedDragX.value = currentDrag;
        }
    );

    // Monitor drag value to trigger haptic feedback on long swipe
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                hasTriggered.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                // Mark parent as ready to delete
                runOnJS(onSetReadyToDelete)(true);
            } else if (currentDrag > TRIGGER_THRESHOLD + TRIGGER_OFFSET && hasTriggered.value) {
                hasTriggered.value = false;
                // Unmark if user swipes back
                runOnJS(onSetReadyToDelete)(false);
            }
        }
    );

    // Delete Button (Red Blob) Animation
    const snapProgress = useDerivedValue(() => {
        const isDeleting = dragX.value < TRIGGER_THRESHOLD;
        return withTiming(isDeleting ? 1 : 0, { duration: 200 });
    });

    const deleteStyle = useAnimatedStyle(() => {
        const drag = dragX.value;
        const absDrag = Math.abs(drag);
        const maxW = cardWidth.value > 0 ? cardWidth.value : width;

        // 1. Calculate Linear State (Dragging)
        // Default relative width
        let linearW = BUTTON_HEIGHT;
        
        // If we overshoot, grow linearly
        if (absDrag > LAYOUT_WIDTH) {
             linearW = BUTTON_HEIGHT + (absDrag - LAYOUT_WIDTH);
        }
        
        // 2. Calculate Snapped State (Full Screen)
        // Fit exactly to screen width (anchored right, so left edge is at 0)
        // Using "width" (window) minus padding for now, but really we want to stick to card bounds
        // If cardWidth is known, let's just fill it. "SCREEN_PADDING" might be irrelevant if we scope to card.
        // Assuming we want to fill the CARD:
        const snappedW = maxW - MARGIN;
        
        // 3. Interpolate
        const progress = snapProgress.value;
        
        // Initial clamp to prevent overflow during drag if drag exceeds card width (unlikely but possible)
        const finalLinearW = Math.min(linearW, maxW);

        const w = interpolate(progress, [0, 1], [finalLinearW, snappedW]);
        const right = interpolate(progress, [0, 1], [0, -MARGIN]);

        const scale = interpolate(
            drag,
            [SCALE_RANGE_START, 0], 
            [1, 0], 
            Extrapolation.CLAMP
        );
        
        const opacity = interpolate(
            drag,
            [OPACITY_RANGE_START, OPACITY_RANGE_END],
            [1, 0],
            Extrapolation.CLAMP
        );
        
        const isDeleting = drag < TRIGGER_THRESHOLD;

        return {
            width: w,
            height: BUTTON_HEIGHT,
            right: right,
            borderRadius: BORDER_RADIUS,
            transform: [{ scale: isDeleting ? 1 : scale }],
            opacity,
            zIndex: isDeleting ? 100 : 0, // High z-index to cover everything
            top: 0,
            position: 'absolute',
        };
    });

    const deleteIconStyle = useAnimatedStyle(() => {
         const scale = interpolate(
            dragX.value,
            [SCALE_RANGE_START, 0],
            [1, 0.5],
            Extrapolation.CLAMP
        );
        return { transform: [{ scale }] };
    });

    // Edit Button Animation
    const editStyle = useAnimatedStyle(() => {
        if (!hasEdit) return { opacity: 0 };

        const drag = dragX.value;
        const absDrag = Math.abs(drag);
        
        let translateX = 0;
        // Slide the edit button left as we expand, keeping it roughly relative to the card's movement
        // or ensuring it gets out of the way of the massive red blob
        // If deleting, slide WAY left to disappear
        if (drag < TRIGGER_THRESHOLD) {
            translateX = -width;
        } 
        else if (absDrag > LAYOUT_WIDTH) {
             // Move left by the excess drag amount to appear "attached" to the card side
             translateX = -(absDrag - LAYOUT_WIDTH);
        }
        
         const scale = interpolate(
            drag,
            [-LAYOUT_WIDTH, SCALE_RANGE_START], 
            [1, 0], 
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            drag,
            [-LAYOUT_WIDTH, EDIT_OPACITY_START],
            [1, 0],
            Extrapolation.CLAMP
        );
        
        const isDeleting = drag < TRIGGER_THRESHOLD;

        return {
            transform: [{ translateX }, { scale }],
            opacity: isDeleting ? 0 : opacity,
        } as any;
    });
    

    return (
        <View style={{ width: LAYOUT_WIDTH }} className="h-full flex-row justify-end items-center">
             
             {/* Gap from Card */}
             <View style={{ width: CARD_GAP }} />

             {/* Edit Button Wrapper */}
             {hasEdit && (
                 <View style={{ marginRight: GAP }} className="items-center justify-center">
                    <Animated.View style={editStyle} className="justify-center items-center">
                        <RaisedButton 
                            onPress={onEdit} 
                            style={{ 
                                width: BUTTON_HEIGHT, 
                                height: BUTTON_HEIGHT,
                            }}
                            borderRadius={BORDER_RADIUS}
                            showGradient={false}
                            variant="custom"
                            // Re-adding p-0 my-0 because default p-4 is too big for 40px button
                            className="bg-info dark:bg-info"
                        >
                            <IconSymbol name="pencil" size={20} color="white" />
                        </RaisedButton>
                    </Animated.View>
                 </View>
             )}

             {/* Delete Button Wrapper */}
            <View style={{ marginRight: MARGIN, width: BUTTON_HEIGHT, height: BUTTON_HEIGHT }} className="items-center justify-center relative">
                {/* 
                    Top part: The Button Anchor. 
                    We use a relative container of 40x40 to match the Edit button's circle slot.
                    The Expanding Red Blob is absolute positioned inside this anchor so it grows from right-to-left 
                    without breaking the layout or alignment.
                */}
                    <Animated.View 
                        style={deleteStyle} 
                    >
                        <RaisedButton 
                            onPress={onDelete} 
                            style={{ 
                                flex: 1,
                            }} 
                            borderRadius={BORDER_RADIUS}
                            showGradient={false}
                            variant="custom"
                            className="bg-danger dark:bg-danger"
                        >
                            <Animated.View style={deleteIconStyle}>
                                <IconSymbol name="trash.fill" size={20} color="white" />
                            </Animated.View>
                        </RaisedButton>
                    </Animated.View>
            </View>
        </View>
    );
}
