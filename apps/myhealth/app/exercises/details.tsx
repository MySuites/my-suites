import React, { useMemo, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Text, Alert, ActivityIndicator } from 'react-native';
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
import { ProgressionSelect } from '../../components/exercises/ProgressionSelect';
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

    const [progressionExercises, setProgressionExercises] = useState<Exercise[]>([]);
    const [loadingProgression, setLoadingProgression] = useState(false);

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
                
                // 2. If the fresh exercise has a progression, load siblings
                if (currentFresh.progressionId) {
                    setLoadingProgression(true);
                    const siblings = allExercises.filter(e => e.progressionId === currentFresh.progressionId);
                    setProgressionExercises(siblings);
                    setLoadingProgression(false);
                }
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

    const handleSetActiveProgression = async (target: Exercise) => {
        // Optimistic update
        const updated = progressionExercises.map(e => ({
            ...e,
            isActiveProgression: e.id === target.id
        }));
        setProgressionExercises(updated);

        // Persist
        try {
            await DataRepository.saveExercises(updated);
        } catch (e) {
            console.error("Failed to save progression", e);
            Alert.alert("Error", "Failed to update progression");
        }
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
        primary: theme.primary || '#FF6F61',
        background: theme.bg || '#EAD4D4',
        card: theme.bgDark || theme.bg || '#EAD4D4',
        text: theme.text || '#2D1F1F',
        border: theme.border || theme.bgLight || '#EAD4D4'
    };
    
    // Derived UI colors
    const cardBackground = currentColors.card;
    const toggleBackground = theme.bg || theme.bgDark || '#EAD4D4'; 
    const activeToggleBg = theme.bgLight || '#FFF5F5'; 
    const activeToggleText = theme.text || '#2D1F1F';

    return (
        <View style={{ flex: 1, backgroundColor: currentColors.background }}>
             {/* Header */}
             <ScreenHeader 
                title={exercise.name || 'Details'} 
                leftAction={<BackButton />} 
                rightAction={!isDefault ? (
                    <RaisedCard 
                        onPress={handleDelete}
                        style={{ borderRadius: 9999 }}
                        className="w-12 h-12 p-0 my-0 rounded-full items-center justify-center bg-light dark:bg-dark-lighter"
                    >
                        <IconSymbol 
                            name="trash.fill" 
                            size={24} 
                            color={theme.destructive || '#FF3B30'} 
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

                {/* Progression Selector */}
                {loadingProgression ? (
                    <ActivityIndicator size="small" color={currentColors.primary} style={{ marginBottom: 24 }} />
                ) : exercise.progressionId ? (
                    <ProgressionSelect 
                        currentExercise={exercise}
                        progressionExercises={progressionExercises}
                        onSelect={(ex) => {
                            router.replace({
                                pathname: '/exercises/details',
                                params: { exercise: JSON.stringify(ex) }
                            });
                        }}
                        onSetActive={handleSetActiveProgression}
                    />
                ) : null}

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
                    toggleBackground={toggleBackground}
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
