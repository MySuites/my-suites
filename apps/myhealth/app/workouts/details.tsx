import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Pressable, Modal, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme as useTheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useWorkoutDraft } from '../../hooks/workouts/useWorkoutDraft';
import { default as ExercisesScreen } from '../../app/exercises/index';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { WorkoutOverviewChart } from '../../components/workouts/WorkoutOverviewChart';
import { WorkoutDraftExerciseItem } from '../../components/workouts/WorkoutDraftExerciseItem';
import { formatRestTime } from '../../utils/formatting';

export default function CreateWorkoutScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id, logId } = useLocalSearchParams();
    const { setIsHidden } = useFloatingButton();
    const { latestBodyWeight, startWorkout, hasActiveSession, cancelWorkout } = useActiveWorkout();
    const insets = useSafeAreaInsets();
    
    useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

    const { 
        savedWorkouts, 
        workoutHistory,
        saveWorkout, 
        updateSavedWorkout, 
        deleteSavedWorkout,
        deleteWorkoutLog,
        fetchWorkoutLogDetails
    } = useWorkoutManager();

    const editingWorkoutId = typeof id === 'string' ? id : null;
    const viewingLogId = typeof logId === 'string' ? logId : null;
    const originalWorkout = savedWorkouts.find(w => w.id === editingWorkoutId);
    const isLogView = !!viewingLogId;
    
    // Pre-compute initial values synchronously to avoid the loading spinner
    const initialData = useRef((() => {
        if (editingWorkoutId) {
            const workout = savedWorkouts.find(w => w.id === editingWorkoutId);
            if (workout) {
                return {
                    name: workout.name,
                    exercises: workout.exercises ? JSON.parse(JSON.stringify(workout.exercises)) : [],
                    isEditing: false,
                    isLoading: false,
                    logDate: null as string | null,
                    logDuration: null as number | null,
                };
            }
        }
        if (viewingLogId) {
            const historyItem = workoutHistory.find((h: any) => h.id === viewingLogId) as any;
            if (historyItem?.exercises) {
                const historyExercises = historyItem.exercises.map((ex: any) => ({
                    id: ex.id || '',
                    name: ex.name,
                    properties: ex.properties,
                    attachment: ex.attachment,
                    equipment: ex.equipment,
                    movementType: ex.movementType,
                    setTargets: (ex.logs || []).map((s: any) => ({
                        id: s.id,
                        reps: s.reps,
                        reps_left: s.reps_left,
                        reps_right: s.reps_right,
                        weight: s.weight,
                        duration: s.duration,
                        distance: s.distance,
                        rpe: s.rpe,
                    }))
                }));
                return {
                    name: historyItem.workoutName || historyItem.name || 'Workout Log',
                    exercises: historyExercises,
                    isEditing: false,
                    isLoading: false,
                    logDate: (historyItem.workoutDate || historyItem.date || null) as string | null,
                    logDuration: (historyItem.duration || null) as number | null,
                };
            }
            // Fallback: need async load
            return { name: '', exercises: [] as any[], isEditing: false, isLoading: true, logDate: null as string | null, logDuration: null as number | null };
        }
        // Create new
        return { name: '', exercises: [] as any[], isEditing: true, isLoading: false, logDate: null as string | null, logDuration: null as number | null };
    })()).current;

    const [isEditing, setIsEditing] = useState(initialData.isEditing);
    const [workoutDraftName, setWorkoutDraftName] = useState(initialData.name);
    
    const {
        workoutDraftExercises,
        setWorkoutDraftExercises,
        addExercise,
        removeExercise,
        moveExercise,
        reorderExercises,
        updateSetTarget,
        updateExerciseRestTime,
        updateExerciseAttachment,
        updateExerciseEquipment,
        updateExerciseMovementType,
        addSet,
        removeSet
    } = useWorkoutDraft(initialData.exercises);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(initialData.isLoading);
    const [lastSaved, setLastSaved] = useState(0);
    const [currentlyEditingIndices, setCurrentlyEditingIndices] = useState<Set<number>>(new Set());
    const hasInitializedRef = useRef(false);
    const [workoutLogDate] = useState<string | null>(initialData.logDate || null);
    const [workoutLogDuration] = useState<number | null>(initialData.logDuration || null);

    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [activeTab, setActiveTab] = useState<'exercises' | 'performance'>('exercises');

    const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
    const [headerMenuPos, setHeaderMenuPos] = useState({ top: 0, right: 0 });
    const headerMenuRef = useRef<View>(null);
    const { width: SCREEN_WIDTH } = Dimensions.get('window');


    const toggleBackground = (theme.bg || theme.bgDark) as string;
    const activeToggleBg = theme.bgLight as string; 
    const activeToggleText = theme.text as string;

    const normalizeExercises = (exercises: any[]) => {
        return (exercises || []).map(ex => {
            const { isNewlyAdded, ...rest } = ex;
            const normalizedTargets = (ex.setTargets || []).map((t: any) => {
                const nt = { ...t };
                Object.keys(nt).forEach(key => {
                    if (nt[key] === undefined || nt[key] === null) delete nt[key];
                });
                return nt;
            });
            return { ...rest, setTargets: normalizedTargets };
        });
    };

    const hasUnsavedChanges = (() => {
        if (!editingWorkoutId) {
            return workoutDraftExercises.length > 0 || workoutDraftName.trim().length > 0;
        }
        if (!originalWorkout) return false;
        
        const currentDraftString = JSON.stringify(normalizeExercises(workoutDraftExercises));
        const originalExercisesString = JSON.stringify(normalizeExercises(originalWorkout.exercises || []));
        
        return workoutDraftName.trim() !== originalWorkout.name.trim() || currentDraftString !== originalExercisesString;
    })();

    // Fallback async init — only needed if log data wasn't in workoutHistory during first render
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        if (!isLoading) return; // Already initialized synchronously

        async function loadLog() {
            if (!viewingLogId) return;
            try {
                const { data } = await fetchWorkoutLogDetails(viewingLogId);
                if (data && data.length > 0) {
                    const historyExercises = data.map((ex: any) => ({
                        id: ex.sets[0]?.details?.exercise_id || '',
                        name: ex.name,
                        properties: ex.properties,
                        attachment: ex.attachment,
                        equipment: ex.equipment,
                        movementType: ex.movementType,
                        setTargets: (ex.sets || []).map((s: any) => ({
                            id: s.details?.id,
                            reps: s.details?.reps,
                            reps_left: s.details?.reps_left,
                            reps_right: s.details?.reps_right,
                            weight: s.details?.weight,
                            duration: s.details?.duration,
                            distance: s.details?.distance,
                            rpe: s.details?.rpe,
                        }))
                    }));
                    setWorkoutDraftExercises(historyExercises);
                }
            } catch (err) {
                console.error("Failed to load log details", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewingLogId]);

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
             setLastSaved(Date.now());
             setCurrentlyEditingIndices(new Set());
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

    function handleDeleteHistoryLog() {
        if (!viewingLogId) return;
        
        Alert.alert(
            "Delete Workout Log",
            "Are you sure you want to delete this workout from your history? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                         deleteWorkoutLog(viewingLogId, {
                             skipConfirmation: true,
                             onSuccess: () => {
                                 router.back();
                             }
                         });
                    } 
                }
            ]
        );
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader
                title={isEditing ? (
                    <TextInput 
                        placeholder="Workout Name" 
                        defaultValue={workoutDraftName} 
                        onChangeText={setWorkoutDraftName} 
                        className="text-[20px] font-bold text-light dark:text-dark text-center"
                        placeholderTextColor={theme.textMuted || '#888'}
                        autoFocus
                        selectTextOnFocus
                    />
                ) : (
                    <View className="items-center">
                        <Text className="text-xl font-bold text-light dark:text-dark">
                            {editingWorkoutId ? workoutDraftName || 'Workout Details' : isLogView ? workoutDraftName || 'Workout Log' : 'Create Workout'}
                        </Text>
                        {isLogView && (workoutLogDate || workoutLogDuration) && (
                            <View className="flex-row items-center gap-1.5 mt-0.5">
                                {workoutLogDate && (
                                    <Text className="text-xs text-light-muted dark:text-dark-muted font-medium">
                                        {new Date(workoutLogDate).toLocaleDateString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                )}
                                {workoutLogDate && workoutLogDuration && (
                                    <Text className="text-xs text-light-muted dark:text-dark-muted font-medium opacity-50">•</Text>
                                )}
                                {workoutLogDuration && (
                                    <Text className="text-xs text-light-muted dark:text-dark-muted font-medium">
                                        {formatRestTime(workoutLogDuration)}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
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
                    ) : isLogView ? (
                        <RaisedCard 
                            onPress={handleDeleteHistoryLog} 
                            className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark items-center justify-center" 
                            style={{ borderRadius: 9999 }}
                        >
                            <IconSymbol name="trash.fill" size={20} color={theme.options?.destructiveColor || "#ff4444"} />
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

            <GestureHandlerRootView style={{ flex: 1 }}>
                <DraggableFlatList
                    data={(activeTab === 'exercises' || isEditing) ? workoutDraftExercises : []}
                    onDragEnd={({ from, to }) => reorderExercises(from, to)}
                    keyExtractor={(item, index) => `${index}-${item.name}`} 
                    containerStyle={{ flex: 1 }}
                    contentContainerStyle={{ 
                        padding: 16, 
                        paddingTop: 112,
                        paddingBottom: 120 
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    activationDistance={20}
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
                                {!isLogView && (
                                    <RaisedCard 
                                        onPress={handleOpenAddExercise}
                                        className="h-10 active:h-9 px-4 rounded-full items-center justify-center"
                                        style={{ borderRadius: 9999 }}
                                    >
                                        <Text className="text-primary dark:text-primary-dark text-sm font-semibold">Add Exercise</Text>
                                    </RaisedCard>
                                )}
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
                renderItem={({item, getIndex, drag, isActive}: RenderItemParams<any>) => {
                    const index = getIndex() ?? 0;
                    return (
                        <ScaleDecorator activeScale={1.05}>
                            <View className={`${isActive ? 'bg-light dark:bg-dark rounded-2xl' : ''}`}>
                                <WorkoutDraftExerciseItem
                                    item={item}
                                    index={index}
                                    isExpanded={true}
                                    onToggleExpand={() => {}}
                                    onPressName={() => {
                                        router.push({
                                            pathname: '/exercises/details' as any,
                                            params: { exercise: JSON.stringify(item) }
                                        });
                                    }}
                                    onMove={(dir) => moveExercise(index, dir)}
                                    onRemove={() => removeExercise(index)}
                                    onUpdateSet={(setIndex, field, value) => updateSetTarget(index, setIndex, field, value)}
                                    onUpdateRestTime={(restTime) => updateExerciseRestTime(index, restTime)}
                                    onUpdateAttachment={(attachment) => updateExerciseAttachment(index, attachment)}
                                    onUpdateEquipment={(equipment) => updateExerciseEquipment(index, equipment)}
                                    onUpdateMovementType={(movementType) => updateExerciseMovementType(index, movementType)}
                                    onAddSet={() => addSet(index)}
                                    onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                                    latestBodyWeight={latestBodyWeight}
                                    isEditing={isEditing}
                                    isReadOnly={isLogView}
                                    lastSaved={lastSaved}
                                    onToggleLocalEdit={(isNowEditing) => {
                                        setCurrentlyEditingIndices(prev => {
                                            const next = new Set(prev);
                                            if (isNowEditing) next.add(index);
                                            else next.delete(index);
                                            return next;
                                        });
                                    }}
                                    onDrag={drag}
                                />
                            </View>
                        </ScaleDecorator>
                    );
                }}
                />
            </GestureHandlerRootView>

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
            {!isAddingExercise && !isLogView && (() => {
                const isSavingMode = hasUnsavedChanges || currentlyEditingIndices.size > 0 || isEditing;
                return (
                <Animated.View 
                    entering={SlideInDown.duration(300)}
                    exiting={SlideOutDown.duration(300)}
                    className="absolute self-center"
                    style={{ bottom: insets.bottom + 20, width: 'auto', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 50 }}
                >
                    <RaisedCard
                        onPress={isSavingMode ? handleSaveWorkoutDraft : handleStartWorkout}
                        disabled={isSaving}
                        className="items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                        style={{ borderRadius: 9999 }}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <View className="flex-row items-center justify-center">
                                {isSavingMode ? (
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
                );
            })()}
        </View>
        </TouchableWithoutFeedback>
    );
}

