import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RestTimerPicker } from '../workouts/RestTimerPicker';
import { Exercise } from '../../providers/WorkoutManagerProvider';
import { RaisedCard, IconSymbol } from '@mysuite/ui';
import { SetRow, getExerciseFields } from '../workouts/SetRow';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (setIndex: number, input: { weight?: string | number, bodyweight?: string | number, reps?: string, duration?: string, distance?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onUpdateLog?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (index: number) => void;
    onRemoveExercise?: () => void;
    onPressName?: () => void;
    onUpdateRestTime?: (restTime: number) => void;

    theme: any;
    latestBodyWeight?: number | null;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onAddSet, onDeleteSet, onRemoveExercise, onPressName, onUpdateRestTime, theme, latestBodyWeight }: ExerciseCardProps) {
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.properties, exercise.id);

    return (
        <>
            <View className="flex-row justify-between items-center p-4">
                <TouchableOpacity className="flex-1" onPress={onPressName} disabled={!onPressName}>
                    <Text className="text-lg font-bold text-light dark:text-dark">{exercise.name}</Text>
                    
                    <TouchableOpacity 
                        className="flex-row items-center mt-1"
                        onPress={() => setIsPickerVisible(true)}
                    >
                        <IconSymbol name="timer" size={12} color={theme.bgDark === '#000000' ? '#999' : '#666'} />
                        <Text className="ml-1 text-[11px] font-semibold text-light-muted dark:text-dark-muted">
                            {exercise.restTime ?? 90}s rest
                        </Text>
                    </TouchableOpacity>
                </TouchableOpacity>
                <View className="flex-row items-center gap-3">
                    {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
                    {onRemoveExercise && (
                        <RaisedCard 
                            onPress={onRemoveExercise}
                            className="w-11 h-11 active:h-10 bg-lighter dark:bg-dark-lighter items-center justify-center"
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="trash.fill" size={22} color={theme.danger} />
                        </RaisedCard>
                    )}
                </View>
            </View>

            <View className="p-4">
                {/* Headers */}
                <View className="flex-row mb-2 px-1">
                    <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-light-muted dark:text-dark-muted">SET</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted flex-1">PREVIOUS</Text>
                    {showBodyweight && <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[60px] mx-1 text-light-muted dark:text-dark-muted">BW</Text>}
                    {showWeight && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">LBS</Text>}
                    {showReps && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">REPS</Text>}
                    {showDuration && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">TIME</Text>}
                    {showDistance && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">DIST</Text>}
                    <View className="w-[30px] items-center" />
                </View>

                {/* Render Rows */}
                {Array.from({ length: Math.max(exercise.sets, exercise.logs?.length || 0) }).map((_, i) => (
                    <SetRow 
                        key={i} 
                        index={i}
                        exercise={exercise}
                        onCompleteSet={(input) => onCompleteSet(i, input)}
                        onUncompleteSet={onUncompleteSet}
                        onUpdateSetTarget={onUpdateSetTarget}
                        onUpdateLog={onUpdateLog}
                        onDeleteSet={onDeleteSet}
                        theme={theme}
                        latestBodyWeight={latestBodyWeight}
                    />
                ))}



                {/* Add Set Button */}
                        <TouchableOpacity 
                            onPress={onAddSet}
                            className="flex-row items-center justify-center p-2 mt-1 rounded-lg border border-dashed border-black/10 dark:border-white/10"
                        >
                            <IconSymbol name="plus" size={14} color={theme.primary} />
                            <Text className="ml-2 text-sm text-primary dark:text-primary-dark font-medium">Add Set</Text>
                        </TouchableOpacity>
            </View>

            <RestTimerPicker
                visible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                initialValue={exercise.restTime ?? 90}
                onSave={(val) => {
                    onUpdateRestTime?.(val);
                    setIsPickerVisible(false);
                }}
            />
        </>
    );
}

