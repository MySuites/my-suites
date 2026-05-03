import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { RestTimerPicker } from '../workouts/RestTimerPicker';
import { Exercise } from '../../providers/WorkoutManagerProvider';
import { RaisedCard, IconSymbol } from '@mysuite/ui';
import { SetRow, getExerciseFields } from '../workouts/SetRow';
import { formatRestTime } from '../../utils/formatting';
import { RPEPicker } from '../workouts/RPEPicker';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (setIndex: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance' | 'rpe', value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (index: number) => void;
    onRemoveExercise?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onPressName?: () => void;
    onUpdateRestTime?: (restTime: number) => void;
    onDrag?: () => void;

    theme: any;
    latestBodyWeight?: number | null;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUpdateSetTarget, onAddSet, onDeleteSet, onRemoveExercise, onMoveUp, onMoveDown, onDrag, onPressName, onUpdateRestTime, theme, latestBodyWeight }: ExerciseCardProps) {
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number, right: number } | null>(null);
    const menuButtonRef = useRef<View>(null);
    
    // RPE Picker state
    const [isRPEPickerVisible, setIsRPEPickerVisible] = useState(false);
    const [rpePickerValue, setRPEPickerValue] = useState<string | undefined>(undefined);
    const [rpePickerIndex, setRPEPickerIndex] = useState<number | null>(null);
    
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance, showRPE } = getExerciseFields(exercise.properties, exercise.id);

    const handleOpenMenu = () => {
        menuButtonRef.current?.measure((_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
            // Position the menu below the button, slightly offset
            setMenuPosition({
                top: pageY + height + 5,
                right: 16 // Standard container padding
            });
            setIsMenuVisible(true);
        });
    };

    return (
        <>
            <View className="flex-row justify-between items-center p-4">
                <View className="flex-1 flex-row items-center">
                    <TouchableOpacity 
                        className="flex-1" 
                        onPress={onPressName} 
                        onLongPress={onDrag}
                        delayLongPress={200}
                        disabled={!onPressName && !onDrag}
                    >
                        <Text className="text-lg font-bold text-light dark:text-dark">{exercise.name}</Text>
                        
                        <TouchableOpacity 
                            className="flex-row items-center mt-1"
                            onPress={() => setIsPickerVisible(true)}
                        >
                            <IconSymbol name="timer" size={12} color={theme.bgDark === '#000000' ? '#999' : '#666'} />
                            <Text className="ml-1 text-[11px] font-semibold text-light-muted dark:text-dark-muted">
                                Rest Timer: {formatRestTime(exercise.restTime ?? 90)}
                            </Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
                <View className="flex-row items-center gap-3">
                    {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
                    {onRemoveExercise && (
                        <View ref={menuButtonRef}>
                            <TouchableOpacity 
                                onPress={handleOpenMenu}
                                className="w-11 h-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
                            >
                                <IconSymbol name="ellipsis" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Exercise Menu Modal */}
            <Modal
                visible={isMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <Pressable 
                    className="flex-1"
                    onPress={() => setIsMenuVisible(false)}
                >
                    {/* Dim background for shadow overlay effect */}
                    <View className="flex-1 bg-black/25" />
                    
                    <RaisedCard 
                        className="absolute w-44 p-1.5 bg-light dark:bg-dark-lighter rounded-xl"
                        style={{ 
                            top: menuPosition?.top || 100,
                            right: menuPosition?.right || 16,
                            shadowColor: '#000', 
                            shadowOffset: { width: 0, height: 6 }, 
                            shadowOpacity: 0.15, 
                            shadowRadius: 10, 
                            elevation: 8 
                        }}
                    >



                        <TouchableOpacity 
                            onPress={() => {
                                setIsMenuVisible(false);
                                onRemoveExercise?.();
                            }}
                            className="flex-row items-center p-2.5 rounded-lg active:bg-danger/10"
                        >
                            <IconSymbol name="trash.fill" size={16} color={theme.danger} style={{ marginRight: 10 }} />
                            <Text className="text-danger font-semibold text-sm">Remove</Text>
                        </TouchableOpacity>

                        <View className="h-[1px] bg-black/5 dark:bg-white/5 my-0.5" />

                        <TouchableOpacity 
                            onPress={() => setIsMenuVisible(false)}
                            className="flex-row items-center p-2.5 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                        >
                            <IconSymbol name="xmark" size={16} color={theme.textMuted || '#888'} style={{ marginRight: 10 }} />
                            <Text className="text-light-muted dark:text-dark-muted font-semibold text-sm">Cancel</Text>
                        </TouchableOpacity>
                    </RaisedCard>
                </Pressable>
            </Modal>

            <View className="p-4">
                {/* Headers */}
                <View className="flex-row mb-2 px-1">
                    <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-light-muted dark:text-dark-muted">SET</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted flex-1">PREVIOUS</Text>

                    {showWeight && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">LBS</Text>}
                    {showReps && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">REPS</Text>}
                    {showDuration && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">TIME</Text>}
                    {showDistance && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">DIST</Text>}
                    {showRPE && <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[45px] mx-0.5 text-light-muted dark:text-dark-muted">RPE</Text>}
                    <View className="w-[30px] items-center" />
                </View>

                {/* Render Rows */}
                {Array.from({ length: Math.max(exercise.sets, exercise.logs?.length || 0) }).map((_, i) => (
                    <SetRow 
                        key={i} 
                        index={i}
                        exercise={exercise}
                        onCompleteSet={() => onCompleteSet(i)}
                        onUpdateSetTarget={onUpdateSetTarget}
                        onDeleteSet={onDeleteSet}
                        onPressRPE={(setIdx, val) => {
                            setRPEPickerIndex(setIdx);
                            setRPEPickerValue(val);
                            setIsRPEPickerVisible(true);
                        }}
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

            <RPEPicker 
                visible={isRPEPickerVisible}
                onClose={() => setIsRPEPickerVisible(false)}
                initialValue={rpePickerValue}
                onSave={(val) => {
                    if (rpePickerIndex !== null) {
                        onUpdateSetTarget?.(rpePickerIndex, 'rpe', val.toString());
                    }
                    setIsRPEPickerVisible(false);
                }}
            />
        </>
    );
}
