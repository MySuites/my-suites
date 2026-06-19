import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useRouter, Stack } from 'expo-router';
import { useUITheme as useTheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useRoutineDraft } from '../../hooks/routines/useRoutineManager';
import { AddDay } from '../../components/routines/AddDay';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function CreateRoutineScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { setIsHidden } = useFloatingButton();
    
    // Hide floating buttons
    useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

    const { savedWorkouts, saveRoutineDraft } = useWorkoutManager();

    const [routineDraftName, setRoutineDraftName] = useState("");
    
    const {
        routineSequence,
        setRoutineSequence,
        addDay,
        removeDay
    } = useRoutineDraft([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isAddingDay, setIsAddingDay] = useState(false);

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
        saveRoutineDraft(routineDraftName, routineSequence, () => {
             setIsSaving(false);
             router.back();
        });
    }

    // --- Sequence Manipulation ---

    function handleAddDay(item: any) {
        addDay(item);
        setIsAddingDay(false);
    }
    
    const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
        return (
            <ScaleDecorator activeScale={1.05}>
                <TouchableOpacity
                    onLongPress={drag}
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
                    
                    <View className="flex-row items-center">
                        <TouchableOpacity onPressIn={drag} className="p-2 mr-2"> 
                                <IconSymbol name="line.3.horizontal" size={20} color={theme.icon as string} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); removeDay(item.id); }} className="p-2"> 
                            <IconSymbol name="trash.fill" size={18} color={theme.error as string} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1 bg-light dark:bg-dark">
            <Stack.Screen options={{ headerShown: false }} />
             <ScreenHeader
                title="Create Routine"
                leftAction={<BackButton />}
                rightAction={
                    <RaisedCard 
                        onPress={handleSaveRoutine} 
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
                }
            />

            <View className="flex-1">
                <View className="mt-28 px-4 pt-4">
                    <TextInput 
                        placeholder="Routine Name" 
                        onChangeText={setRoutineDraftName} 
                        className="bg-lighter dark:bg-dark-lighter text-light dark:text-dark p-4 rounded-xl text-[16px] border border-transparent dark:border-highlight-dark mb-6"
                        placeholderTextColor={theme.textMuted || '#888'}
                    />
                    
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Schedule</Text>
                        <RaisedCard 
                            onPress={() => setIsAddingDay(true)}
                            style={{ borderRadius: 9999 }}
                            className="h-10 px-4 items-center justify-center active:h-9"
                        >
                            <Text className="text-sm text-primary font-semibold">Add Day</Text>
                        </RaisedCard>
                    </View>
                </View>
                {routineSequence.length === 0 ? (
                    <View className="items-center opacity-80 px-4">
                        <Text className="text-lg text-light-muted dark:text-dark-muted">No days added yet</Text>
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
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
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
    );
}
