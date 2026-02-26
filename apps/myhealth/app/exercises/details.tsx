import React, { useMemo, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Text, Alert, Modal } from 'react-native';
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
import { VariationTree } from '../../components/exercises/VariationTree';

export default function ExerciseDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();
    const { user } = useAuth();
    const { deleteCustomExercise } = useWorkoutManager();
    
    const [freshExercise, setFreshExercise] = useState<Exercise | null>(null);
    const [activeTab, setActiveTab] = useState<'instructions' | 'performance' | 'variations'>('performance');
    const [variations, setVariations] = useState<Exercise[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<Exercise | null>(null);

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

    useEffect(() => {
        let isMounted = true;
        async function loadVariations() {
            if (!exercise?.progressionId) {
                return;
            }
            try {
                const all = await DataRepository.getExercises();
                if (!isMounted) return;
                const siblings = all.filter(e => e.progressionId === exercise.progressionId);
                setVariations(siblings);
            } catch (e) {
                console.error("Failed to load variations", e);
            }
        }
        loadVariations();
        return () => { isMounted = false; };
    }, [exercise?.progressionId]);

    const handleSetActiveVariation = async (ex: Exercise) => {
        const updated = variations.map(e => ({
            ...e,
            isActiveProgression: e.id === ex.id
        }));
        setVariations(updated);

        try {
            await DataRepository.saveExercises(updated);
            setSelectedVariation(null);
            
            if (ex.id === freshExercise?.id) {
                 setFreshExercise({ ...freshExercise, isActiveProgression: true });
            } else if (freshExercise) {
                 setFreshExercise({ ...freshExercise, isActiveProgression: false });
            }
        } catch (e) {
            console.error("Failed to save progression", e);
            Alert.alert("Error", "Failed to update progression");
            setVariations(variations);
        }
    };

    const handleSelectVariation = (ex: Exercise) => {
         setSelectedVariation(ex);
    };
    
    const handleViewVariationDetails = (ex: Exercise) => {
         setSelectedVariation(null);
         router.push({
            pathname: '/exercises/details' as any,
            params: { exercise: JSON.stringify(ex) }
        });
    };

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

                {/* Variations button removed */}

                {/* Tabs */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: toggleBackground,
                    borderRadius: 8,
                    padding: 4,
                    marginBottom: 24
                }}>
                    <Pressable
                        onPress={() => setActiveTab('instructions')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'instructions' ? activeToggleBg : 'transparent',
                            borderRadius: 6,
                        }}
                    >
                        <Text style={{
                            color: activeTab === 'instructions' ? activeToggleText : currentColors.text,
                            fontWeight: activeTab === 'instructions' ? '600' : '400',
                            opacity: activeTab === 'instructions' ? 1 : 0.7
                        }}>Instructions</Text>
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
                            color: activeTab === 'performance' ? activeToggleText : currentColors.text,
                            fontWeight: activeTab === 'performance' ? '600' : '400',
                            opacity: activeTab === 'performance' ? 1 : 0.7
                        }}>Performance</Text>
                    </Pressable>
                    {exercise.progressionId && (
                        <Pressable
                            onPress={() => setActiveTab('variations')}
                            style={{
                                flex: 1,
                                paddingVertical: 8,
                                alignItems: 'center',
                                backgroundColor: activeTab === 'variations' ? activeToggleBg : 'transparent',
                                borderRadius: 6,
                            }}
                        >
                            <Text style={{
                                color: activeTab === 'variations' ? activeToggleText : currentColors.text,
                                fontWeight: activeTab === 'variations' ? '600' : '400',
                                opacity: activeTab === 'variations' ? 1 : 0.7
                            }}>Variations</Text>
                        </Pressable>
                    )}
                </View>

                {activeTab === 'performance' && (
                    <View>
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
                    </View>
                )}

                {activeTab === 'instructions' && (
                    <View style={{ 
                        backgroundColor: cardBackground,
                        borderRadius: 16, 
                        padding: 16, 
                    }}>
                        <Text className="text-base leading-6 font-semibold" style={{ marginBottom: 12, color: currentColors.text }}>Instructions</Text>
                        <Text style={{ color: currentColors.text, opacity: 0.6, lineHeight: 24 }}>
                            No instructions available for this exercise yet.
                        </Text>
                    </View>
                )}

                {activeTab === 'variations' && exercise.progressionId && (
                    <View>
                        {variations.length === 0 ? (
                            <View style={{ padding: 16, alignItems: 'center' }}>
                                <Text style={{ color: currentColors.text }}>Loading variations...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={{ padding: 16, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, marginBottom: 16 }}>
                                    <Text style={{ color: currentColors.text, opacity: 0.8, fontSize: 13, textAlign: 'center' }}>
                                        Tap a variation to view its details and manage goals.
                                    </Text>
                                </View>
                                <VariationTree 
                                    exercises={variations} 
                                    onSetActive={handleSetActiveVariation}
                                    onSelect={handleSelectVariation}
                                />
                            </>
                        )}
                    </View>
                )}

                {/* Spacer to ensure content is fully scrollable above floating elements */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Variation Action Modal */}
            <Modal transparent visible={!!selectedVariation} animationType="fade">
                {selectedVariation && (
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 24,
                        zIndex: 1000,
                    }}>
                        <Pressable 
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
                            onPress={() => setSelectedVariation(null)} 
                        />
                        <View style={{
                            backgroundColor: currentColors.card,
                            borderRadius: 24,
                            padding: 24,
                            width: '100%',
                            maxWidth: 400,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                        }}>
                            <Text style={{ color: currentColors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                                {selectedVariation.name}
                            </Text>
                            <Text style={{ color: currentColors.text, opacity: 0.7, fontSize: 16, marginBottom: selectedVariation.description ? 8 : 24, textTransform: 'capitalize', textAlign: 'center' }}>
                                {selectedVariation.difficulty || 'Normal'} Difficulty
                            </Text>

                            {selectedVariation.description && (
                                <Text style={{ color: currentColors.text, opacity: 0.8, fontSize: 14, fontStyle: 'italic', marginBottom: 24, textAlign: 'center' }}>
                                    {selectedVariation.description}
                                </Text>
                            )}

                            <RaisedCard
                                onPress={() => handleSetActiveVariation(selectedVariation)}
                                className="items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0 mb-3"
                                style={{ borderRadius: 9999 }}
                            >
                                <View className="flex-row items-center justify-center">
                                    <IconSymbol name="star.fill" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text className="text-lg font-bold text-white">
                                        Set as Active
                                    </Text>
                                </View>
                            </RaisedCard>

                            <Pressable
                                onPress={() => handleViewVariationDetails(selectedVariation)}
                                style={({pressed}: {pressed: boolean}) => ({
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    opacity: pressed ? 0.8 : 1
                                })}
                            >
                                <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '600' }}>
                                    View Full Details
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
}
