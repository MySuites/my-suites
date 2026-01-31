import React, { useMemo } from 'react';
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
import DefaultExercises from '../../assets/data/default-exercises.json';

export default function ExerciseDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();
    const { user } = useAuth();
    const { deleteCustomExercise } = useWorkoutManager();
    
    const exercise = useMemo(() => {
        try {
            if (typeof params.exercise === 'string') {
                return JSON.parse(params.exercise);
            }
            return null;
        } catch {
            return null;
        }
    }, [params.exercise]);

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
