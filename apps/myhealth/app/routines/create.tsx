import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mysuite/ui';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useRoutineDraft } from '../../hooks/routines/useRoutineDraft';
import { RoutineDraftItem } from '../../components/routines/RoutineDraftItem';
import { AddDayModal } from '../../components/routines/AddDayModal';

export default function CreateRoutineScreen() {
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
        saveRoutineDraft, 
        updateRoutine, 
        deleteRoutine 
    } = useWorkoutManager();

    const editingRoutineId = typeof id === 'string' ? id : null;
    const [routineDraftName, setRoutineDraftName] = useState("");
    
    const {
        routineSequence,
        setRoutineSequence,
        addDay,
        removeDay
    } = useRoutineDraft([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Add Day State
    const [isAddingDay, setIsAddingDay] = useState(false);

    // Initialize
    useEffect(() => {
        if (editingRoutineId) {
            const routine = routines.find((r: any) => r.id === editingRoutineId);
            if (routine) {
                setRoutineDraftName(routine.name);
                setRoutineSequence(routine.sequence ? JSON.parse(JSON.stringify(routine.sequence)) : []);
            } else {
                Alert.alert("Error", "Routine not found");
                router.back();
            }
        }
        setIsLoading(false);
    }, [editingRoutineId, routines, router, setRoutineSequence]);

    async function handleSaveRoutine() {
        if (!routineDraftName.trim()) {
            Alert.alert("Required", "Please enter a routine name");
            return;
        }

        setIsSaving(true);
        const onSuccess = () => {
             setIsSaving(false);
             router.back();
        };

        if (editingRoutineId) {
            updateRoutine(editingRoutineId, routineDraftName, routineSequence, onSuccess);
        } else {
            saveRoutineDraft(routineDraftName, routineSequence, onSuccess);
        }
    }

    // --- Sequence Manipulation ---

    function handleAddDay(item: any) {
        addDay(item);
        setIsAddingDay(false);
    }
    
    const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
        return (
            <RoutineDraftItem
                item={item}
                drag={drag}
                isActive={isActive}
                onRemove={() => removeDay(item.id)}
            />
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-light dark:bg-dark">
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light dark:bg-dark">
             <View className="flex-row justify-between items-center p-4 border-b border-light-darker dark:border-highlight-dark pt-4 android:pt-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                     <Text className="text-base leading-[30px] text-primary dark:text-primary-dark">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-light dark:text-dark">{editingRoutineId ? 'Edit Routine' : 'Create Routine'}</Text>
                <TouchableOpacity disabled={isSaving} onPress={handleSaveRoutine} className="p-2">
                    {isSaving ? <ActivityIndicator size="small" /> : <Text className="text-base leading-[30px] text-primary dark:text-primary-dark" style={{ fontWeight: 'bold' }}>Save</Text>}
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                <View className="px-4 pt-4">
                    <TextInput 
                        placeholder="Routine Name" 
                        value={routineDraftName} 
                        onChangeText={setRoutineDraftName} 
                        className="bg-light-lighter dark:bg-dark-lighter text-light dark:text-dark p-4 rounded-xl text-base border border-transparent dark:border-highlight-dark mb-6"
                        placeholderTextColor={theme.textMuted || '#888'}
                    />
                    
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Schedule</Text>
                        <TouchableOpacity onPress={() => setIsAddingDay(true)}>
                            <Text className="text-base leading-[30px] text-primary dark:text-primary-dark" style={{ fontSize: 16 }}>+ Add Day</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {routineSequence.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50 px-4">
                        <Text className="leading-6 mb-2 text-lg text-light-muted dark:text-dark-muted">No days added yet</Text>
                        <TouchableOpacity onPress={() => setIsAddingDay(true)}>
                            <Text className="text-base leading-[30px] text-primary dark:text-primary-dark" style={{ fontSize: 18 }}>Add Day</Text>
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
                    />
                )}
                
                {editingRoutineId && (
                    <TouchableOpacity 
                        onPress={() => {
                            Alert.alert('Delete Routine', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Delete', 
                                    style: 'destructive', 
                                    onPress: () => {
                                        deleteRoutine(editingRoutineId, () => {
                                            router.back();
                                        });
                                    }
                                }
                            ])
                        }} 
                        className="py-3 items-center mt-2 mb-6"
                    >
                        <Text className="text-danger font-semibold text-base">Delete Routine</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Add Day Modal */}
            <AddDayModal
                visible={isAddingDay}
                onClose={() => setIsAddingDay(false)}
                onAddRestDay={() => handleAddDay('rest')}
                onAddWorkout={handleAddDay}
                savedWorkouts={savedWorkouts}
            />
        </View>
    );
}
