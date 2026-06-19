import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { WorkoutNamePrompt } from '../../components/workouts/WorkoutNamePrompt';

export default function EndWorkoutScreen() {
    const router = useRouter();
    const theme = useUITheme();
    const { 
        workoutName,
        exercises,
        finishWorkout,
        cancelWorkout,
        sourceWorkoutId,
        routineId 
    } = useActiveWorkout();
    
    const { workoutSeconds } = useActiveWorkoutTimer();
    
    const { savedWorkouts, updateSavedWorkout, saveWorkout } = useWorkoutManager();
    const [isSaving, setIsSaving] = React.useState(false);
    const [showNamePrompt, setShowNamePrompt] = React.useState(false);
    const [pendingName, setPendingName] = React.useState("");

    const completedSetsCount = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
    const filteredExercises = exercises.filter(ex => (ex.completedSets || 0) > 0);
    const totalExercises = filteredExercises.length;

    const [notes, setNotes] = React.useState("");

    const ChangeType = {
        NONE: 'NONE',
        VALUE: 'VALUE',
        STRUCTURE: 'STRUCTURE'
    };
    
    const getWorkoutChangeType = (currentArr: any[], originalArr: any[]) => {
        if (currentArr.length !== originalArr.length) return ChangeType.STRUCTURE;
        
        let hasValueChange = false;
        
        for (let i = 0; i < currentArr.length; i++) {
            const cur = currentArr[i];
            const orig = originalArr[i];
            
            // Structure check: Name, Set count, and Properties
            if (cur.name !== orig.name) return ChangeType.STRUCTURE;
            if (Number(cur.sets) !== Number(orig.sets)) return ChangeType.STRUCTURE;
            
            const p1 = cur.properties || [];
            const p2 = orig.properties || [];
            if (p1.length !== p2.length) return ChangeType.STRUCTURE;
            for (let k = 0; k < p1.length; k++) {
                if (p1[k] !== p2[k]) return ChangeType.STRUCTURE;
            }
            
            // Value check (set targets)
            const t1 = cur.setTargets || [];
            const t2 = orig.setTargets || [];
            
            for (let j = 0; j < Math.max(t1.length, t2.length); j++) {
                const v1 = t1[j] || {};
                const v2 = t2[j] || {};
                const repsMatch = Number(v1.reps || 0) === Number(v2.reps || 0);
                const weightMatch = Number(v1.weight || 0) === Number(v2.weight || 0);
                const durMatch = Number(v1.duration || 0) === Number(v2.duration || 0);
                const distMatch = Number(v1.distance || 0) === Number(v2.distance || 0);
                
                if (!repsMatch || !weightMatch || !durMatch || !distMatch) {
                    hasValueChange = true;
                }
            }
        }
        return hasValueChange ? ChangeType.VALUE : ChangeType.NONE;
    };

    const handleSave = async () => {
        if (isSaving) return;

        if (completedSetsCount === 0) {
            Alert.alert(
                "No Sets Completed",
                "You must complete at least one set to save this workout.",
                [{ text: "OK" }]
            );
            return;
        }

        const finalize = () => {
            finishWorkout(notes);
            router.dismiss();
        };

        // Paths are now mutually exclusive to prevent double-prompts
        if (sourceWorkoutId) {
            const original = savedWorkouts.find(w => w.id === sourceWorkoutId);
            if (original) {
                const changeType = getWorkoutChangeType(exercises, original.exercises);
                
                if (changeType === ChangeType.STRUCTURE) {
                    Alert.alert(
                        "Update Template?",
                        "You've made structural changes to this workout. Do you want to update the saved template?",
                        [
                            {
                                text: "No, History Only",
                                onPress: finalize
                            },
                            {
                                text: "Yes, Update Template",
                                onPress: async () => {
                                    setIsSaving(true);
                                    try {
                                        const updatedExercises = exercises.map(({ logs, previousLog, completedSets, ...rest }: any) => ({
                                            ...rest,
                                            completedSets: 0,
                                            logs: []
                                        }));
                                        
                                        await updateSavedWorkout(
                                            sourceWorkoutId, 
                                            original.name, 
                                            updatedExercises, 
                                            finalize
                                        );
                                    } catch (e) {
                                        console.error("Failed to update template", e);
                                        finalize();
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            },
                            {
                                text: "Cancel",
                                style: "cancel"
                            }
                        ]
                    );
                    return;
                } else if (changeType === ChangeType.VALUE) {
                    // Auto-update values in background
                    setIsSaving(true);
                    try {
                        const updatedExercises = exercises.map(({ logs, previousLog, completedSets, ...rest }: any) => ({
                            ...rest,
                            completedSets: 0,
                            logs: []
                        }));
                        
                        await updateSavedWorkout(
                            sourceWorkoutId, 
                            original.name, 
                            updatedExercises, 
                            finalize
                        );
                        return; // finalize is called by updateSavedWorkout
                    } catch (e) {
                        console.error("Failed to auto-update template", e);
                        finalize();
                    } finally {
                        setIsSaving(false);
                    }
                    return;
                }
            }
            
            finalize();
            return;
        } 
        
        // Only prompt for NEW template if there was no SOURCE template and it's not a routine
        if (totalExercises > 0 && !routineId) {
            Alert.alert(
                "Save as Template?",
                "Would you like to save this workout as a template for future use?",
                [
                    {
                        text: "History Only",
                        onPress: finalize
                    },
                    {
                        text: "Save as Template",
                        onPress: () => {
                            setPendingName(workoutName || "New Workout");
                            setShowNamePrompt(true);
                        }
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
            return;
        }

        // Catch-all for routines or empty workouts with no exercises
        finalize();
    };

    const handleDiscard = () => {
        Alert.alert(
            "Discard Workout?",
            "Are you sure you want to discard this workout? All progress will be lost.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Discard", 
                    style: "destructive", 
                    onPress: () => {
                        cancelWorkout();
                        router.dismiss();
                    }
                }
            ]
        );
    };

    const handlePromptSave = async (name: string) => {
        setShowNamePrompt(false);
        setIsSaving(true);
        try {
            // Strip logs and set counts to 0 for template
            const templateExercises = exercises.map(({ logs, previousLog, completedSets, ...rest }) => ({
                ...rest,
                completedSets: 0,
                logs: []
            }));
            
            await saveWorkout(
                name,
                templateExercises,
                () => {}
            );
            finishWorkout(notes);
            router.dismiss();
        } catch (e) {
            console.error("Failed to save new template", e);
            finishWorkout(notes);
            router.dismiss();
        } finally {
            setIsSaving(false);
        }
    };

    const handlePromptCancel = () => {
        setShowNamePrompt(false);
        // Re-trigger the alert logic - we can just call handleSave again
        // wrapping it in setTimeout to ensure the modal is fully closed on some platforms
        setTimeout(() => {
            handleSave();
        }, 300);
    };

    // Helper to format time if utils generic doesn't exist
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader 
                title="Workout Summary" 
                leftAction={<BackButton />} 
                rightAction={
                    <RaisedCard
                        testID="save-workout-btn"
                        onPress={handleSave}
                        className="w-12 h-12 p-0 rounded-full items-center justify-center"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol name="checkmark" size={24} color={theme.primary} />
                    </RaisedCard>
                }
            />
            
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingTop: 124, paddingHorizontal: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <RaisedCard className="p-6 mb-6 items-center">
                    <Text className="text-2xl font-bold text-light dark:text-dark mb-2">{workoutName}</Text>
                    <Text className="text-4xl font-black text-primary dark:text-primary-dark mb-4">
                        {formatDuration(workoutSeconds)}
                    </Text>
                    
                    <View className="flex-row gap-8">
                        <View className="items-center">
                            <Text className="text-xl font-bold text-light dark:text-dark">{completedSetsCount}</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Sets</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-bold text-light dark:text-dark">{totalExercises}</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Exercises</Text>
                        </View>
                    </View>
                </RaisedCard>

                <RaisedCard className="p-4 mb-6">
                    <Text className="font-semibold text-light dark:text-dark mb-2 text-lg">Notes</Text>
                    <TextInput 
                        className="text-light dark:text-dark min-h-[80px] p-2 border border-black/10 dark:border-white/10 rounded-lg"
                        multiline
                        placeholder="How did it feel?"
                        placeholderTextColor="#9CA3AF"
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                    />
                </RaisedCard>

                <RaisedCard className="p-4 mb-6">
                    <Text className="font-semibold text-light dark:text-dark mb-4 text-lg">Detailed Summary</Text>
                    {filteredExercises.map((ex, idx) => (
                        <View key={idx} className="flex-row justify-between mb-2">
                             <Text className="text-light dark:text-dark flex-1">{ex.name}</Text>
                             <Text className="text-gray-500 dark:text-gray-400">
                                {ex.completedSets || 0} / {ex.sets} sets
                             </Text>
                        </View>
                    ))}
                </RaisedCard>
                <View className="gap-3 pb-40">
                    <TouchableOpacity 
                        onPress={handleDiscard}
                        className="bg-red-500/10 py-4 rounded-xl items-center border border-red-500/20"
                    >
                        <Text className="text-red-500 font-bold text-lg">Discard Workout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <WorkoutNamePrompt 
                visible={showNamePrompt}
                onClose={handlePromptCancel}
                onSave={handlePromptSave}
                initialName={pendingName}
            />
        </View>
        </TouchableWithoutFeedback>
    );
}
