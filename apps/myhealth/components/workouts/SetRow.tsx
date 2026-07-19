import React, { useRef } from 'react';
import { View, useWindowDimensions, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    useAnimatedReaction,
    runOnJS,
    interpolate,
    Extrapolation,
    withTiming,
    Easing,
    SharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from "@mysuite/ui";

import { CardWorkoutSet } from './CardWorkoutSet';
import { InlineWorkoutSet } from './InlineWorkoutSet';

export { getExerciseFields } from './getExerciseFields';

interface SetRowProps {
    index: number;
    exercise: any;
    onCompleteSet: (input: { weight?: string | number, bodyweight?: string | number, reps?: string, duration?: string, distance?: string, rpe?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onUpdateLog?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onDeleteSet: (index: number) => void;
    onPressRPE?: (index: number, currentVal: string) => void;
    theme: any;
    latestBodyWeight?: number | null;
    isActiveWorkout?: boolean;
    exercisePrepTime?: number;
    onUpdatePrepTime?: (prepTime: number) => void;
    enableSwipeToDelete?: boolean;
    showCheckbox?: boolean;
    showSetNumber?: boolean;
    isActiveSet?: boolean;
    onPressRestTimer?: () => void;
    // Distinct from isActiveSet, which is also true for preloaded off-screen
    // neighbors (so their wheels are ready ahead of time). This is only true
    // for the page actually visible on screen right now — needed to gate
    // heavy native views (e.g. MapView) that must not render while merely
    // preloaded, since native surfaces can bleed through/composite above
    // neighboring pages regardless of RN-side layout clipping.
    isCurrentPage?: boolean;
    // How long to wait before mounting the heavy wheel/SVG clock, in ms.
    // Forwarded from ExerciseCard's staggered preload delay (see there).
    wheelsReadyDelayMs?: number;
}

export const SetRow = ({
    index,
    exercise,
    onCompleteSet,
    onUncompleteSet,
    onUpdateSetTarget,
    onUpdateLog,
    onDeleteSet,
    onPressRPE,
    theme,
    latestBodyWeight,
    isActiveWorkout = true,
    exercisePrepTime,
    onUpdatePrepTime,
    enableSwipeToDelete = true,
    showCheckbox = true,
    showSetNumber = true,
    isActiveSet = true,
    onPressRestTimer,
    isCurrentPage = true,
    wheelsReadyDelayMs
}: SetRowProps) => {
    const isCompleted = exercise.completedIndices?.includes(index);
    const isEvenSet = (index + 1) % 2 === 0;

    const cardOffset = useSharedValue(0);
    const rowWidth = useSharedValue(0);
    const scale = useSharedValue(1);
    const bgOpacity = useSharedValue(isCompleted ? 1 : 0);
    const prevCompletedRef = useRef(isCompleted);
    const shouldDelete = useRef(false);
    const swipeableRef = useRef<any>(null);

    React.useEffect(() => {
        bgOpacity.value = withTiming(isCompleted ? 1 : 0, { duration: 250 });
        prevCompletedRef.current = isCompleted;
    }, [isCompleted, bgOpacity]);

    const animatedRowStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: cardOffset.value },
                { scale: scale.value }
            ]
        };
    });

    const bgOverlayStyle = useAnimatedStyle(() => {
        return {
            opacity: bgOpacity.value
        };
    });

    const content = (
         <Animated.View 
            className={`${showSetNumber ? 'flex-row items-center h-11' : 'flex-col flex-1 justify-around'} mb-2 px-1 ${isEvenSet ? 'bg-light dark:bg-dark' : ''} rounded-lg overflow-hidden`}
            style={animatedRowStyle}
            onLayout={(e) => {
                rowWidth.value = e.nativeEvent.layout.width;
            }}
         >
              {/* Background completion overlay */}
              {showSetNumber && (
                  <Animated.View 
                      className="absolute inset-0 bg-primary/25 dark:bg-primary-dark/40"
                      style={bgOverlayStyle}
                  />
              )}

              {showSetNumber ? (
                  <InlineWorkoutSet
                      index={index}
                      exercise={exercise}
                      onCompleteSet={onCompleteSet}
                      onUpdateSetTarget={onUpdateSetTarget}
                      onPressRPE={onPressRPE}
                      theme={theme}
                      latestBodyWeight={latestBodyWeight}
                      isActiveWorkout={isActiveWorkout}
                      exercisePrepTime={exercisePrepTime}
                      onUpdatePrepTime={onUpdatePrepTime}
                      showCheckbox={showCheckbox}
                      showSetNumber={showSetNumber}
                      isCompleted={isCompleted}
                  />
              ) : (
                  <CardWorkoutSet
                      index={index}
                      exercise={exercise}
                      onUpdateSetTarget={onUpdateSetTarget}
                      onDeleteSet={onDeleteSet}
                      onPressRPE={onPressRPE}
                      theme={theme}
                      latestBodyWeight={latestBodyWeight}
                      isActiveWorkout={isActiveWorkout}
                      exercisePrepTime={exercisePrepTime}
                      onUpdatePrepTime={onUpdatePrepTime}
                      isActiveSet={isActiveSet}
                      onPressRestTimer={onPressRestTimer}
                      isCompleted={isCompleted}
                      isCurrentPage={isCurrentPage}
                      wheelsReadyDelayMs={wheelsReadyDelayMs}
                  />
              )}
         </Animated.View>
    );

    if (!enableSwipeToDelete) {
        return content;
    }

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={(_, dragX) => (
                <SetSwipeAction 
                    dragX={dragX} 
                    onDelete={() => {
                        swipeableRef.current?.close();
                        onDeleteSet(index);
                    }}
                    onSetReadyToDelete={(ready) => shouldDelete.current = ready}
                    cardOffset={cardOffset}
                    rowWidth={rowWidth}
                />
            )}
            onSwipeableWillOpen={() => {
                if (shouldDelete.current) {
                    swipeableRef.current?.close();
                    onDeleteSet(index); 
                }
            }}
            rightThreshold={40}
            overshootRight={true}
            friction={2}
            containerStyle={{ overflow: 'visible' }}
        >
            {content}
        </Swipeable>
    );
};



// Actions component that monitors drag distance (Adapted for Set Rows)
function SetSwipeAction({ 
    dragX, 
    onDelete,
    onSetReadyToDelete,
    cardOffset,
    rowWidth
}: { 
    dragX: SharedValue<number>; 
    onDelete: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
    cardOffset: SharedValue<number>;
    rowWidth: SharedValue<number>;
}) {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    const TRIGGER_THRESHOLD = -width * 0.45; // 45% swipe to delete
    
    // Monitor drag value to trigger haptic feedback
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                hasTriggered.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                runOnJS(onSetReadyToDelete)(true);
                cardOffset.value = withTiming(-width, { duration: 200, easing: Easing.linear });
            } else if (currentDrag > TRIGGER_THRESHOLD + 20 && hasTriggered.value) {
                hasTriggered.value = false;
                runOnJS(onSetReadyToDelete)(false);
                cardOffset.value = withTiming(0, { duration: 200, easing: Easing.linear });
            }
        }
    );

    const iconStyle = useAnimatedStyle(() => {
        const scale = interpolate(dragX.value, [-60, -20], [1, 0.5], Extrapolation.CLAMP);
        return {
            transform: [{ scale }]
        };
    });

    return (
        <View className="justify-center items-end mb-2 h-11" style={{ width: 80 }}>
             <Animated.View 
                className="bg-error"
                style={[
                    { 
                        position: 'absolute', 
                        right: 0, 
                        height: '100%', 
                        borderRadius: 8, // Rounded corners for the delete action
                        justifyContent: 'center',
                        alignItems: 'center'
                    }, 
                    useAnimatedStyle(() => {
                        const maxW = rowWidth.value > 0 ? rowWidth.value : width;
                        const targetW = -(dragX.value + cardOffset.value);
                        return {
                            width: Math.max(0, Math.min(maxW, targetW)),
                            opacity: interpolate(dragX.value, [-20, 0], [1, 0])
                        };
                    })
                ]} 
            >
                <TouchableOpacity onPress={onDelete} className="flex-1 justify-center items-center w-full">
                     <Animated.View style={iconStyle}>
                          <IconSymbol name="trash.fill" size={20} color="white" />
                     </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
