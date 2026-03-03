import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Text, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { useExerciseStats } from '../../hooks/workouts/useExerciseStats';
import { ExerciseChart } from '../../components/exercises/ExerciseChart';

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
            if (!exercise?.id) {
                return;
            }
            try {
                const allExercises = await DataRepository.getExercises();
                if (!isMounted) return;

                // Build direct forward and backward adjacency maps to isolate the lineage
                const forwardAdj = new Map<string, Set<string>>();
                const backwardAdj = new Map<string, Set<string>>();

                allExercises.forEach(ex => {
                    if (!forwardAdj.has(ex.id)) forwardAdj.set(ex.id, new Set());
                    if (!backwardAdj.has(ex.id)) backwardAdj.set(ex.id, new Set());
                    
                    (ex.nextVariations || []).forEach((childId: string) => {
                        if (!forwardAdj.has(ex.id)) forwardAdj.set(ex.id, new Set());
                        if (!forwardAdj.has(childId)) forwardAdj.set(childId, new Set());
                        if (!backwardAdj.has(ex.id)) backwardAdj.set(ex.id, new Set());
                        if (!backwardAdj.has(childId)) backwardAdj.set(childId, new Set());
                        
                        forwardAdj.get(ex.id)!.add(childId);
                        backwardAdj.get(childId)!.add(ex.id);
                    });
                });

                // Find all nodes in the direct lineage (ancestors + descendants) of `exercise.id`
                const relevantNodes = new Set<string>();
                relevantNodes.add(exercise.id);

                // Find Descendants
                let queue = [exercise.id];
                while (queue.length > 0) {
                    const curr = queue.shift()!;
                    const children = forwardAdj.get(curr) || new Set();
                    for (const child of children) {
                        if (!relevantNodes.has(child)) {
                            relevantNodes.add(child);
                            queue.push(child);
                        }
                    }
                }

                // Find Ancestors
                queue = [exercise.id];
                while (queue.length > 0) {
                    const curr = queue.shift()!;
                    const parents = backwardAdj.get(curr) || new Set();
                    for (const parent of parents) {
                        if (!relevantNodes.has(parent)) {
                            relevantNodes.add(parent);
                            queue.push(parent);
                        }
                    }
                }

                const siblings = allExercises.filter(e => relevantNodes.has(e.id));
                // Only show variation tree if there is more than 1 connected node
                setVariations(siblings.length > 1 ? siblings : []);
            } catch (e) {
                console.error("Failed to load variations", e);
            }
        }
        loadVariations();
        return () => { isMounted = false; };
    }, [exercise?.id]);

    // Removed handleSetActiveVariation because isActiveProgression is deprecated.

    const handleSelectVariation = useCallback((ex: Exercise) => {
         setSelectedVariation(ex);
    }, []);
    
    const handleViewVariationDetails = useCallback((ex: Exercise) => {
         setSelectedVariation(null);
         router.push({
            pathname: '/exercises/details' as any,
            params: { exercise: JSON.stringify(ex) }
        });
    }, [router]);

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
                <View style={{ 
                    backgroundColor: 'transparent',
                    borderRadius: 16, 
                    padding: 16, 
                    marginBottom: 24 
                }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(() => {
                            const combinedProps = [...(exercise?.muscle_groups || []), ...(exercise?.properties || [])].filter(Boolean);
                            if (combinedProps.length > 0) {
                                return combinedProps.map((prop: string, index: number) => (
                                    <View key={index} style={{ 
                                        backgroundColor: activeToggleBg, 
                                        paddingHorizontal: 12, 
                                        paddingVertical: 6, 
                                        borderRadius: 16 
                                    }}>
                                        <Text style={{ fontSize: 13, color: currentColors.text }}>{String(prop)}</Text>
                                    </View>
                                ));
                            } else {
                                return (
                                    <>
                                        <Text style={{ fontStyle: 'italic', color: currentColors.text, opacity: 0.6 }}>No specific properties</Text>
                                        {exercise?.rawType && (
                                            <View style={{ 
                                                backgroundColor: activeToggleBg, 
                                                paddingHorizontal: 12, 
                                                paddingVertical: 6, 
                                                borderRadius: 16 
                                            }}>
                                                <Text style={{ fontSize: 13, color: currentColors.text }}>{String(exercise.rawType)}</Text>
                                            </View>
                                        )}
                                    </>
                                );
                            }
                        })()}
                    </View>
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
                    {variations.length > 0 && (
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

                <View style={{ display: activeTab === 'performance' ? 'flex' : 'none' }}>
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


                </View>

                <View style={{ 
                    display: activeTab === 'instructions' ? 'flex' : 'none',
                    backgroundColor: cardBackground,
                    borderRadius: 16, 
                    padding: 16, 
                }}>
                    <Text className="text-base leading-6 font-semibold" style={{ marginBottom: 12, color: currentColors.text }}>Instructions</Text>
                    <Text style={{ color: currentColors.text, opacity: 0.6, lineHeight: 24 }}>
                        No instructions available for this exercise yet.
                    </Text>
                </View>

                {variations.length > 0 && (
                    <View style={{ display: activeTab === 'variations' ? 'flex' : 'none' }}>
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

                            {selectedVariation.difficulty !== undefined && (() => {
                                const diff = Number(selectedVariation.difficulty);
                                const maxStars = 10;
                                const fullStars = Math.floor(diff);
                                const hasHalfStar = diff % 1 !== 0;
                                
                                return (
                                    <View style={{ 
                                        flexDirection: 'row',
                                        alignSelf: 'center', 
                                        paddingHorizontal: 12, 
                                        paddingVertical: 4, 
                                        borderRadius: 12, 
                                        marginBottom: 16,
                                        borderWidth: 1,
                                        borderColor: currentColors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 2
                                    }}>
                                        <View style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: currentColors.primary,
                                            opacity: 0.15,
                                            borderRadius: 12,
                                        }} />
                                        
                                        {Array.from({ length: maxStars }).map((_, index) => {
                                            if (index < fullStars) {
                                                return <IconSymbol key={index} name="star.fill" size={12} color={currentColors.primary} />;
                                            } else if (index === fullStars && hasHalfStar) {
                                                return <IconSymbol key={index} name="star.leadinghalf.filled" size={12} color={currentColors.primary} />;
                                            }
                                            return null;
                                        })}
                                    </View>
                                );
                            })()}

                            {selectedVariation.description ? (
                                <Text style={{ color: currentColors.text, fontSize: 15, opacity: 0.8, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                                    {selectedVariation.description}
                                </Text>
                            ) : (
                                <View style={{ height: 8 }} />
                            )}

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
