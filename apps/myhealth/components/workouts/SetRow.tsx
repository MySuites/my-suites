import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
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
    SharedValue,
    withSequence
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from "@mysuite/ui";
import { DurationTimerPicker } from './DurationTimerPicker';
import { formatSeconds } from '../../utils/formatting';

import { inferEquipment, inferMovementType } from '../../providers/DataRepository';

import { getExerciseDefaultProperties, useWorkoutManager } from '../../providers/WorkoutManagerProvider';

export const getExerciseFields = (properties?: string[], exerciseId?: string) => {
    let props = properties || [];
    
    // Fallback to default properties if available (handles stale data)
    if (exerciseId) {
        const defaults = getExerciseDefaultProperties(exerciseId);
        // Merge unique properties
        const unique = new Set([...props, ...defaults]);
        props = Array.from(unique);
    }

    const lowerProps = props.map(p => p.toLowerCase());
    return { 
        showBodyweight: lowerProps.includes('bodyweight'),
        showWeight: lowerProps.includes('weighted'),
        showReps: lowerProps.includes('reps'),
        showDuration: lowerProps.includes('duration'),
        showDistance: lowerProps.includes('distance'),
        showRPE: lowerProps.includes('weighted') || lowerProps.includes('reps') || lowerProps.includes('duration') || lowerProps.includes('distance') || lowerProps.includes('rpe')
    };
};

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
}

export const SetRow = ({ index, exercise, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onDeleteSet, onPressRPE, theme, latestBodyWeight, isActiveWorkout = true, exercisePrepTime, onUpdatePrepTime, enableSwipeToDelete = true }: SetRowProps) => {
    const [isDurationPickerVisible, setIsDurationPickerVisible] = React.useState(false);
    const [durationAutoStart, setDurationAutoStart] = React.useState(false);
    const shouldDelete = useRef(false);
    const swipeableRef = useRef<any>(null);
    const isCompleted = exercise.completedIndices?.includes(index);
    const isEvenSet = (index + 1) % 2 === 0;

    const { isRpeEnabled } = useWorkoutManager();
    const { showBodyweight, showWeight, showReps, showDuration, showDistance, showRPE: calculatedShowRPE } = getExerciseFields(exercise.properties, exercise.id);
    const showRPE = calculatedShowRPE && isRpeEnabled;

    const equipment = exercise.equipment || inferEquipment(exercise.name);
    const movementType = exercise.movementType || inferMovementType(exercise.name, equipment);
    const isUnilateral = movementType === 'unilateral';

    const getValue = (field: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe') => {
        let val = exercise.setTargets?.[index]?.[field];
        
        // Fallback for legacy data where reps might hold duration/distance
        if ((val === undefined || val === null || val === '') && field === 'duration' && !showReps) {
            val = exercise.setTargets?.[index]?.reps;
        }
        if ((val === undefined || val === null || val === '') && field === 'distance' && !showReps && !showDuration) {
            val = exercise.setTargets?.[index]?.reps;
        }

        if (isActiveWorkout && (val === undefined || val === null || val === '')) {
            if (field === 'reps' || field === 'reps_left' || field === 'reps_right' || field === 'duration' || field === 'distance') {
                const prev = exercise.previousLog?.[index];
                if (prev) {
                    if (field === 'reps' && prev.reps !== undefined && prev.reps !== null) {
                        return prev.reps.toString();
                    }
                    if (field === 'reps_left' && prev.reps_left !== undefined && prev.reps_left !== null) {
                        return prev.reps_left.toString();
                    }
                    if (field === 'reps_right' && prev.reps_right !== undefined && prev.reps_right !== null) {
                        return prev.reps_right.toString();
                    }
                    if (field === 'duration' && prev.duration !== undefined && prev.duration !== null) {
                        return prev.duration.toString();
                    }
                    if (field === 'distance' && prev.distance !== undefined && prev.distance !== null) {
                        return prev.distance.toString();
                    }
                }
                // Fall back to template baseline target if no previous log exists
                if (exercise.reps !== undefined && exercise.reps !== null && exercise.reps !== 0) {
                    return exercise.reps.toString();
                }
                return '';
            }
        }

        if (val === undefined || val === null) return '';
        return val.toString();
    };

    const getTextColor = (val: string) => (val === '') ? 'text-light-muted dark:text-dark-muted' : 'text-light dark:text-dark';

    const handleNumericChange = (text: string, currentVal: string, onUpdate: (v: string) => void) => {
        // Basic validation: allow numbers and a single decimal point
        if (text === '' || /^\d*\.?\d*$/.test(text)) {
             onUpdate(text);
        }
    };

    const getPreviousDisplay = () => {
        const prev = exercise.previousLog?.[index];
        if (!prev) return "-";
        
        const parts = [];
        const formatValue = (val: any, fallback = "0") => (val !== undefined && val !== null && val !== '') ? val : fallback;

        // Weight/Bodyweight part
        if (showWeight) {
            if (showBodyweight) {
                const bw = prev.bodyweight ?? (showBodyweight ? latestBodyWeight : undefined);
                const added = prev.weight;
                if (bw != null && added != null && added > 0) {
                    parts.push(`${bw}+${added}`);
                } else {
                    parts.push(formatValue(bw ?? added));
                }
            } else {
                parts.push(formatValue(prev.weight));
            }
        }

        if (showReps) {
            if (isUnilateral) {
                const l = prev.reps_left ?? prev.reps ?? "0";
                const r = prev.reps_right ?? prev.reps ?? "0";
                parts.push(`${l}L/${r}R`);
            } else {
                parts.push(formatValue(prev.reps));
            }
        }
        if (showDuration) {
            parts.push(prev.duration ? formatSeconds(parseInt(prev.duration) || 0) : "00:00");
        }
        if (showDistance) {
            parts.push(formatValue(prev.distance));
        }
        
        let display = parts.join(" x ");
        if (showRPE && prev.rpe) {
            display += ` @ ${prev.rpe}`;
        }
        return display.length > 0 ? display : "-";
    };

    const cardOffset = useSharedValue(0);
    const rowWidth = useSharedValue(0);
    const scale = useSharedValue(1);
    const bgOpacity = useSharedValue(isCompleted ? 1 : 0);
    const prevCompletedRef = useRef(isCompleted);

    React.useEffect(() => {
        if (isCompleted && !prevCompletedRef.current) {
            scale.value = withSequence(
                withTiming(1.06, { duration: 100 }),
                withTiming(1, { duration: 150 })
            );
        }
        bgOpacity.value = withTiming(isCompleted ? 1 : 0, { duration: 250 });
        prevCompletedRef.current = isCompleted;
    }, [isCompleted, scale, bgOpacity]);

    const animatedRowStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: cardOffset.value },
                { scale: scale.value }
            ]
        };
    });

    const content = (
        <>
             <Animated.View 
                className={`flex-row items-center mb-2 h-11 px-1 ${isEvenSet ? 'bg-light dark:bg-dark' : ''} rounded-lg overflow-hidden`}
                style={animatedRowStyle}
                onLayout={(e) => {
                    rowWidth.value = e.nativeEvent.layout.width;
                }}
             >
                 {/* Background completion overlay */}
                 <Animated.View 
                     className="absolute inset-0 bg-primary/25 dark:bg-primary-dark/40"
                     style={useAnimatedStyle(() => ({ opacity: bgOpacity.value }))}
                 />

                 {/* Set Number */}
                 <View className="w-[30px] items-center justify-center">
                     <Text className="text-xs font-bold text-light dark:text-dark">{index + 1}</Text>
                 </View>

                  <View className="flex-1 items-center justify-center">
                      <View className="px-2 py-0.5 rounded-md min-w-[48px]">
                          <Text 
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              className="text-center text-[10px] font-medium text-light-muted dark:text-dark-muted"
                          >
                             {getPreviousDisplay()}
                          </Text>
                      </View>
                  </View>


                  {showWeight && (
                       <TextInput 
                          className={`w-[52px] bg-transparent text-center text-sm font-bold mx-0.5 p-0 -mt-[6px] ${getTextColor(getValue('weight'))}`}
                          value={getValue('weight')}
                          onChangeText={(t: string) => handleNumericChange(t, getValue('weight'), (v) => onUpdateSetTarget?.(index, 'weight', v))}
                          keyboardType="numeric" 
                          placeholder="-"
                          placeholderTextColor={theme.placeholder || '#888'}
                          textAlignVertical="center"
                          selectTextOnFocus
                      />
                  )}
                  {showReps && (
                      isUnilateral ? (
                          <View className="flex-row items-center w-[54px] mx-0.5 gap-0.5 -mt-[6px]">
                              <TextInput 
                                  className={`flex-1 bg-transparent text-center text-xs font-bold p-0 ${getTextColor(getValue('reps_left'))}`}
                                  value={getValue('reps_left')}
                                  onChangeText={(t: string) => handleNumericChange(t, getValue('reps_left'), (v) => onUpdateSetTarget?.(index, 'reps_left', v))}
                                  keyboardType="numeric" 
                                  placeholder="L"
                                  placeholderTextColor={theme.placeholder || '#888'}
                                  textAlignVertical="center"
                                  selectTextOnFocus
                              />
                              <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold">/</Text>
                              <TextInput 
                                  className={`flex-1 bg-transparent text-center text-xs font-bold p-0 ${getTextColor(getValue('reps_right'))}`}
                                  value={getValue('reps_right')}
                                  onChangeText={(t: string) => handleNumericChange(t, getValue('reps_right'), (v) => onUpdateSetTarget?.(index, 'reps_right', v))}
                                  keyboardType="numeric" 
                                  placeholder="R"
                                  placeholderTextColor={theme.placeholder || '#888'}
                                  textAlignVertical="center"
                                  selectTextOnFocus
                              />
                          </View>
                      ) : (
                          <TextInput 
                              className={`w-[52px] bg-transparent text-center text-sm font-bold mx-0.5 p-0 -mt-[6px] ${getTextColor(getValue('reps'))}`}
                              value={getValue('reps')}
                              onChangeText={(t: string) => handleNumericChange(t, getValue('reps'), (v) => onUpdateSetTarget?.(index, 'reps', v))}
                              keyboardType="numeric" 
                              placeholder="-"
                              placeholderTextColor={theme.placeholder || '#888'}
                              textAlignVertical="center"
                              selectTextOnFocus
                          />
                      )
                  )}
                  {showDuration && (
                      <View className="w-[52px] flex-row items-center justify-center mx-0.5 h-11">
                          <TouchableOpacity 
                              onPress={() => {
                                  setDurationAutoStart(true);
                                  setIsDurationPickerVisible(true);
                              }}
                              className="p-1 mr-1"
                          >
                              <IconSymbol name="play.fill" size={14} color={theme.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                              onPress={() => {
                                  setDurationAutoStart(false);
                                  setIsDurationPickerVisible(true);
                              }}
                              className="p-1"
                          >
                              <Text className={`text-sm font-bold ${getTextColor(getValue('duration'))}`}>
                                  {getValue('duration') !== '' ? formatSeconds(parseInt(getValue('duration')) || 0) : '-'}
                              </Text>
                          </TouchableOpacity>
                      </View>
                  )}
                  {showDistance && (
                      <TextInput 
                          className={`w-[52px] bg-transparent text-center text-sm font-bold mx-0.5 p-0 -mt-[6px] ${getTextColor(getValue('distance'))}`}
                          value={getValue('distance')}
                          onChangeText={(t: string) => handleNumericChange(t, getValue('distance'), (v) => onUpdateSetTarget?.(index, 'distance', v))}
                          keyboardType="numeric" 
                          placeholder="-"
                          placeholderTextColor={theme.placeholder || '#888'}
                          textAlignVertical="center"
                          selectTextOnFocus
                      />
                  )}
                  {showRPE && (
                     <TouchableOpacity 
                         className="w-[40px] items-center justify-center ml-2 mr-0.5"
                         onPress={() => onPressRPE?.(index, getValue('rpe'))}
                     >
                         <Text className={`text-sm font-bold ${getTextColor(getValue('rpe'))}`}>
                             {getValue('rpe') || '-'}
                         </Text>
                     </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                      className={`w-7 h-7 rounded-lg items-center justify-center ml-1 ${isCompleted ? 'bg-primary dark:bg-primary-dark' : 'border-2 border-primary dark:border-primary-dark'}`}
                      onPress={() => onCompleteSet({})}
                  >
                       <IconSymbol name="checkmark" size={16} color={isCompleted ? "#fff" : theme.primary} />
                  </TouchableOpacity>
             </Animated.View>

             <DurationTimerPicker 
                  visible={isDurationPickerVisible}
                  onClose={() => {
                      setIsDurationPickerVisible(false);
                      setDurationAutoStart(false);
                  }}
                  initialValue={parseInt(getValue('duration')) || 0}
                  onSave={(val) => onUpdateSetTarget?.(index, 'duration', val.toString())}
                  isActiveWorkout={isActiveWorkout}
                  autoStart={durationAutoStart}
                  prepTime={exercisePrepTime}
                  onPrepTimeChange={onUpdatePrepTime}
              />
        </>
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
