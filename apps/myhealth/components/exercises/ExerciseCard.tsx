import React from 'react';
import { View, Text } from 'react-native';
import { Exercise } from '../../providers/WorkoutManagerProvider';
import { RaisedCard, HollowedCard, IconSymbol } from '@mysuite/ui';
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

    theme: any;
    latestBodyWeight?: number | null;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onAddSet, onDeleteSet, onRemoveExercise, theme, latestBodyWeight }: ExerciseCardProps) {
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.properties);

    return (
        <RaisedCard>

            <View className="flex-row justify-between items-center p-4">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-light dark:text-dark">{exercise.name}</Text>
                </View>
                <View className="flex-row items-center gap-3">
                    {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
                    {onRemoveExercise && (
                        <RaisedCard 
                            onPress={onRemoveExercise}
                            className="w-11 h-11 bg-light dark:bg-dark-lighter items-center justify-center"
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
                {/* Add Set Button */}
                <View className="items-center justify-center mt-1">
                    <HollowedCard 
                        onPress={onAddSet} 
                        className="py-3 w-full items-center justify-center p-3" // Using p-3 to match HollowedCard default and existing py-3
                    >
                        <Text className="text-sm font-semibold text-primary dark:text-primary-dark text-center">
                            + Add Set
                        </Text>
                    </HollowedCard>
                </View>
            </View>
        </RaisedCard>
    );
}

