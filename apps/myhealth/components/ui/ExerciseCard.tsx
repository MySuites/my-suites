import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useAnimatedReaction, 
    runOnJS, 
    interpolate, 
    Extrapolation, 
    SharedValue,
    useSharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './icon-symbol';
import { formatSeconds } from '../../utils/formatting';
import { Exercise } from '../../hooks/useWorkoutManager';
import { Card } from './Card';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (input: { weight?: string, reps?: string, duration?: string, distance?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onUpdateLog?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (index: number) => void;
    restSeconds: number;
    theme: any;
}

const getExerciseFields = (type?: string) => {
    switch (type) {
        case 'bodyweight_reps':
            return { showBodyweight: true, showWeight: false, showReps: true, showDuration: false, showDistance: false };
        case 'weighted_bodyweight':
            return { showBodyweight: true, showWeight: true, showReps: true, showDuration: false, showDistance: false };
        case 'duration':
            return { showBodyweight: false, showWeight: false, showReps: false, showDuration: true, showDistance: false };
        case 'distance_duration':
        case 'distance':
            return { showBodyweight: false, showWeight: false, showReps: false, showDuration: true, showDistance: true };
        case 'distance_weight': // Farmer's walk
            return { showBodyweight: false, showWeight: true, showReps: false, showDuration: true, showDistance: false };
        case 'weight_reps':
        default:
            return { showBodyweight: false, showWeight: true, showReps: true, showDuration: false, showDistance: false };
    }
};

// Actions component that monitors drag distance (Adapted for Set Rows)
const SetSwipeAction = ({ 
    dragX, 
    onDelete,
    onSetReadyToDelete
}: { 
    dragX: SharedValue<number>; 
    onDelete: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
}) => {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    const TRIGGER_THRESHOLD = -width * 0.3; // 30% swipe to delete
    
    // Monitor drag value to trigger haptic feedback
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                hasTriggered.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                runOnJS(onSetReadyToDelete)(true);
            } else if (currentDrag > TRIGGER_THRESHOLD + 20 && hasTriggered.value) {
                hasTriggered.value = false;
                runOnJS(onSetReadyToDelete)(false);
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
                style={[
                    { 
                        backgroundColor: '#ef4444', 
                        position: 'absolute', 
                        right: 0, 
                        height: '100%', 
                        borderRadius: 8, // Rounded corners for the delete action
                        justifyContent: 'center',
                        alignItems: 'center'
                    }, 
                    useAnimatedStyle(() => ({
                         width: -dragX.value,
                         opacity: interpolate(dragX.value, [-20, 0], [1, 0])
                    }))
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
};

const SetRow = ({ index, exercise, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onDeleteSet, theme }: any) => {
    const shouldDelete = useRef(false);
    const swipeableRef = useRef<any>(null);
    const log = exercise.logs?.[index];
    const isCompleted = !!log;
    const isEvenSet = (index + 1) % 2 === 0;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.type);

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
             <View className={`flex-row items-center mb-2 h-11 px-1 ${isEvenSet ? 'bg-black/5 dark:bg-white/5 rounded-lg' : ''}`}>
                 {/* Set Number */}
                 <View className="w-[30px] items-center justify-center">
                     <Text className="text-xs font-bold text-black dark:text-white">{index + 1}</Text>
                 </View>

                 <Text className="flex-1 text-center text-xs text-black dark:text-white">-</Text>

                 {isCompleted ? (
                      <>
                        {showBodyweight && (
                            <View className="w-[60px] items-center justify-center mx-1">
                                <Text className="text-sm font-bold text-black/50 dark:text-white/50">BW</Text>
                            </View>
                        )}
                        {showWeight && (
                             <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getLogValue('weight')}
                                onChangeText={(t) => onUpdateLog?.(index, 'weight', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        {showReps && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getLogValue('reps')}
                                onChangeText={(t) => onUpdateLog?.(index, 'reps', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDuration && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getLogValue('duration')}
                                onChangeText={(t) => onUpdateLog?.(index, 'duration', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                         {showDistance && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getLogValue('distance')}
                                onChangeText={(t) => onUpdateLog?.(index, 'distance', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        <TouchableOpacity 
                            className="w-7 h-7 rounded-lg bg-primary dark:bg-primary_dark items-center justify-center ml-1"
                            onPress={() => onUncompleteSet?.(index)}
                        >
                             <IconSymbol name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                      </>
                 ) : (
                      <>
                        {showBodyweight && (
                            <View className="w-[60px] items-center justify-center mx-1">
                                <Text className="text-sm font-bold text-black/50 dark:text-white/50">BW</Text>
                            </View>
                        )}
                        {showWeight && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getValue('weight')}
                                onChangeText={(t) => onUpdateSetTarget?.(index, 'weight', t)}
                                placeholder={getValue('weight') || "-"} 
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        {showReps && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getValue('reps')} 
                                onChangeText={(t) => onUpdateSetTarget?.(index, 'reps', t)}
                                placeholder={getValue('reps') || exercise.reps.toString()}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDuration && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getValue('duration')} 
                                onChangeText={(t) => onUpdateSetTarget?.(index, 'duration', t)}
                                placeholder={getValue('duration') || "-"}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDistance && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-black dark:text-white mx-1 p-0 -mt-[6px]"
                                value={getValue('distance')} 
                                onChangeText={(t) => onUpdateSetTarget?.(index, 'distance', t)}
                                placeholder={getValue('distance') || "-"}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.text || '#000000'}
                                textAlignVertical="center"
                            />
                        )}
                        <TouchableOpacity 
                            className={`w-7 h-7 rounded-lg items-center justify-center ml-1 border-2 border-primary dark:border-primary_dark`}
                            onPress={() => onCompleteSet({ 
                                weight: showWeight ? getValue('weight') : undefined,
                                reps: showReps ? (getValue('reps') || exercise.reps.toString()) : undefined,
                                duration: showDuration ? getValue('duration') : undefined,
                                distance: showDistance ? getValue('distance') : undefined,
                            })}
                        >
                            <IconSymbol name="checkmark" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      </>
                 )}
                 
                 {/* Padding to balance the right side since delete button is gone */}
                 <View className="w-[30px]" /> 
             </View>
        </Swipeable>
    );
};



export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onAddSet, onDeleteSet, restSeconds, theme }: ExerciseCardProps) {
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.type);

    return (
        <Card>

            <View className="flex-row justify-between items-center mb-0">
                <View>
                    <Text className="text-lg font-bold text-black dark:text-white mb-1">{exercise.name}</Text>
                </View>
                {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
            </View>

            <View className="pt-3">
                {/* Headers */}
                <View className="flex-row mb-2 px-1">
                    <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-black dark:text-white">SET</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white flex-1">PREVIOUS</Text>
                    {showBodyweight && <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[60px] mx-1 text-black dark:text-white">BW</Text>}
                    {showWeight && <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white w-[60px] mx-1">LBS</Text>}
                    {showReps && <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white w-[60px] mx-1">REPS</Text>}
                    {showDuration && <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white w-[60px] mx-1">TIME</Text>}
                    {showDistance && <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white w-[60px] mx-1">DIST</Text>}
                    <View className="w-[40px] items-center" />
                    <View className="w-[30px] items-center justify-center" />
                </View>

                {/* Render Rows */}
                {Array.from({ length: Math.max(exercise.sets, exercise.logs?.length || 0) }).map((_, i) => (
                    <SetRow 
                        key={i} 
                        index={i}
                        exercise={exercise}
                        onCompleteSet={onCompleteSet}
                        onUncompleteSet={onUncompleteSet}
                        onUpdateSetTarget={onUpdateSetTarget}
                        onUpdateLog={onUpdateLog}
                        onDeleteSet={onDeleteSet}
                        theme={theme}
                    />
                ))}

                {/* Rest Timer (Compact) */}
                {isCurrent && restSeconds > 0 && (
                     <View className="flex-row items-center justify-center gap-1.5 mt-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        <IconSymbol name="timer" size={16} color={theme.primary} />
                        <Text className="text-sm font-bold text-apptext dark:text-apptext_dark tabular-nums">{formatSeconds(restSeconds)}</Text>
                    </View>
                )}

                {/* Add Set Button */}
                <TouchableOpacity 
                    className="flex-row items-center justify-center pt-3 pb-5 gap-2 border-b border-black/5 dark:border-white/10" 
                    onPress={onAddSet}
                >
                     <IconSymbol name="plus.circle.fill" size={20} color={theme.primary} />
                     <Text className="text-sm font-semibold text-primary dark:text-primary_dark">Add Set</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );
}
