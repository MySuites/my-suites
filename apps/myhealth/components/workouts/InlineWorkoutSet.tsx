import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { DurationTimerPicker } from './DurationTimerPicker';
import { formatSeconds } from '../../utils/formatting';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { inferEquipment, inferMovementType } from '../../providers/DataRepository';
import { IconSymbol } from "@mysuite/ui";
import { getExerciseFields } from './getExerciseFields';
import { getEffectiveBodyweightLoad } from '../../utils/workout-logic';

interface InlineWorkoutSetProps {
    index: number;
    exercise: any;
    onCompleteSet: (input: { weight?: string | number, bodyweight?: string | number, reps?: string, duration?: string, distance?: string, rpe?: string }) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onPressRPE?: (index: number, currentVal: string) => void;
    theme: any;
    latestBodyWeight?: number | null;
    isActiveWorkout?: boolean;
    exercisePrepTime?: number;
    onUpdatePrepTime?: (prepTime: number) => void;
    showCheckbox?: boolean;
    showSetNumber?: boolean;
    isCompleted: boolean;
}

export function InlineWorkoutSet({
    index,
    exercise,
    onCompleteSet,
    onUpdateSetTarget,
    onPressRPE,
    theme,
    latestBodyWeight,
    isActiveWorkout = true,
    exercisePrepTime,
    onUpdatePrepTime,
    showCheckbox = true,
    showSetNumber = true,
    isCompleted
}: InlineWorkoutSetProps) {
    const [isDurationPickerVisible, setIsDurationPickerVisible] = React.useState(false);
    const [durationAutoStart, setDurationAutoStart] = React.useState(false);

    const { isRpeEnabled } = useWorkoutManager();
    const { showBodyweight, showWeight, showReps, showDuration, showDistance, showRPE: calculatedShowRPE } = getExerciseFields(exercise.properties, exercise.id);
    const showRPE = calculatedShowRPE && isRpeEnabled;

    const equipment = exercise.equipment || inferEquipment(exercise.name);
    const movementType = exercise.movementType || inferMovementType(exercise.name, equipment);
    const isUnilateral = movementType === 'unilateral';

    const getValue = (field: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe') => {
        let val = exercise.setTargets?.[index]?.[field];
        
        if ((val === undefined || val === null || val === '') && field === 'duration' && !showReps) {
            val = exercise.setTargets?.[index]?.reps;
        }
        if ((val === undefined || val === null || val === '') && field === 'distance' && !showReps && !showDuration) {
            val = exercise.setTargets?.[index]?.reps;
        }

        // Only fall back to the previous log / exercise default when the field
        // has genuinely never been touched (val === undefined). An explicitly
        // cleared field (val === '') must stay empty, otherwise the input
        // snaps back to a non-empty value the instant the user backspaces it,
        // making it impossible to clear the field or type a fresh "0".
        if (isActiveWorkout && (val === undefined || val === null)) {
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
        if (text === '' || /^\d*\.?\d*$/.test(text)) {
             onUpdate(text);
        }
    };

    const getPreviousDisplay = () => {
        const prev = exercise.previousLog?.[index];
        if (!prev) return "-";
        
        const parts = [];
        const formatValue = (val: any, fallback = "0") => (val !== undefined && val !== null && val !== '') ? val : fallback;

        if (showWeight) {
            if (showBodyweight) {
                const bw = prev.bodyweight ?? getEffectiveBodyweightLoad(exercise, latestBodyWeight);
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

    return (
        <>
            {/* Set Number */}
            {showSetNumber && (
                <View className="w-[30px] items-center justify-center">
                    <Text className="text-xs font-bold text-light dark:text-dark">{index + 1}</Text>
                </View>
            )}

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
            {showCheckbox ? (
                <TouchableOpacity 
                    className={`w-7 h-7 rounded-lg items-center justify-center ml-1 ${isCompleted ? 'bg-primary dark:bg-primary-dark' : 'border-2 border-primary dark:border-primary-dark'}`}
                    onPress={() => onCompleteSet({})}
                >
                     <IconSymbol name="checkmark" size={16} color={isCompleted ? "#fff" : theme.primary} />
                </TouchableOpacity>
            ) : (
                <View className="w-7 ml-1" />
            )}

            <DurationTimerPicker 
                visible={isDurationPickerVisible}
                onClose={() => {
                    setIsDurationPickerVisible(false);
                    setDurationAutoStart(false);
                }}
                initialValue={parseInt(getValue('duration')) || 0}
                onSave={(val) => {
                    onUpdateSetTarget?.(index, 'duration', val.toString());
                }}
                isActiveWorkout={isActiveWorkout}
                autoStart={durationAutoStart}
                prepTime={exercisePrepTime}
                onPrepTimeChange={onUpdatePrepTime}
            />
        </>
    );
}
