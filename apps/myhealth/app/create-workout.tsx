import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '../components/ui/icon-symbol';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useAuth } from '@mycsuite/auth';
import { useWorkoutManager, fetchExercises } from '../hooks/useWorkoutManager';
import { useFloatingButton } from '../providers/FloatingButtonContext';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';

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
    const [selectedCategory, setSelectedCategory] = useState("All");

    const uniqueCategories = ["All", ...Array.from(new Set(availableExercises.map(e => e.category))).filter(Boolean).sort()];

    // Expanded exercise state
    const [expandedDraftExerciseIndex, setExpandedDraftExerciseIndex] = useState<number | null>(null);

    // Helper for columns
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

    // Initialize
    useEffect(() => {
        if (editingWorkoutId) {
            const workout = savedWorkouts.find(w => w.id === editingWorkoutId);
            if (workout) {
                setWorkoutDraftName(workout.name);
                // Ensure exercises have the correct structure from saved data
                // Note: Saved workouts might not have 'type' if they are old. 
                // We might need to fetch exercise details if type is missing? 
                // For now assuming new workouts or we can patch it if we had a global look up.
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
            type: exercise.rawType, 
            setTargets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, duration: 0, distance: 0 }))
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

    function updateSetTarget(exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'duration' | 'distance', value: string) {
        setWorkoutDraftExercises(prev => {
            const newArr = [...prev];
            const ex = { ...newArr[exerciseIndex] };
            if (!ex.setTargets) {
                 ex.setTargets = Array.from({ length: ex.sets || 1 }, () => ({ reps: ex.reps || 0, weight: 0 }));
            }
            const newTargets = [...ex.setTargets];
            newTargets[setIndex] = { 
                ...newTargets[setIndex], 
                [field]: Number(value) || 0 
            };
            ex.setTargets = newTargets;
            
            // Sync top level properties for the first set (legacy behavior/UI summary)
            if (setIndex === 0) {
                if (field === 'reps') ex.reps = Number(value) || 0;
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
            <ThemedView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={theme.primary} />
            </ThemedView>
        );
    }

    // --- Render ---

    return (
        <ThemedView className="flex-1">
             <View className="flex-row justify-between items-center p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                     <ThemedText type="link">Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText type="subtitle">{editingWorkoutId ? 'Edit Workout' : 'Create Workout'}</ThemedText>
                <TouchableOpacity disabled={isSaving} onPress={handleSaveWorkoutDraft} className="p-2">
                    {isSaving ? <ActivityIndicator size="small" /> : <ThemedText type="link" style={{ fontWeight: 'bold' }}>Save</ThemedText>}
                </TouchableOpacity>
            </View>

            <View className="flex-1 p-4">
                <TextInput 
                    placeholder="Workout Name" 
                    value={workoutDraftName} 
                    onChangeText={setWorkoutDraftName} 
                    className="bg-surface dark:bg-surface_dark text-apptext dark:text-apptext_dark p-4 rounded-xl text-base border border-transparent dark:border-white/10 mb-6"
                    placeholderTextColor={theme.icon}
                />
                
                <View className="flex-row justify-between items-center mb-2">
                    <ThemedText type="defaultSemiBold">Exercises</ThemedText>
                    <TouchableOpacity onPress={handleOpenAddExercise}>
                        <ThemedText type="link" style={{ fontSize: 16 }}>+ Add Exercise</ThemedText>
                    </TouchableOpacity>
                </View>

                {workoutDraftExercises.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50">
                        <ThemedText className="mb-2 text-lg" style={{ color: theme.icon }}>No exercises added yet</ThemedText>
                        <TouchableOpacity onPress={handleOpenAddExercise}>
                            <ThemedText type="link" style={{ fontSize: 18 }}>Add Exercise</ThemedText>
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
                            const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(item.type);

                            return (
                            <View className="bg-surface dark:bg-surface_dark rounded-xl mb-3 overflow-hidden border border-black/5 dark:border-white/10">
                                <TouchableOpacity 
                                    onPress={() => setExpandedDraftExerciseIndex(isExpanded ? null : index)}
                                    className="flex-row items-center justify-between p-3"
                                >
                                    <View className="flex-1 mr-2">
                                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                                            {item.sets} Sets
     {showReps && ` • ${item.reps} Reps`}
     {showDuration && ` • ${item.reps}s`} 
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
                                            {showBodyweight && <Text className="w-12 text-xs text-gray-500 font-semibold text-center">BW</Text>}
                                            {showWeight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Lbs</Text>}
                                            {showReps && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>}
                                            {showDuration && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Time</Text>}
                                            {showDistance && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Dist</Text>}
                                            <View className="w-8" />
                                        </View>
                                        {currentTargets.map((set: any, setIdx: number) => (
                                            <View key={setIdx} className="flex-row items-center mb-2">
                                                <Text className="w-10 text-apptext dark:text-apptext_dark text-center font-medium">{setIdx + 1}</Text>
                                                
                                                {showBodyweight && (
                                                    <View className="w-12 items-center justify-center">
                                                        <Text className="text-sm font-bold text-black/50 dark:text-white/50">BW</Text>
                                                    </View>
                                                )}

                                                {showWeight && (
                                                    <View className="flex-1 flex-row justify-center">
                                                        <TextInput 
                                                            value={String(set.weight || 0)} 
                                                            keyboardType="numeric"
                                                            onChangeText={(v) => updateSetTarget(index, setIdx, 'weight', v)}
                                                            className="bg-background dark:bg-background_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                            selectTextOnFocus
                                                        />
                                                    </View>
                                                )}

                                                {showReps && (
                                                    <View className="flex-1 flex-row justify-center">
                                                        <TextInput 
                                                            value={String(set.reps || 0)} 
                                                            keyboardType="numeric"
                                                            onChangeText={(v) => updateSetTarget(index, setIdx, 'reps', v)}
                                                            className="bg-background dark:bg-background_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                            selectTextOnFocus
                                                        />
                                                    </View>
                                                )}

                                                {showDuration && (
                                                    <View className="flex-1 flex-row justify-center">
                                                        <TextInput 
                                                            value={String(set.duration || 0)} 
                                                            keyboardType="numeric"
                                                            onChangeText={(v) => updateSetTarget(index, setIdx, 'duration', v)}
                                                            className="bg-background dark:bg-background_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                            selectTextOnFocus
                                                        />
                                                    </View>
                                                )}

                                                {showDistance && (
                                                    <View className="flex-1 flex-row justify-center">
                                                        <TextInput 
                                                            value={String(set.distance || 0)} 
                                                            keyboardType="numeric"
                                                            onChangeText={(v) => updateSetTarget(index, setIdx, 'distance', v)}
                                                            className="bg-background dark:bg-background_dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-apptext dark:text-apptext_dark"
                                                            selectTextOnFocus
                                                        />
                                                    </View>
                                                )}

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
                                        deleteSavedWorkout(editingWorkoutId, {
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
                        <Text className="text-red-500 font-semibold text-base">Delete Workout</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Add Exercise Modal */}
            <Modal
                visible={isAddingExercise}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAddingExercise(false)}
            >
                <ThemedView className="flex-1">
                    <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
                        <TouchableOpacity onPress={() => setIsAddingExercise(false)} className="p-2">
                             <ThemedText type="link">Cancel</ThemedText>
                        </TouchableOpacity>
                        <ThemedText type="subtitle">Add Exercise</ThemedText>
                        <View style={{ width: 50 }} />
                    </View>
                    
                    <View className="flex-1 p-4">
                        {/* Filter Chips */}
                        <View className="mb-4">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {uniqueCategories.map((category) => (
                                    <TouchableOpacity 
                                        key={category} 
                                        onPress={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full mr-2 border ${selectedCategory === category ? 'bg-primary dark:bg-primary_dark border-transparent' : 'bg-transparent border-surface dark:border-white/10'}`}
                                    >
                                        <Text className={`font-semibold ${selectedCategory === category ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {category}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
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
                                data={availableExercises.filter(ex => {
                                    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase());
                                    const matchesCategory = selectedCategory === "All" || ex.category === selectedCategory;
                                    return matchesSearch && matchesCategory;
                                })}
                                keyExtractor={(item) => item.id}
                                className="flex-1"
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        className="flex-row items-center justify-between py-3 border-b border-surface dark:border-surface_dark"
                                        onPress={() => handleAddExerciseToDraft(item)}
                                    >
                                        <View>
                                            <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>{item.name}</ThemedText>
                                            <Text className="text-gray-500 dark:text-gray-400 text-sm">
                                                {item.category} • {item.type || item.rawType}
                                            </Text> 
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
                </ThemedView>
            </Modal>
        </ThemedView>
    );
}

