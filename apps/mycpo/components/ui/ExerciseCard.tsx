import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { formatSeconds } from '../../utils/formatting';
import { Exercise } from '../../hooks/useWorkoutManager';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (input: { weight?: string, reps?: string, duration?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps', value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (index: number) => void;
    restSeconds: number;
    theme: any;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onAddSet, onDeleteSet, restSeconds, theme }: ExerciseCardProps) {
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    // Helper to get value for inputs
    const getValue = (i: number, field: 'weight' | 'reps') => {
        const target = exercise.setTargets?.[i]?.[field];
        if (target === undefined || target === null) return '';
        return target.toString();
    };

    return (
        <View className={`bg-surface dark:bg-surface_dark rounded-2xl p-4 mb-3 w-full`}>

            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-lg font-bold text-black dark:text-white mb-1">{exercise.name}</Text>
                    <Text className="text-sm text-black dark:text-white">Target: {exercise.sets} sets • {exercise.reps} reps</Text>
                </View>
                {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
            </View>

            <View className="pt-3">
                {/* Headers */}
                <View className="flex-row mb-2 px-1">
                    <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-black dark:text-white">SET</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white flex-1">PREVIOUS</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white w-[60px] mx-1">LBS</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-black dark:text-white w-[60px] mx-1">REPS</Text>
                    <View className="w-[40px] items-center" />
                    <View className="w-[30px] items-center justify-center" />
                </View>

                {/* Render Rows */}
                {Array.from({ length: Math.max(exercise.sets, exercise.logs?.length || 0) }).map((_, i) => {
                    const log = exercise.logs?.[i];
                    const isCompleted = !!log;
                    const isCurrentSet = !isCompleted && i === (exercise.logs?.length || 0);
                    
                    return (
                        <View key={i} className={`flex-row items-center mb-2 h-11 bg-surface dark:bg-surface_dark rounded-lg px-1 ${isCurrentSet ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                            {/* Set Number */}
                            <View className="w-[30px] items-center justify-center">
                                <Text className="text-xs font-bold text-black dark:text-white">{i + 1}</Text>
                            </View>


                            <Text className="flex-1 text-center text-xs text-black dark:text-white">-</Text>

                            {/* Inputs / Values */}
                            {isCompleted ? (
                                <>
                                    <Text className="w-[60px] text-center text-sm font-bold text-black dark:text-white mx-1">{log.weight}</Text>
                                    <Text className="w-[60px] text-center text-sm font-bold text-black dark:text-white mx-1">{log.reps}</Text>
                                    <TouchableOpacity 
                                        className="w-9 h-9 rounded-lg bg-primary dark:bg-primary_dark items-center justify-center ml-1"
                                        onPress={() => onUncompleteSet?.(i)}
                                    >
                                         <IconSymbol name="checkmark" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TextInput 
                                        className="w-[60px] h-9 bg-transparent rounded-lg text-center text-base font-bold text-black dark:text-white mx-1"
                                        value={getValue(i, 'weight')}
                                        onChangeText={(t) => onUpdateSetTarget?.(i, 'weight', t)}
                                        placeholder={getValue(i, 'weight') || "-"} 
                                        keyboardType="numeric" 
                                        placeholderTextColor={theme.text || '#000000'}
                                    />
                                    <TextInput 
                                        className="w-[60px] h-9 bg-transparent rounded-lg text-center text-base font-bold text-black dark:text-white mx-1"
                                        value={getValue(i, 'reps')} 
                                        onChangeText={(t) => onUpdateSetTarget?.(i, 'reps', t)}
                                        placeholder={getValue(i, 'reps') || exercise.reps.toString()}
                                        keyboardType="numeric" 
                                        placeholderTextColor={theme.text || '#000000'}
                                    />
                                    <TouchableOpacity 
                                        className={`w-9 h-9 rounded-lg items-center justify-center ml-1 border-2 border-primary dark:border-primary_dark`}
                                        onPress={() => onCompleteSet({ 
                                            weight: getValue(i, 'weight'), 
                                            reps: getValue(i, 'reps') || exercise.reps.toString() 
                                        })}
                                    >
                                        <IconSymbol name="checkmark" size={20} color={theme.primary} />
                                    </TouchableOpacity>
                                </>
                            )}
                            
                            {/* Delete Action */}
                            <TouchableOpacity className="w-[30px] items-center justify-center" onPress={() => onDeleteSet(i)}>
                                <IconSymbol name="trash" size={16} color={theme.icon || '#9ca3af'} />
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Rest Timer (Compact) */}
                {isCurrent && restSeconds > 0 && (
                     <View className="flex-row items-center justify-center gap-1.5 mt-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        <IconSymbol name="timer" size={16} color={theme.primary} />
                        <Text className="text-sm font-bold text-apptext dark:text-apptext_dark tabular-nums">{formatSeconds(restSeconds)}</Text>
                    </View>
                )}

                {/* Add Set Button */}
                <TouchableOpacity 
                    className="flex-row items-center justify-center py-3 mt-2 gap-2 border-t border-black/5 dark:border-white/10" 
                    onPress={onAddSet}
                >
                     <IconSymbol name="plus.circle.fill" size={20} color={theme.primary} />
                     <Text className="text-sm font-semibold text-primary dark:text-primary_dark">Add Set</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
