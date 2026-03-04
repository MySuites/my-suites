import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Pressable, Modal, Dimensions } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const { latestBodyWeight, startWorkout, hasActiveSession, cancelWorkout } = useActiveWorkout();
    const insets = useSafeAreaInsets();
    
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
    const originalWorkout = savedWorkouts.find(w => w.id === editingWorkoutId);
    
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
    const [activeTab, setActiveTab] = useState<'exercises' | 'performance'>('exercises');

    const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
    const [headerMenuPos, setHeaderMenuPos] = useState({ top: 0, right: 0 });
    const headerMenuRef = useRef<View>(null);
    const { width: SCREEN_WIDTH } = Dimensions.get('window');


    const toggleBackground = (theme.bg || theme.bgDark) as string;
    const activeToggleBg = theme.bgLight as string; 
    const activeToggleText = theme.text as string;

    const hasUnsavedChanges = (() => {
        if (!editingWorkoutId) {
            return workoutDraftExercises.length > 0 || workoutDraftName.trim().length > 0;
        }
        if (!originalWorkout) return false;
        
        const currentDraftString = JSON.stringify(workoutDraftExercises);
        const originalExercisesString = JSON.stringify(originalWorkout.exercises || []);
        
        return workoutDraftName !== originalWorkout.name || currentDraftString !== originalExercisesString;
    })();

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

    function handleStartWorkout() {
        if (hasActiveSession) {
            Alert.alert(
                "Active Workout", 
                "You already have a workout in progress. Please finish or discard it before starting a new one.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Discard and Start Workout", 
                        style: "destructive",
                        onPress: () => {
                            cancelWorkout();
                            startWorkout(workoutDraftExercises, workoutDraftName, undefined, editingWorkoutId || undefined);
                            router.back();
                        }
                    }
                ]
            );
            return;
        }

        startWorkout(workoutDraftExercises, workoutDraftName, undefined, editingWorkoutId || undefined);
        router.back(); // or navigate to active workout screen depending on how top-level handles it
    }

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
        if (exercises.length > 0) {
            exercises.forEach(exercise => {
                addExercise({ ...exercise, isNewlyAdded: true });
            });
            setIsEditing(true);
        }
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
                title={isEditing ? (
                    <TextInput 
                        placeholder="Workout Name" 
                        value={workoutDraftName} 
                        onChangeText={setWorkoutDraftName} 
                        className="text-xl font-bold text-light dark:text-dark text-center"
                        style={{ paddingVertical: 0 }}
                        placeholderTextColor={theme.textMuted || '#888'}
                        autoFocus
                    />
                ) : (
                    editingWorkoutId ? workoutDraftName || 'Workout Details' : 'Create Workout'
                )}
                leftAction={
                    isEditing ? (
                        <RaisedCard 
                            onPress={handleCancel} 
                            className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark items-center justify-center" 
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
                            className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark items-center justify-center" 
                            style={{ borderRadius: 9999 }}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <IconSymbol name="checkmark" size={24} color={theme.primary} />
                            )}
                        </RaisedCard>
                    ) : (
                        <View ref={headerMenuRef as any}>
                            <RaisedCard 
                                onPress={(e) => { 
                                    headerMenuRef.current?.measure((x, y, width, height, pageX, pageY) => {
                                        setHeaderMenuPos({ 
                                            top: pageY + height + 4, 
                                            right: SCREEN_WIDTH - pageX - width
                                        });
                                        setHeaderMenuVisible(true);
                                    });
                                }} 
                                className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark items-center justify-center" 
                                style={{ borderRadius: 9999 }}
                            >
                                <IconSymbol name="ellipsis" size={20} color={theme.primary as string} />
                            </RaisedCard>
                        </View>
                    )
                }
            />

            {/* Header Menu */}
            <Modal transparent visible={headerMenuVisible} animationType="fade" onRequestClose={() => setHeaderMenuVisible(false)}>
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={() => setHeaderMenuVisible(false)}
                    className="flex-1"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                >
                    <RaisedCard 
                        className="absolute w-48 p-1 origin-top-right rounded-xl bg-lighter dark:bg-dark-lighter"
                        style={{ 
                            top: headerMenuPos.top,
                            right: headerMenuPos.right,
                            shadowColor: '#000', 
                            shadowOffset: { width: 0, height: 4 }, 
                            shadowOpacity: 0.15, 
                            shadowRadius: 12, 
                            elevation: 5,
                        }}
                    >
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); setHeaderMenuVisible(false); setIsEditing(true); }} className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5">
                            <IconSymbol name="pencil" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                            <Text style={{ color: theme.text as string }} className="font-medium">Edit Workout</Text>
                        </TouchableOpacity>
                        
                        {editingWorkoutId && (
                            <>
                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                <TouchableOpacity 
                                    onPress={(e) => { 
                                        e.stopPropagation(); 
                                        setHeaderMenuVisible(false); 
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
                                        ]);
                                    }} 
                                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                                >
                                    <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.options?.destructiveColor || '#ff4444' }} className="font-medium">Delete</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </RaisedCard>
                </TouchableOpacity>
            </Modal>

            <FlatList
                data={(activeTab === 'exercises' || isEditing) ? workoutDraftExercises : []}
                keyExtractor={(item, index) => `${index}-${item.name}`} 
                className="flex-1 mt-28"
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                            <View style={{
                                flexDirection: 'row',
                                backgroundColor: toggleBackground,
                                borderRadius: 8,
                                padding: 4,
                                marginBottom: 24
                            }}>
                                <Pressable
                                    onPress={() => setActiveTab('exercises')}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        backgroundColor: activeTab === 'exercises' ? activeToggleBg : 'transparent',
                                        borderRadius: 6,
                                    }}
                                >
                                    <Text style={{
                                        color: activeTab === 'exercises' ? activeToggleText : (theme.text as string),
                                        fontWeight: activeTab === 'exercises' ? '600' : '400',
                                        opacity: activeTab === 'exercises' ? 1 : 0.7
                                    }}>Exercises</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setActiveTab('performance')}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        backgroundColor: activeTab === 'performance' ? activeToggleBg : 'transparent',
                                        borderRadius: 6,
                                    }}
                                >
                                    <Text style={{
                                        color: activeTab === 'performance' ? activeToggleText : (theme.text as string),
                                        fontWeight: activeTab === 'performance' ? '600' : '400',
                                        opacity: activeTab === 'performance' ? 1 : 0.7
                                    }}>Performance</Text>
                                </Pressable>
                            </View>
                        
                        {!isEditing && activeTab === 'performance' && workoutDraftName ? <WorkoutOverviewChart workoutName={workoutDraftName} /> : null}

                        {(isEditing || activeTab === 'exercises') && (
                            <View className="flex-row justify-between items-center mb-2 mt-2">
                                <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Exercises</Text>
                                <RaisedCard 
                                    onPress={handleOpenAddExercise}
                                    className="h-10 active:h-9 px-4 rounded-full items-center justify-center"
                                    style={{ borderRadius: 9999 }}
                                >
                                    <Text className="text-primary dark:text-primary-dark text-sm font-semibold">Add Exercise</Text>
                                </RaisedCard>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    (isEditing || activeTab === 'exercises') ? (
                        <View className="py-10 justify-center items-center opacity-50">
                            <Text className="leading-6 mb-2 text-lg text-light-muted dark:text-dark-muted">No exercises added yet</Text>
                        </View>
                    ) : null
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
                ItemSeparatorComponent={() => <View className="h-[1px] bg-black/10 dark:bg-white/10 my-2" />}
                renderItem={({item, index}) => (
                    <WorkoutDraftExerciseItem
                        item={item}
                        index={index}
                        isExpanded={true}
                        onToggleExpand={() => {}}
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

            {/* Quick Start Style Start/Save Button */}
            {!isAddingExercise && (
                <Animated.View 
                    entering={SlideInDown.duration(300)}
                    exiting={SlideOutDown.duration(300)}
                    className="absolute self-center"
                    style={{ bottom: insets.bottom + 20, width: 'auto', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 50 }}
                >
                    <RaisedCard
                        onPress={hasUnsavedChanges ? handleSaveWorkoutDraft : handleStartWorkout}
                        disabled={isSaving}
                        className="items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                        style={{ borderRadius: 9999 }}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <View className="flex-row items-center justify-center">
                                {hasUnsavedChanges ? (
                                    <>
                                        <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text className="text-lg font-bold text-white">Save Workout</Text>
                                    </>
                                ) : (
                                    <>
                                        <IconSymbol name="play.fill" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text className="text-lg font-bold text-white">Start Workout</Text>
                                    </>
                                )}
                            </View>
                        )}
                    </RaisedCard>
                </Animated.View>
            )}
        </View>
    );
}

