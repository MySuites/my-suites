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
    SharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from "@mysuite/ui";

import { getExerciseDefaultProperties } from '../../providers/WorkoutManagerProvider';

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
        showDistance: lowerProps.includes('distance')
    };
};

interface SetRowProps {
    index: number;
    exercise: any;
    onCompleteSet: (input: { weight?: string | number, bodyweight?: string | number, reps?: string, duration?: string, distance?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onUpdateLog?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onDeleteSet: (index: number) => void;
    theme: any;
    latestBodyWeight?: number | null;
}

export const SetRow = ({ index, exercise, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onDeleteSet, theme, latestBodyWeight }: SetRowProps) => {
    const shouldDelete = useRef(false);
    const swipeableRef = useRef<any>(null);
    const log = exercise.logs?.[index];
    const isCompleted = !!log;
    const isEvenSet = (index + 1) % 2 === 0;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.properties, exercise.id);

    const getValue = (field: 'weight' | 'reps' | 'duration' | 'distance') => {
        const target = exercise.setTargets?.[index]?.[field];
        if (target === undefined || target === null) return '';
        return target.toString();
    };

    const getLogValue = (field: 'weight' | 'reps' | 'duration' | 'distance') => {
        const val = log?.[field];
        if (val === undefined || val === null) return '';
        return val.toString();
    };

    const getPreviousDisplay = () => {
        const prev = exercise.previousLog?.[index];
        if (!prev) return "-";
        
        const parts = [];
        const formatValue = (val: any) => (val !== undefined && val !== null && val !== '') ? val : "-";

        // Weight/Bodyweight part
        if (showBodyweight && showWeight) {
            const bw = prev.bodyweight ?? (showBodyweight ? latestBodyWeight : undefined);
            const added = prev.weight;
            if (bw != null && added != null && added > 0) {
                parts.push(`${bw}+${added}`);
            } else {
                parts.push(formatValue(bw ?? added));
            }
        } else if (showBodyweight || showWeight) {
            const val = prev.weight ?? prev.bodyweight ?? (showBodyweight ? latestBodyWeight : undefined);
            parts.push(formatValue(val));
        }

        if (showReps) {
            parts.push(formatValue(prev.reps));
        }
        if (showDuration) {
            parts.push(formatValue(prev.duration));
        }
        if (showDistance) {
            parts.push(formatValue(prev.distance));
        }
        
        const display = parts.join(" x ");
        return display.length > 0 ? display : "-";
    };

    const cardOffset = useSharedValue(0);
    const rowWidth = useSharedValue(0);

    const animatedRowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: cardOffset.value }]
        };
    });



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
             <Animated.View 
                className={`flex-row items-center mb-2 h-11 px-1 ${isEvenSet ? 'bg-light dark:bg-dark rounded-lg' : ''}`}
                style={animatedRowStyle}
                onLayout={(e) => {
                    rowWidth.value = e.nativeEvent.layout.width;
                }}
             >
                 {/* Set Number */}
                 <View className="w-[30px] items-center justify-center">
                     <Text className="text-xs font-bold text-light dark:text-dark">{index + 1}</Text>
                 </View>

                 <Text className="flex-1 text-center text-xs text-light-muted dark:text-dark-muted">
                    {getPreviousDisplay()}
                 </Text>

                 {isCompleted ? (
                      <>
                        {showBodyweight && (
                            <View className="w-[60px] items-center justify-center mx-1">
                                <Text className="text-sm font-bold text-light-muted dark:text-dark-muted">
                                    {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                </Text>
                            </View>
                        )}
                        {showWeight && (
                             <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('weight')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'weight', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showReps && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('reps')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'reps', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDuration && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('duration')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'duration', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                         {showDistance && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('distance')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'distance', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        <TouchableOpacity 
                            className="w-7 h-7 rounded-lg bg-primary dark:bg-primary-dark items-center justify-center ml-1"
                            onPress={() => onUncompleteSet?.(index)}
                        >
                             <IconSymbol name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                      </>
                 ) : (
                      <>
                        {showBodyweight && (
                            <View className="w-[60px] items-center justify-center mx-1">
                                <Text className="text-sm font-bold text-light-muted dark:text-dark-muted">
                                    {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                </Text>
                            </View>
                        )}
                        {showWeight && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('weight')}
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'weight', t)}
                                placeholder={getValue('weight') || "-"} 
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showReps && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('reps')} 
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'reps', t)}
                                placeholder={getValue('reps') || (exercise.reps || 0).toString()}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDuration && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('duration')} 
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'duration', t)}
                                placeholder={getValue('duration') || "-"}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDistance && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('distance')} 
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'distance', t)}
                                placeholder={getValue('distance') || "-"}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder}
                                textAlignVertical="center"
                            />
                        )}
                        <TouchableOpacity 
                            className={`w-7 h-7 rounded-lg items-center justify-center ml-1 border-2 border-primary dark:border-primary-dark`}
                            onPress={() => onCompleteSet({ 
                                weight: showWeight ? getValue('weight') : (showBodyweight ? (latestBodyWeight ?? undefined) : undefined),
                                bodyweight: showBodyweight ? (latestBodyWeight ?? undefined) : undefined,
                                reps: showReps ? (getValue('reps') || (exercise.reps || 0).toString()) : undefined,
                                duration: showDuration ? getValue('duration') : undefined,
                                distance: showDistance ? getValue('distance') : undefined,
                            })}
                        >
                            <IconSymbol name="checkmark" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      </>
                 )}
                 
                 {/* Padding to balance the right side since delete button is gone */}

             </Animated.View>
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
