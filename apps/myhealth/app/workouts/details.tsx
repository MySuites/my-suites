import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useUITheme as useTheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useWorkoutDraft } from '../../hooks/workouts/useWorkoutDraft';
import { default as ExercisesScreen } from '../../app/exercises/index';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { WorkoutOverviewChart } from '../../components/workouts/WorkoutOverviewChart';
import { WorkoutDraftExerciseItem } from '../../components/workouts/WorkoutDraftExerciseItem';

export default function CreateWorkoutScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { setIsHidden } = useFloatingButton();
    const { latestBodyWeight } = useActiveWorkout();
    
    useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

    const { 
        savedWorkouts, 
        saveWorkout, 
        updateSavedWorkout, 
        deleteSavedWorkout 
    } = useWorkoutManager();

    const editingWorkoutId = typeof id === 'string' ? id : null;
    const [isEditing, setIsEditing] = useState(!editingWorkoutId);
    console.log("CreateWorkoutScreen params:", { id, editingWorkoutId });
    const [workoutDraftName, setWorkoutDraftName] = useState("");
    
    const {
        workoutDraftExercises,
        setWorkoutDraftExercises,
        addExercise,
        removeExercise,
        moveExercise,
        updateSetTarget,
        addSet,
        removeSet
    } = useWorkoutDraft([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    const [isAddingExercise, setIsAddingExercise] = useState(false);

    const [expandedDraftExerciseIndex, setExpandedDraftExerciseIndex] = useState<number | null>(null);

    useEffect(() => {
        if (editingWorkoutId) {
            const workout = savedWorkouts.find(w => w.id === editingWorkoutId);
            if (workout) {
                setWorkoutDraftName(workout.name);
                setWorkoutDraftExercises(workout.exercises ? JSON.parse(JSON.stringify(workout.exercises)) : []);
                setHasInitialized(true);
                setIsLoading(false);
                setIsEditing(false);
            } else if (savedWorkouts.length > 0 && !hasInitialized) {
                // If we've loaded workouts but ours isn't there and we haven't initialized yet,
                // then it's actually missing. If we HAVE initialized, it was probably just deleted.
                Alert.alert("Error", "Workout not found");
                router.back();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            setIsEditing(true);
        }
    }, [editingWorkoutId, savedWorkouts, router, setWorkoutDraftExercises, hasInitialized]);

    async function handleSaveWorkoutDraft() {
        if (!workoutDraftName.trim()) {
            Alert.alert("Required", "Please enter a workout name");
            return;
        }

        setIsSaving(true);
        const onSuccess = () => {
             setIsSaving(false);
             if (editingWorkoutId) {
                 setIsEditing(false);
             } else {
                 router.back();
             }
        };

        if (editingWorkoutId) {
            updateSavedWorkout(editingWorkoutId, workoutDraftName, workoutDraftExercises, onSuccess);
        } else {
            saveWorkout(workoutDraftName, workoutDraftExercises, onSuccess);
        }
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

    function handleCancel() {
        if (editingWorkoutId) {
            // Revert changes
            const workout = savedWorkouts.find(w => w.id === editingWorkoutId);
            if (workout) {
                setWorkoutDraftName(workout.name);
                setWorkoutDraftExercises(workout.exercises ? JSON.parse(JSON.stringify(workout.exercises)) : []);
            }
            setIsEditing(false);
        } else {
            // If creating new, just go back
            router.back();
        }
    }

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-light dark:bg-dark">
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader
                title={editingWorkoutId ? (isEditing ? 'Edit Workout' : 'Workout Details') : 'Create Workout'}
                leftAction={
                    isEditing ? (
                        <RaisedCard 
                            onPress={handleCancel} 
                            className="w-12 h-12 p-0 rounded-full bg-light dark:bg-dark items-center justify-center" 
                            style={{ borderRadius: 9999 }}
                        >
                             <IconSymbol name="xmark" size={24} color={theme.primary as string} />
                        </RaisedCard>
                    ) : (
                        <BackButton />
                    )
                }
                rightAction={
                    isEditing ? (
                        <RaisedCard 
                            onPress={handleSaveWorkoutDraft} 
                            disabled={isSaving} 
                            className="w-12 h-12 p-0 rounded-full bg-light dark:bg-dark items-center justify-center" 
                            style={{ borderRadius: 9999 }}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <IconSymbol name="checkmark" size={24} color={theme.primary} />
                            )}
                        </RaisedCard>
                    ) : (
                        <RaisedCard 
                            onPress={() => setIsEditing(true)} 
                            className="w-12 h-12 p-0 rounded-full bg-light dark:bg-dark items-center justify-center" 
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="pencil" size={20} color={theme.primary as string} />
                        </RaisedCard>
                    )
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
                        {isEditing ? (
                            <View className="bg-light-lighter dark:bg-dark-lighter h-16 px-4 rounded-xl border border-transparent dark:border-highlight-dark mb-6 justify-center">
                                <TextInput 
                                    placeholder="Workout Name" 
                                    value={workoutDraftName} 
                                    onChangeText={setWorkoutDraftName} 
                                    className="text-light dark:text-dark"
                                    style={{ fontSize: 16, paddingVertical: 0, flex: 1 }}
                                    placeholderTextColor={theme.textMuted || '#888'}
                                />
                            </View>
                        ) : (
                            <Text className="text-2xl font-bold text-light dark:text-dark mb-6 px-1">
                                {workoutDraftName}
                            </Text>
                        )}
                        
                        {!isEditing && workoutDraftName ? <WorkoutOverviewChart workoutName={workoutDraftName} /> : null}

                        <View className="flex-row justify-between items-center mb-2 mt-2">
                            <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Exercises</Text>
                            {isEditing && (
                                <RaisedCard 
                                    onPress={handleOpenAddExercise}
                                    className="h-10 px-4 rounded-full items-center justify-center"
                                    style={{ borderRadius: 9999 }}
                                >
                                    <Text className="text-primary dark:text-primary-dark text-sm font-semibold">Add Exercise</Text>
                                </RaisedCard>
                            )}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View className="py-10 justify-center items-center opacity-50">
                        <Text className="leading-6 mb-2 text-lg text-light-muted dark:text-dark-muted">No exercises added yet</Text>
                    </View>
                }
                ListFooterComponent={
                    isEditing && editingWorkoutId ? (
                        <TouchableOpacity 
                            onPress={() => {
                                Alert.alert('Delete Workout', 'Are you sure?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Delete', 
                                        style: 'destructive', 
                                        onPress: () => {
                                            deleteSavedWorkout(editingWorkoutId, {
                                                skipConfirmation: true,
                                                onSuccess: () => {
                                                    router.back();
                                                }
                                            });
                                        }
                                    }
                                ])
                            }} 
                            className="py-3 items-center mt-6 mb-6"
                        >
                            <Text className="text-danger font-semibold text-base">Delete Workout</Text>
                        </TouchableOpacity>
                    ) : null
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
                        isEditing={isEditing}
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

