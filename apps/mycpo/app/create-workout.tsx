import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '../components/ui/icon-symbol';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useAuth } from '@mycsuite/auth';
import { useWorkoutManager, fetchExercises } from '../hooks/useWorkoutManager';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFloatingButton } from '../providers/FloatingButtonContext';

export default function CreateWorkoutScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const { setIsHidden } = useFloatingButton();
    
    // Hide floating buttons
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
    const [workoutDraftExercises, setWorkoutDraftExercises] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Add Exercise State
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");

    // Expanded exercise state
    const [expandedDraftExerciseIndex, setExpandedDraftExerciseIndex] = useState<number | null>(null);

    // Initialize
    useEffect(() => {
        if (editingWorkoutId) {
            const workout = savedWorkouts.find(w => w.id === editingWorkoutId);
            if (workout) {
                setWorkoutDraftName(workout.name);
                setWorkoutDraftExercises(workout.exercises ? JSON.parse(JSON.stringify(workout.exercises)) : []);
            } else {
                Alert.alert("Error", "Workout not found");
                router.back();
            }
        }
        setIsLoading(false);
    }, [editingWorkoutId, savedWorkouts, router]);

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
        if (!user) return;
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

    function handleAddExerciseToDraft(exercise: any) {
        const newExercise = {
            id: exercise.id,
            name: exercise.name,
            sets: 3,
            reps: 10,
            category: exercise.category,
            setTargets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 }))
        };
        setWorkoutDraftExercises(prev => [...prev, newExercise]);
        setIsAddingExercise(false);
        setExerciseSearchQuery("");
    }

    // --- Draft Manipulation Functions ---

    function removeWorkoutDraftExercise(index: number) {
        setWorkoutDraftExercises(prev => prev.filter((_, i) => i !== index));
    }

    function moveWorkoutDraftExercise(index: number, dir: -1 | 1) {
        const newArr = [...workoutDraftExercises];
        if (index + dir < 0 || index + dir >= newArr.length) return;
        const temp = newArr[index];
        newArr[index] = newArr[index + dir];
        newArr[index + dir] = temp;
        setWorkoutDraftExercises(newArr);
    }

    function updateSetTarget(exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
            if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            const newTargets = [...ex.setTargets];
            newTargets[setIndex] = { ...newTargets[setIndex], [field]: Number(value) || 0 };
            ex.setTargets = newTargets;
            
            if (field === 'reps' && setIndex === 0) {
                ex.reps = Number(value) || 0;
            }
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    function addSetToDraft(exerciseIndex: number) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
             if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            const lastSet = ex.setTargets[ex.setTargets.length - 1] || { reps: 10, weight: 0 };
            ex.setTargets = [...ex.setTargets, { ...lastSet }];
            ex.sets = ex.setTargets.length;
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }

    function removeSetFromDraft(exerciseIndex: number, setIndex: number) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
             if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            if (ex.setTargets.length <= 1) {
                return newArr;
            }
            ex.setTargets = ex.setTargets.filter((_: any, i: number) => i !== setIndex);
            ex.sets = ex.setTargets.length;
            
            if (setIndex === 0 && ex.setTargets.length > 0) {
                 ex.reps = ex.setTargets[0].reps;
            }
            newArr[exerciseIndex] = ex;
            return newArr;
        });
    }


    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-background dark:bg-background_dark">
                <ActivityIndicator size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    // --- Render ---

    if (isAddingExercise) {
        return (
            <SafeAreaView className="flex-1 bg-background dark:bg-background_dark" edges={['top', 'left', 'right']}>
                 <View className="flex-1 px-4 pt-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold text-apptext dark:text-apptext_dark">Add Exercise</Text>
                        <TouchableOpacity onPress={() => setIsAddingExercise(false)}>
                            <Text className="text-primary dark:text-primary_dark text-lg">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row items-center bg-surface dark:bg-surface_dark rounded-lg px-2.5 h-12 mb-4 border border-black/5 dark:border-white/10">
                        <IconSymbol name="magnifyingglass" size={20} color={theme.icon || '#888'} />
                        <TextInput
                            className="flex-1 ml-2 text-base h-full text-apptext dark:text-apptext_dark"
                            placeholder="Search exercises..."
                            placeholderTextColor={theme.icon || '#888'}
                            value={exerciseSearchQuery}
                            onChangeText={setExerciseSearchQuery}
                            autoCorrect={false}
                        />
                        {exerciseSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setExerciseSearchQuery('')}>
                                    <IconSymbol name="xmark.circle.fill" size={20} color={theme.icon || '#888'} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoadingExercises ? (
                        <ActivityIndicator size="large" color={theme.primary} className="mt-4" />
                    ) : (
                        <FlatList
                            data={availableExercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))}
                            keyExtractor={(item) => item.id}
                            className="flex-1"
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="flex-row items-center justify-between py-3 border-b border-surface dark:border-surface_dark"
                                    onPress={() => handleAddExerciseToDraft(item)}
                                >
                                    <View>
                                        <Text className="text-apptext dark:text-apptext_dark font-medium text-lg">{item.name}</Text>
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.category}</Text> 
                                    </View>
                                    <IconSymbol name="plus.circle" size={28} color={theme.primary} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text className="text-center text-gray-500 mt-4">No exercises found.</Text>
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background_dark" edges={['top', 'left', 'right']}>
             <View className="flex-1 px-4 pt-6">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()}>
                         <Text className="text-primary dark:text-primary_dark text-lg">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-apptext dark:text-apptext_dark">{editingWorkoutId ? 'Edit Workout' : 'Create Workout'}</Text>
                    <TouchableOpacity disabled={isSaving} onPress={handleSaveWorkoutDraft}>
                        {isSaving ? <ActivityIndicator size="small" /> : <Text className="text-primary dark:text-primary_dark text-lg font-bold">Save</Text>}
                    </TouchableOpacity>
                </View>

                <TextInput 
                    placeholder="Workout Name" 
                    value={workoutDraftName} 
                    onChangeText={setWorkoutDraftName} 
                    className="border border-surface dark:border-surface_dark rounded-xl p-3 mb-4 text-apptext dark:text-apptext_dark text-lg bg-surface dark:bg-surface_dark" 
                    placeholderTextColor="#9CA3AF" 
                />
                
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-semibold text-apptext dark:text-apptext_dark text-lg">Exercises</Text>
                    <TouchableOpacity onPress={handleOpenAddExercise}>
                        <Text className="text-primary dark:text-primary_dark text-base font-semibold">+ Add Exercise</Text>
                    </TouchableOpacity>
                </View>

                {workoutDraftExercises.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 text-lg">No exercises added yet</Text>
                        <TouchableOpacity onPress={handleOpenAddExercise}>
                            <Text className="text-primary dark:text-primary_dark text-lg">Add Exercise</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={workoutDraftExercises}
                        keyExtractor={(item, index) => `${index}-${item.name}`} 
                        className="flex-1 mb-4"
                        showsVerticalScrollIndicator={false}
                        renderItem={({item, index}) => {
                            const isExpanded = expandedDraftExerciseIndex === index;
                            const currentTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || 0, weight: 0 }));

                            return (
                            <View className="bg-surface dark:bg-surface_dark rounded-xl mb-3 overflow-hidden border border-black/5 dark:border-white/10">
                                <TouchableOpacity 
                                    onPress={() => setExpandedDraftExerciseIndex(isExpanded ? null : index)}
                                    className="flex-row items-center justify-between p-3"
                                >
                                    <View className="flex-1 mr-2">
                                        <Text className="text-apptext dark:text-apptext_dark font-medium text-lg">{item.name}</Text>
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                                            {item.sets} Sets {'•'} {item.reps} Reps
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); moveWorkoutDraftExercise(index, -1); }} className="p-2"> 
                                            <IconSymbol name="arrow.up" size={16} color={theme.icon || '#888'} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); moveWorkoutDraftExercise(index, 1); }} className="p-2"> 
                                            <IconSymbol name="arrow.down" size={16} color={theme.icon || '#888'} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); removeWorkoutDraftExercise(index); }} className="p-2 ml-1"> 
                                            <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                                
                                {isExpanded && (
                                    <View className="px-3 pb-3 pt-1 bg-background/50 dark:bg-background_dark/30">
                                        <View className="flex-row mb-2">
                                            <Text className="w-10 text-xs text-gray-500 font-semibold text-center">Set</Text>
                                            <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>
                                            <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Weight</Text>
                                            <View className="w-8" />
                                        </View>
                                        {currentTargets.map((set: any, setIdx: number) => (
                                            <View key={setIdx} className="flex-row items-center mb-2">
                                                <Text className="w-10 text-apptext dark:text-apptext_dark text-center font-medium">{setIdx + 1}</Text>
                                                <View className="flex-1 flex-row justify-center">
                                                        <TextInput 
                                                        value={String(set.reps || 0)} 
                                                        keyboardType="numeric"
                                                        onChangeText={(v) => updateSetTarget(index, setIdx, 'reps', v)}
                                                        className="bg-background dark:bg-background_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                        selectTextOnFocus
                                                    />
                                                </View>
                                                <View className="flex-1 flex-row justify-center">
                                                        <TextInput 
                                                        value={String(set.weight || 0)} 
                                                        keyboardType="numeric"
                                                        onChangeText={(v) => updateSetTarget(index, setIdx, 'weight', v)}
                                                        className="bg-background dark:bg-background_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                        selectTextOnFocus
                                                    />
                                                </View>
                                                <TouchableOpacity 
                                                    onPress={() => removeSetFromDraft(index, setIdx)}
                                                    className="w-8 items-center justify-center rounded h-8 ml-2"
                                                >
                                                    <IconSymbol name="minus.circle.fill" size={20} color="#ff4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        <TouchableOpacity 
                                            onPress={() => addSetToDraft(index)}
                                            className="flex-row items-center justify-center p-2 mt-1 rounded-lg border border-dashed border-black/10 dark:border-white/10"
                                        >
                                            <IconSymbol name="plus" size={14} color={theme.primary} />
                                            <Text className="ml-2 text-sm text-primary dark:text-primary_dark font-medium">Add Set</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            )}}
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
                                        deleteSavedWorkout(editingWorkoutId, () => {
                                            router.back();
                                        });
                                    }
                                }
                            ])
                        }} 
                        className="py-3 items-center mt-2 mb-6"
                    >
                        <Text className="text-red-500 font-semibold text-base">Delete Workout</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
