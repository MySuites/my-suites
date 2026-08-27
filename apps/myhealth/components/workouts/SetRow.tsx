import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { IconSymbol } from "@mysuite/ui";

import { CardWorkoutSet } from './CardWorkoutSet';
import { InlineWorkoutSet } from './InlineWorkoutSet';

export { getExerciseFields } from './getExerciseFields';

interface SetRowProps {
    index: number;
    exercise: any;
    onCompleteSet: (input: { weight?: string | number, bodyweight?: string | number, reps?: string, duration?: string, distance?: string, rpe?: string }) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onDeleteSet: (index: number) => void;
    onPressRPE?: (index: number, currentVal: string) => void;
    theme: any;
    latestBodyWeight?: number | null;
    isActiveWorkout?: boolean;
    exercisePrepTime?: number;
    onUpdatePrepTime?: (prepTime: number) => void;
    showCheckbox?: boolean;
    showSetNumber?: boolean;
    isActiveSet?: boolean;
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
    // Threaded down from the screen level - see ExerciseCardProps for why
    // these are props instead of context reads at this depth.
    isRpeEnabled?: boolean;
    isHapticsEnabled?: boolean;
    isProgressiveOverloadEnabled?: boolean;
    progressiveOverloadRepCeiling?: number;
    isGpsTrackingActive?: boolean;
    activateGpsTrackingIfNeeded?: () => Promise<void>;
}

const SetRowInner = ({
    index,
    exercise,
    onCompleteSet,
    onUpdateSetTarget,
    onDeleteSet,
    onPressRPE,
    theme,
    latestBodyWeight,
    isActiveWorkout = true,
    exercisePrepTime,
    onUpdatePrepTime,
    showCheckbox = true,
    showSetNumber = true,
    isActiveSet = true,
    isCurrentPage = true,
    wheelsReadyDelayMs,
    isRpeEnabled,
    isHapticsEnabled = true,
    isProgressiveOverloadEnabled,
    progressiveOverloadRepCeiling,
    isGpsTrackingActive,
    activateGpsTrackingIfNeeded
}: SetRowProps) => {
    const isCompleted = exercise.completedIndices?.includes(index);
    const isEvenSet = (index + 1) % 2 === 0;

    const bgOpacity = useSharedValue(isCompleted ? 1 : 0);

    React.useEffect(() => {
        bgOpacity.value = withTiming(isCompleted ? 1 : 0, { duration: 250 });
    }, [isCompleted, bgOpacity]);

    const bgOverlayStyle = useAnimatedStyle(() => {
        return {
            opacity: bgOpacity.value
        };
    });

    return (
         <View
            className={`${showSetNumber ? 'flex-row items-center h-11' : 'flex-col flex-1 justify-around'} mb-2 px-1 ${isEvenSet ? 'bg-light dark:bg-dark' : ''} rounded-lg overflow-hidden`}
         >
              {/* Background completion overlay */}
              {showSetNumber && (
                  <Animated.View 
                      className="absolute inset-0 bg-primary/25 dark:bg-primary-dark/40"
                      style={bgOverlayStyle}
                  />
              )}

              {showSetNumber ? (
                  <>
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
                          isRpeEnabled={isRpeEnabled}
                          isHapticsEnabled={isHapticsEnabled}
                      />
                      <TouchableOpacity
                          className="w-6 h-6 items-center justify-center ml-1"
                          onPress={() => {
                              Alert.alert(
                                  'Delete Set',
                                  `Delete set ${index + 1}? This can't be undone.`,
                                  [
                                      { text: 'Cancel', style: 'cancel' },
                                      { text: 'Delete', style: 'destructive', onPress: () => onDeleteSet(index) },
                                  ]
                              );
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                          <IconSymbol name="trash.fill" size={14} color={theme.danger} />
                      </TouchableOpacity>
                  </>
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
                      isCompleted={isCompleted}
                      isCurrentPage={isCurrentPage}
                      wheelsReadyDelayMs={wheelsReadyDelayMs}
                      isRpeEnabled={isRpeEnabled}
                      isHapticsEnabled={isHapticsEnabled}
                      isProgressiveOverloadEnabled={isProgressiveOverloadEnabled}
                      progressiveOverloadRepCeiling={progressiveOverloadRepCeiling}
                      isGpsTrackingActive={isGpsTrackingActive}
                      activateGpsTrackingIfNeeded={activateGpsTrackingIfNeeded}
                  />
              )}
         </View>
    );
};

// Same rationale as ExerciseCard's memo: callback props are recreated per
// render by the caller's inline closures (they close over each set's
// index), so their identity always changes - compare data/display props
// instead and let callbacks always call through to stable functions.
export const SetRow = React.memo(SetRowInner, (prev, next) => {
    return (
        prev.exercise === next.exercise &&
        prev.index === next.index &&
        prev.theme === next.theme &&
        prev.latestBodyWeight === next.latestBodyWeight &&
        prev.isActiveWorkout === next.isActiveWorkout &&
        prev.exercisePrepTime === next.exercisePrepTime &&
        prev.showCheckbox === next.showCheckbox &&
        prev.showSetNumber === next.showSetNumber &&
        prev.isActiveSet === next.isActiveSet &&
        prev.isCurrentPage === next.isCurrentPage &&
        prev.wheelsReadyDelayMs === next.wheelsReadyDelayMs &&
        prev.isRpeEnabled === next.isRpeEnabled &&
        prev.isHapticsEnabled === next.isHapticsEnabled &&
        prev.isProgressiveOverloadEnabled === next.isProgressiveOverloadEnabled &&
        prev.progressiveOverloadRepCeiling === next.progressiveOverloadRepCeiling &&
        prev.isGpsTrackingActive === next.isGpsTrackingActive &&
        prev.activateGpsTrackingIfNeeded === next.activateGpsTrackingIfNeeded
    );
});
