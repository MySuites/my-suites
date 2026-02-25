import React, { useMemo, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { useExerciseStats } from '../../hooks/workouts/useExerciseStats';
import { ExerciseChart } from '../../components/exercises/ExerciseChart';
import { ExerciseProperties } from '../../components/exercises/ExerciseProperties';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import DefaultExercises from '../../assets/data/default-exercises';
import { DataRepository } from '../../providers/DataRepository';
import { Exercise } from '../../utils/workout-api/types';

export default function ExerciseDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();
    const { user } = useAuth();
    const { deleteCustomExercise } = useWorkoutManager();
    
    const [freshExercise, setFreshExercise] = useState<Exercise | null>(null);

    // Initial load from params, but act as fallback/skeleton
    const initialExercise = useMemo(() => {
        try {
            if (typeof params.exercise === 'string') {
                return JSON.parse(params.exercise);
            }
            return null;
        } catch {
            return null;
        }
    }, [params.exercise]);

    // effective exercise is fresh, or initial
    const exercise = freshExercise || initialExercise;

    useEffect(() => {
        let isMounted = true;
        
        async function loadData() {
            if (!initialExercise?.id) return;
            
            // 1. Fetch all exercises (or specific if we had optimized method) to get fresh data for CURRENT exercise
            // This ensures we have the latest `progressionId` and `difficulty` even if params are stale
            const allExercises = await DataRepository.getExercises();
            if (!isMounted) return;

            const currentFresh = allExercises.find(e => e.id === initialExercise.id);
            if (currentFresh) {
                setFreshExercise(currentFresh); // Update with DB truth
            }
        }
        
        loadData();
        return () => { isMounted = false; };
    }, [initialExercise?.id]);

    const isDefault = useMemo(() => {
        if (!exercise) return true;
        return DefaultExercises.some(d => d.id === exercise.id);
    }, [exercise]);

    const handleDelete = () => {
        Alert.alert(
            "Delete Exercise",
            "Are you sure you want to delete this custom exercise?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        await deleteCustomExercise(exercise.id);
                        router.back();
                    }
                }
            ]
        );
    };



    const {
        chartData,
        loadingChart,
        selectedMetric,
        setSelectedMetric,
        availableMetrics
    } = useExerciseStats(user, exercise);

    if (!exercise) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <Text style={{ color: theme.text }} className="text-base leading-6">Exercise not found.</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20, padding: 10 }}>
                    <Text className="text-base leading-[30px] text-info">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const currentColors = {
        primary: theme.primary as string,
        background: theme.bg as string,
        card: (theme.bgDark || theme.bg) as string,
        text: theme.text as string,
        border: (theme.border || theme.bgLight) as string
    };
    
    // Derived UI colors
    const cardBackground = currentColors.card;
    const toggleBackground = (theme.bg || theme.bgDark) as string;
    const activeToggleBg = theme.bgLight as string; 
    const activeToggleText = theme.text as string;

    // Use base progression name if applicable
    let displayTitle = exercise.name || 'Details';
    if (exercise.progressionId) {
        const baseId = exercise.progressionId.replace('_progression', '');
        displayTitle = baseId
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    return (
        <View style={{ flex: 1, backgroundColor: currentColors.background }}>
             {/* Header */}
             <ScreenHeader 
                title={displayTitle} 
                leftAction={<BackButton />} 
                rightAction={!isDefault ? (
                    <RaisedCard 
                        onPress={handleDelete}
                        style={{ borderRadius: 9999 }}
                        className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center bg-lighter dark:bg-dark-lighter"
                    >
                        <IconSymbol 
                            name="trash.fill" 
                            size={24} 
                            color={theme.danger || theme.error} 
                        />
                    </RaisedCard>
                ) : undefined}
             />

            <ScrollView style={{ flex: 1, padding: 16, paddingTop: 124 }}>
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 18, color: currentColors.text, opacity: 0.7 }}>
                        {exercise.category || 'Category'}
                    </Text>
                </View>

                {/* Variations Button */}
                {exercise.progressionId && (
                    <Pressable
                        onPress={() => {
                            router.push({
                                pathname: '/exercises/variations' as any,
                                params: { 
                                    progressionId: exercise.progressionId,
                                }
                            });
                        }}
                        style={({ pressed }) => ({
                            backgroundColor: currentColors.card,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 24,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconSymbol name="menu" size={24} color={currentColors.primary} style={{ marginRight: 12 }} />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: currentColors.text }}>
                                View Variations
                            </Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color={currentColors.text} style={{ opacity: 0.5 }} />
                    </Pressable>
                )}

                {/* Performance Chart */}
                <ExerciseChart
                    data={chartData}
                    loading={loadingChart}
                    selectedMetric={selectedMetric}
                    onSelectMetric={setSelectedMetric}
                    availableMetrics={availableMetrics}
                    themeColors={currentColors}
                    cardBackground={cardBackground}
                    toggleBackground={toggleBackground}
                    activeToggleBg={activeToggleBg}
                    activeToggleText={activeToggleText}
                />

                <ExerciseProperties
                    properties={exercise.properties}
                    rawType={exercise.rawType}
                    themeColors={currentColors}
                    cardBackground={cardBackground}
                    toggleBackground={activeToggleBg}
                />

                 <View style={{ 
                    backgroundColor: cardBackground,
                    borderRadius: 16, 
                    padding: 16, 
                    marginBottom: 120 
                }}>
                    <Text className="text-base leading-6 font-semibold" style={{ marginBottom: 12, color: currentColors.text }}>Instructions</Text>
                    <Text style={{ color: currentColors.text, opacity: 0.6, lineHeight: 24 }}>
                        No instructions available for this exercise yet.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}
