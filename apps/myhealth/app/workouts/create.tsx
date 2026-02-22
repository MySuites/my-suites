import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { useUITheme as useTheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useWorkoutDraft } from '../../hooks/workouts/useWorkoutDraft';
import { default as ExercisesScreen } from '../../app/exercises/index';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { WorkoutDraftExerciseItem } from '../../components/workouts/WorkoutDraftExerciseItem';

export default function CreateWorkoutScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { setIsHidden } = useFloatingButton();
    const { latestBodyWeight } = useActiveWorkout();
    
    useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

    const { saveWorkout } = useWorkoutManager();

    const [workoutDraftName, setWorkoutDraftName] = useState("");
    
    const {
        workoutDraftExercises,
        addExercise,
        removeExercise,
        moveExercise,
        updateSetTarget,
        addSet,
        removeSet
    } = useWorkoutDraft([]);

    const [isSaving, setIsSaving] = useState(false);

    const [isAddingExercise, setIsAddingExercise] = useState(false);

    const [expandedDraftExerciseIndex, setExpandedDraftExerciseIndex] = useState<number | null>(null);

    async function handleSaveWorkoutDraft() {
        if (!workoutDraftName.trim()) {
            Alert.alert("Required", "Please enter a workout name");
            return;
        }

        setIsSaving(true);
        saveWorkout(workoutDraftName, workoutDraftExercises, () => {
             setIsSaving(false);
             router.back();
        });
    }

    function handleOpenAddExercise() {
        setIsAddingExercise(true);
    }

    function handleAddExercise(exercises: any[]) {
        exercises.forEach(exercise => {
            addExercise(exercise);
        });
        setIsAddingExercise(false);
    }

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader
                title="Create Workout"
                leftAction={<BackButton />}
                rightAction={
                    <RaisedCard 
                        onPress={handleSaveWorkoutDraft} 
                        disabled={isSaving} 
                        className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark-lighter items-center justify-center" 
                        style={{ borderRadius: 9999 }}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <IconSymbol name="checkmark" size={24} color={theme.primary} />
                        )}
                    </RaisedCard>
                }
            />

            <FlatList
                data={workoutDraftExercises}
                keyExtractor={(item, index) => `${index}-${item.name}`} 
                className="flex-1 mt-28"
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        <View className="bg-lighter dark:bg-dark-lighter h-16 px-4 rounded-xl border border-transparent dark:border-highlight-dark mb-6 justify-center">
                            <TextInput 
                                placeholder="Workout Name" 
                                value={workoutDraftName} 
                                onChangeText={setWorkoutDraftName} 
                                className="text-light dark:text-dark"
                                style={{ fontSize: 16, paddingVertical: 0, flex: 1 }}
                                placeholderTextColor={theme.textMuted || '#888'}
                            />
                        </View>
                        
                        <View className="flex-row justify-between items-center mb-2 mt-2">
                            <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Exercises</Text>
                            <RaisedCard 
                                onPress={handleOpenAddExercise}
                                className="h-10 px-4 rounded-full items-center justify-center"
                                style={{ borderRadius: 9999 }}
                            >
                                <Text className="text-primary dark:text-primary-dark text-sm font-semibold">Add Exercise</Text>
                            </RaisedCard>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View className="py-10 justify-center items-center opacity-50">
                        <Text className="leading-6 mb-2 text-lg text-light-muted dark:text-dark-muted">No exercises added yet</Text>
                    </View>
                }
                renderItem={({item, index}) => (
                    <WorkoutDraftExerciseItem
                        item={item}
                        index={index}
                        isExpanded={expandedDraftExerciseIndex === index}
                        onToggleExpand={() => setExpandedDraftExerciseIndex(expandedDraftExerciseIndex === index ? null : index)}
                        onMove={(dir) => moveExercise(index, dir)}
                        onRemove={() => removeExercise(index)}
                        onUpdateSet={(setIndex, field, value) => updateSetTarget(index, setIndex, field, value)}
                        onAddSet={() => addSet(index)}
                        onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                        latestBodyWeight={latestBodyWeight}
                        isEditing={true}
                    />
                )}
            />

            {/* Add Exercise View */}
            {isAddingExercise && (
                <Animated.View 
                    className="absolute inset-0 z-[100] bg-light dark:bg-dark"
                    entering={SlideInDown.duration(300)}
                    exiting={SlideOutDown.duration(300)}
                >
                    <ExercisesScreen
                        mode="select"
                        onSelect={handleAddExercise}
                        onClose={() => setIsAddingExercise(false)}
                    />
                </Animated.View>
            )}
        </View>
    );
}
