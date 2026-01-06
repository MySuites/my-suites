import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme as useTheme, RaisedButton, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { useWorkoutManager, fetchExercises } from '../../providers/WorkoutManagerProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useWorkoutDraft } from '../../hooks/workouts/useWorkoutDraft';
import { ExerciseSelector } from '../../components/workouts/ExerciseSelector';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function CreateWorkoutScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
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
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);

    const [expandedDraftExerciseIndex, setExpandedDraftExerciseIndex] = useState<number | null>(null);

    useEffect(() => {
        if (editingWorkoutId) {
            const workout = savedWorkouts.find(w => w.id === editingWorkoutId);
            if (workout) {
                setWorkoutDraftName(workout.name);
                setWorkoutDraftExercises(workout.exercises ? JSON.parse(JSON.stringify(workout.exercises)) : []);
                setHasInitialized(true);
                setIsLoading(false);
            } else if (savedWorkouts.length > 0 && !hasInitialized) {
                // If we've loaded workouts but ours isn't there and we haven't initialized yet,
                // then it's actually missing. If we HAVE initialized, it was probably just deleted.
                Alert.alert("Error", "Workout not found");
                router.back();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
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
             router.back();
        };

        if (editingWorkoutId) {
            updateSavedWorkout(editingWorkoutId, workoutDraftName, workoutDraftExercises, onSuccess);
        } else {
            saveWorkout(workoutDraftName, workoutDraftExercises, onSuccess);
        }
    }

    async function fetchAvailableExercises() {
        setIsLoadingExercises(true);
        try {
             const { data } = await fetchExercises(user);
             setAvailableExercises(data || []);
        } catch (e) {
            console.error("Failed to fetch exercises", e);
        } finally {
            setIsLoadingExercises(false);
        }
    }

    function handleOpenAddExercise() {
        setIsAddingExercise(true);
        fetchAvailableExercises();
    }

    function handleAddExercise(exercises: any[]) {
        exercises.forEach(exercise => {
            addExercise(exercise);
        });
        setIsAddingExercise(false);
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
            <ScreenHeader
                title={editingWorkoutId ? 'Edit Workout' : 'Create Workout'}
                leftAction={<BackButton />}
                rightAction={
                    <RaisedButton 
                        onPress={handleSaveWorkoutDraft} 
                        disabled={isSaving} 
                        className="w-10 h-10 p-0 rounded-full bg-light-lighter dark:bg-dark-lighter" 
                        variant="default"
                        borderRadius={20}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <IconSymbol name="checkmark" size={24} color={theme.primary} />
                        )}
                    </RaisedButton>
                }
            />

            <View className="mt-28 flex-1 p-4">
                <TextInput 
                    placeholder="Workout Name" 
                    value={workoutDraftName} 
                    onChangeText={setWorkoutDraftName} 
                    className="bg-light-lighter dark:bg-dark-lighter text-light dark:text-dark p-4 rounded-xl text-base border border-transparent dark:border-highlight-dark mb-6"
                    placeholderTextColor={theme.textMuted || '#888'}
                />
                
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Exercises</Text>
                    <RaisedButton 
                        onPress={handleOpenAddExercise}
                        className="w-28 h-8 p-0 rounded-full items-center justify-center"
                        borderRadius={16}
                    >
                        <Text className="text-primary dark:text-primary-dark text-sm font-semibold">Add Exercise</Text>
                    </RaisedButton>
                </View>

                {workoutDraftExercises.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <Text className="leading-6 mb-2 text-lg text-light-muted dark:text-dark-muted">No exercises added yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={workoutDraftExercises}
                        keyExtractor={(item, index) => `${index}-${item.name}`} 
                        className="flex-1 mb-4"
                        showsVerticalScrollIndicator={false}
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
                            />
                        )}
                    />
                )}
                
                {editingWorkoutId && (
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
                        className="py-3 items-center mt-2 mb-6"
                    >
                        <Text className="text-danger font-semibold text-base">Delete Workout</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Add Exercise Modal */}
            <ExerciseSelector
                visible={isAddingExercise}
                onClose={() => setIsAddingExercise(false)}
                onSelect={handleAddExercise}
                exercises={availableExercises}
                isLoading={isLoadingExercises}
            />
        </View>
    );
}

interface WorkoutDraftExerciseItemProps {
    item: any;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onMove: (dir: -1 | 1) => void;
    onRemove: () => void;
    onUpdateSet: (setIndex: number, field: 'reps' | 'weight' | 'duration' | 'distance', value: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
    latestBodyWeight?: number | null;
}

const WorkoutDraftExerciseItem = ({
    item,
    index,
    isExpanded,
    onToggleExpand,
    onMove,
    onRemove,
    onUpdateSet,
    onAddSet,
    onRemoveSet,
    latestBodyWeight
}: WorkoutDraftExerciseItemProps) => {
    const theme = useTheme();
    const currentTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || 0, weight: 0 }));
    
    // Helper to determine which columns to show
    const getExerciseFields = (properties?: string[]) => {
        const props = properties || [];
        const lowerProps = props.map(p => p.toLowerCase());
        return { 
            showBodyweight: lowerProps.includes('bodyweight'),
            showWeight: lowerProps.includes('weighted'),
            showReps: lowerProps.includes('reps'),
            showDuration: lowerProps.includes('duration'),
            showDistance: lowerProps.includes('distance')
        };
    };

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(item.properties);

    return (
        <View className="bg-light-lighter dark:bg-border-dark rounded-xl mb-3 overflow-hidden border border-black/5 dark:border-white/10">
            <TouchableOpacity 
                onPress={onToggleExpand}
                className="flex-row items-center justify-between p-3"
            >
                <View className="flex-1 mr-2">
                    <Text className="text-base leading-6 font-semibold">{item.name}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.sets} Sets
                        {showReps && ` • ${item.reps} Reps`}
                        {showDuration && ` • ${item.reps}s`} 
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onMove(-1); }} className="p-2"> 
                        <IconSymbol name="arrow.up" size={16} color={theme.icon || '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onMove(1); }} className="p-2"> 
                        <IconSymbol name="arrow.down" size={16} color={theme.icon || '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 ml-1"> 
                        <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
            
            {isExpanded && (
                <View className="px-3 pb-3 pt-1 bg-light/50 dark:bg-dark/30">
                    <View className="flex-row mb-2">
                        <Text className="w-10 text-xs text-gray-500 font-semibold text-center">Set</Text>
                        {showBodyweight && <Text className="w-12 text-xs text-gray-500 font-semibold text-center">{latestBodyWeight ? 'Lbs' : 'BW'}</Text>}
                        {showWeight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Lbs</Text>}
                        {showReps && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>}
                        {showDuration && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Time</Text>}
                        {showDistance && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Dist</Text>}
                        <View className="w-8" />
                    </View>
                    {currentTargets.map((set: any, setIdx: number) => (
                        <View key={setIdx} className="flex-row items-center mb-2">
                            <Text className="w-10 text-light dark:text-dark text-center font-medium">{setIdx + 1}</Text>
                            
                            {showBodyweight && (
                                <View className="w-12 items-center justify-center">
                                    <Text className="text-sm font-bold text-black/50 dark:text-white/50">
                                        {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                    </Text>
                                </View>
                            )}

                            {showWeight && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.weight || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'weight', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            {showReps && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.reps || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'reps', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            {showDuration && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.duration || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'duration', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            {showDistance && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.distance || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'distance', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            <TouchableOpacity 
                                onPress={() => onRemoveSet(setIdx)}
                                className="w-8 items-center justify-center rounded h-8 ml-2"
                            >
                                <IconSymbol name="minus.circle.fill" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity 
                        onPress={onAddSet}
                        className="flex-row items-center justify-center p-2 mt-1 rounded-lg border border-dashed border-black/10 dark:border-white/10"
                    >
                        <IconSymbol name="plus" size={14} color={theme.primary} />
                        <Text className="ml-2 text-sm text-primary dark:text-primary-dark font-medium">Add Set</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
