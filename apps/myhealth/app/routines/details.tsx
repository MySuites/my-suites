import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useUITheme as useTheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useRoutineDraft } from '../../hooks/routines/useRoutineManager';
import { AddDay } from '../../components/routines/AddDay';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function RoutineDetailsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { setIsHidden } = useFloatingButton();
    
    // Hide floating buttons
    useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

    const { 
        routines,
        savedWorkouts, 

        updateRoutine, 
        deleteRoutine 
    } = useWorkoutManager();

    const editingRoutineId = typeof id === 'string' ? id : '';
    const [routineDraftName, setRoutineDraftName] = useState("");
    const [editMode, setEditMode] = useState<'none' | 'name' | 'sequence'>('none');
    const isEditing = editMode !== 'none';
    
    const {
        routineSequence,
        setRoutineSequence,
        addDay,
        removeDay
    } = useRoutineDraft([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Add Day State
    const [isAddingDay, setIsAddingDay] = useState(false);

    // Header Menu State
    const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
    const [headerMenuPos, setHeaderMenuPos] = useState({ top: 0, right: 0 });
    const headerMenuRef = React.useRef<View>(null);
    const { width: SCREEN_WIDTH } = Dimensions.get('window');

    // Initialize
    useEffect(() => {
        if (!editingRoutineId) {
            Alert.alert("Error", "Routine ID is required");
            router.back();
            return;
        }

        const routine = routines.find((r: any) => r.id === editingRoutineId);
        if (routine && !hasInitialized) {
            setRoutineDraftName(routine.name);
            setRoutineSequence(routine.sequence ? JSON.parse(JSON.stringify(routine.sequence)) : []);
            setHasInitialized(true);
            setIsLoading(false);
        } else if (routines.length > 0 && !hasInitialized) {
            // If we've loaded routines but ours isn't there and we haven't initialized yet,
            // then it's actually missing. If we HAVE initialized, it was probably just deleted.
            Alert.alert("Error", "Routine not found");
            router.back();
            setIsLoading(false);
        }
    }, [editingRoutineId, routines, router, setRoutineSequence, hasInitialized]);

    async function handleSaveRoutine() {
        if (!routineDraftName.trim()) {
            Alert.alert("Required", "Please enter a routine name");
            return;
        }

        if (routineSequence.length === 0) {
            Alert.alert("Empty Routine", "Please add at least one day to the routine");
            return;
        }

        setIsSaving(true);
        const onSuccess = () => {
             setIsSaving(false);
             setEditMode('none'); // Reset edit mode on success
        };

        if (editingRoutineId) {
            updateRoutine(editingRoutineId, routineDraftName, routineSequence, onSuccess);
        }
    }

    // --- Sequence Manipulation ---

    function handleAddDay(item: any) {
        addDay(item);
        setIsAddingDay(false);
        setEditMode('sequence'); // Automatically enter sequence editing mode
    }
    
    const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
        const isEditingSequence = editMode === 'sequence';
        return (
            <ScaleDecorator activeScale={1.05}>
                <TouchableOpacity
                    onLongPress={isEditingSequence ? drag : undefined}
                    disabled={isActive}
                    activeOpacity={1}
                    className={`bg-light-lighter dark:bg-dark-lighter rounded-xl mb-3 overflow-hidden border p-3 flex-row items-center justify-between ${isActive ? 'border-primary dark:border-primary-dark' : 'border-bg-dark dark:border-bg-dark-dark'}`}
                >
                    <View className="flex-row items-center flex-1 mr-2">
                            <View>
                            <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                            <Text className="text-light-muted dark:text-dark-muted text-sm">
                                {item.type === 'rest' ? 'Rest Day' : 'Workout'}
                            </Text>
                        </View>
                    </View>
                    
                    {isEditingSequence && (
                        <View className="flex-row items-center">
                            <TouchableOpacity onPressIn={drag} className="p-2 mr-2"> 
                                    <IconSymbol name="line.3.horizontal" size={20} color={theme.icon as string} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); removeDay(item.id); }} className="p-2"> 
                                <IconSymbol name="trash.fill" size={18} color={theme.error as string} />
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    function handleCancel() {
        if (editingRoutineId) {
            // Revert changes
            const routine = routines.find((r: any) => r.id === editingRoutineId);
            if (routine) {
                setRoutineDraftName(routine.name);
                setRoutineSequence(routine.sequence ? JSON.parse(JSON.stringify(routine.sequence)) : []);
            }
            setEditMode('none');
        } else {
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
        <GestureHandlerRootView style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View className="flex-1 bg-light dark:bg-dark">
            <Stack.Screen options={{ headerShown: false }} />
             <ScreenHeader
                title={
                    editMode === 'name' ? (
                        <TextInput 
                            defaultValue={routineDraftName} 
                            onChangeText={setRoutineDraftName} 
                            className="text-[20px] font-bold text-light dark:text-dark text-center flex-1"
                            placeholder="Routine Name"
                            autoFocus
                            placeholderTextColor={theme.textMuted}
                        />
                    ) : (
                        routineDraftName
                    )
                }
                leftAction={
                    isEditing ? (
                        <RaisedCard 
                            onPress={handleCancel} 
                            className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark-lighter items-center justify-center" 
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
                            onPress={handleSaveRoutine} 
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
                    ) : (
                        <View ref={headerMenuRef as any}>
                            <RaisedCard 
                                onPress={(e) => { 
                                    const showMenu = (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                                        setHeaderMenuPos({ 
                                            top: pageY + height + 4, 
                                            right: SCREEN_WIDTH - pageX - width
                                        });
                                        setHeaderMenuVisible(true);
                                    };
                                    if (headerMenuRef.current?.measure && typeof jest === 'undefined') {
                                        headerMenuRef.current.measure((x, y, width, height, pageX, pageY) => showMenu(x, y, width, height, pageX, pageY));
                                    } else {
                                        showMenu(0, 0, 44, 44, 0, 0);
                                    }
                                }} 
                                className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark-lighter items-center justify-center" 
                                style={{ borderRadius: 9999 }}
                            >
                                <IconSymbol name="ellipsis" size={22} color={theme.primary} />
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
                        <TouchableOpacity 
                            onPress={(e) => { 
                                e?.stopPropagation(); 
                                setHeaderMenuVisible(false); 
                                setEditMode('name'); 
                            }} 
                            className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                        >
                            <IconSymbol name="pencil" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                            <Text style={{ color: theme.text as string }} className="font-medium">Edit Routine Name</Text>
                        </TouchableOpacity>
                        
                        <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                        
                        <TouchableOpacity 
                            onPress={(e) => { 
                                e?.stopPropagation(); 
                                setHeaderMenuVisible(false); 
                                Alert.alert('Delete Routine', 'Are you sure?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Delete', 
                                        style: 'destructive', 
                                        onPress: () => {
                                             deleteRoutine(editingRoutineId, {
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
                    </RaisedCard>
                </TouchableOpacity>
            </Modal>

            <View className="flex-1">
                <View className="mt-32 px-4">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Schedule</Text>
                        <RaisedCard 
                            onPress={() => {
                                if (editMode === 'sequence') {
                                    handleSaveRoutine();
                                } else {
                                    setEditMode('sequence');
                                }
                            }}
                            style={{ borderRadius: 9999 }}
                            className="h-10 active:h-9 px-4 items-center justify-center"
                        >
                            <Text className="text-sm text-primary font-semibold">
                                {editMode === 'sequence' ? 'Save Routine' : 'Edit Routine'}
                            </Text>
                        </RaisedCard>
                    </View>
                </View>
                {routineSequence.length === 0 ? (
                    <View className="items-center opacity-80 px-4 pt-10">
                        <Text className="text-lg text-light-muted dark:text-dark-muted mb-6">No days added yet</Text>
                        <TouchableOpacity 
                            onPress={() => setIsAddingDay(true)}
                            className="w-full py-4 items-center justify-center border-dashed border-2 border-primary/30 bg-transparent rounded-xl"
                        >
                            <View className="flex-row items-center">
                                <IconSymbol name="plus" size={20} color={theme.primary as string} style={{ marginRight: 8 }} />
                                <Text className="text-base text-primary font-semibold">Add First Day</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <DraggableFlatList
                        data={routineSequence}
                        onDragEnd={({ data }) => setRoutineSequence(data)}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 6 }}
                        containerStyle={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        activationDistance={20}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        ListFooterComponent={
                            <View className="mt-2 mb-20">
                                <TouchableOpacity 
                                    onPress={() => setIsAddingDay(true)}
                                    className="py-4 items-center justify-center border-dashed border-2 border-primary/30 bg-transparent rounded-xl"
                                >
                                    <View className="flex-row items-center">
                                        <IconSymbol name="plus" size={20} color={theme.primary as string} style={{ marginRight: 8 }} />
                                        <Text className="text-base text-primary font-semibold">Add Day</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Add Day Modal */}
            <AddDay
                visible={isAddingDay}
                onClose={() => setIsAddingDay(false)}
                onAddRestDay={() => handleAddDay('rest')}
                onAddWorkout={handleAddDay}
                savedWorkouts={savedWorkouts}
            />
        </View>
        </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    );
}
