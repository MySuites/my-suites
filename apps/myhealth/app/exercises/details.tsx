import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Text, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

interface ExerciseDetailsScreenProps {
    exercise?: Exercise;
    mode?: 'browse' | 'select';
    onSelect?: (exercise: Exercise) => void;
    onBack?: () => void;
}

export default function ExerciseDetailsScreen({
    exercise: propExercise,
    mode: propMode = 'browse',
    onSelect,
    onBack
}: ExerciseDetailsScreenProps = {}) {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { deleteCustomExercise } = useWorkoutManager();
    
    const [freshExercise, setFreshExercise] = useState<Exercise | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'performance' | 'variations'>('performance');
    const [variations, setVariations] = useState<Exercise[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<Exercise | null>(null);
    const [selectedAttachment, setSelectedAttachment] = useState<string>('All');
    const [selectedAttachmentVal, setSelectedAttachmentVal] = useState<string>('');
    const [selectedEquipmentVal, setSelectedEquipmentVal] = useState<string>('');

    // Resolve mode
    const isSelectMode = propMode === 'select' || params.mode === 'select';

    // Initial load from params, but act as fallback/skeleton
    const initialExercise = useMemo(() => {
        if (propExercise) return propExercise;
        try {
            if (typeof params.exercise === 'string') {
                return JSON.parse(params.exercise);
            }
            return null;
        } catch {
            return null;
        }
    }, [propExercise, params.exercise]);

    // effective exercise is fresh, or initial
    const exercise = freshExercise || initialExercise;

    useEffect(() => {
        setSelectedAttachmentVal(exercise?.attachment || '');
        if (exercise?.equipment) {
            if (Array.isArray(exercise.equipment)) {
                setSelectedEquipmentVal(exercise.equipment[0] || '');
            } else {
                setSelectedEquipmentVal(exercise.equipment);
            }
        } else {
            setSelectedEquipmentVal('');
        }
    }, [exercise?.id, exercise?.attachment, exercise?.equipment]);

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

                // Find all nodes in the direct lineage (undirected connected component search) of `exercise.id`
                const relevantNodes = new Set<string>();
                relevantNodes.add(exercise.id);

                let queue = [exercise.id];
                while (queue.length > 0) {
                    const curr = queue.shift()!;
                    const neighbors = new Set<string>();
                    (forwardAdj.get(curr) || []).forEach(n => neighbors.add(n));
                    (backwardAdj.get(curr) || []).forEach(n => neighbors.add(n));
                    
                    for (const neighbor of neighbors) {
                        if (!relevantNodes.has(neighbor)) {
                            relevantNodes.add(neighbor);
                            queue.push(neighbor);
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

    const uniqueAttachments = useMemo(() => {
        const attachments = variations.map(v => (v as any).attachment).filter(Boolean);
        return ['All', ...Array.from(new Set(attachments))];
    }, [variations]);

    const filteredVariations = useMemo(() => {
        return variations.filter(ex => {
            const matchesAttachment = selectedAttachment === 'All' || (ex as any).attachment === selectedAttachment;
            return matchesAttachment;
        });
    }, [variations, selectedAttachment]);

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
                leftAction={<BackButton onPress={onBack} />} 
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
                {/* Tabs */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: toggleBackground,
                    borderRadius: 8,
                    padding: 4,
                    marginBottom: 24
                }}>
                    <Pressable
                        onPress={() => setActiveTab('details')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'details' ? activeToggleBg : 'transparent',
                            borderRadius: 6,
                        }}
                    >
                        <Text style={{
                            color: activeTab === 'details' ? activeToggleText : currentColors.text,
                            fontWeight: activeTab === 'details' ? '600' : '400',
                            opacity: activeTab === 'details' ? 1 : 0.7
                        }}>Details</Text>
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
                    display: activeTab === 'details' ? 'flex' : 'none',
                    backgroundColor: cardBackground,
                    borderRadius: 16, 
                    padding: 4, 
                }}>
                    {/* Tags in Details Tab */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        {(() => {
                            const getMuscleName = (m: any) => {
                                if (typeof m === 'string') return m;
                                if (m?.muscle_groups?.name) return m.muscle_groups.name;
                                if (m?.name) return m.name;
                                return String(m);
                            };

                            const rawMuscles = exercise?.muscle_groups || (exercise?.muscle_group ? [exercise.muscle_group] : []);
                            const muscles = rawMuscles.map(getMuscleName);
                            const primaryMuscle = muscles.length > 0 ? muscles[0] : null;
                            const secondaryMuscles = muscles.slice(1);
                            const properties = exercise?.properties || [];

                            return (
                                <>
                                    {primaryMuscle && (
                                        <View style={{ 
                                            backgroundColor: theme.primary, 
                                            paddingHorizontal: 12, 
                                            paddingVertical: 6, 
                                            borderRadius: 16 
                                        }}>
                                            <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>{primaryMuscle}</Text>
                                        </View>
                                    )}
                                    {secondaryMuscles.map((muscle: string, index: number) => (
                                        <View key={`sec-${index}`} style={{ 
                                            backgroundColor: (theme.bgLight || 'rgba(0,0,0,0.05)'),
                                            paddingHorizontal: 12, 
                                            paddingVertical: 6, 
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: theme.primary,
                                        }}>
                                            <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '500' }}>{muscle}</Text>
                                        </View>
                                    ))}
                                    {properties.map((prop: string, index: number) => (
                                        <View key={`prop-${index}`} style={{ 
                                            backgroundColor: 'rgba(255,255,255,0.1)', 
                                            paddingHorizontal: 12, 
                                            paddingVertical: 6, 
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        }}>
                                            <Text style={{ fontSize: 13, color: currentColors.text }}>{String(prop)}</Text>
                                        </View>
                                    ))}
                                    {exercise?.angle && (
                                         <View style={{ 
                                             backgroundColor: 'rgba(255,255,255,0.1)', 
                                             paddingHorizontal: 12, 
                                             paddingVertical: 6, 
                                             borderRadius: 16,
                                             borderWidth: 1,
                                             borderColor: 'rgba(255,255,255,0.2)'
                                         }}>
                                             <Text style={{ fontSize: 13, color: currentColors.text, textTransform: 'capitalize' }}>{String(exercise.angle)}</Text>
                                         </View>
                                    )}
                                    {selectedAttachmentVal && (
                                         <View style={{ 
                                             backgroundColor: 'rgba(255,255,255,0.1)', 
                                             paddingHorizontal: 12, 
                                             paddingVertical: 6, 
                                             borderRadius: 16,
                                             borderWidth: 1,
                                             borderColor: 'rgba(255,255,255,0.2)'
                                         }}>
                                             <Text style={{ fontSize: 13, color: currentColors.text }}>{selectedAttachmentVal}</Text>
                                         </View>
                                    )}
                                    {selectedEquipmentVal && selectedEquipmentVal !== 'none' && (
                                         <View style={{ 
                                             backgroundColor: 'rgba(255,255,255,0.1)', 
                                             paddingHorizontal: 12, 
                                             paddingVertical: 6, 
                                             borderRadius: 16,
                                             borderWidth: 1,
                                             borderColor: 'rgba(255,255,255,0.2)'
                                         }}>
                                             <Text style={{ fontSize: 13, color: currentColors.text, textTransform: 'capitalize' }}>{selectedEquipmentVal}</Text>
                                         </View>
                                    )}
                                    {exercise?.movementType && (
                                         <View style={{ 
                                              backgroundColor: 'rgba(255,255,255,0.1)', 
                                              paddingHorizontal: 12, 
                                              paddingVertical: 6, 
                                              borderRadius: 16,
                                              borderWidth: 1,
                                              borderColor: 'rgba(255,255,255,0.2)'
                                          }}>
                                              <Text style={{ fontSize: 13, color: currentColors.text, textTransform: 'capitalize' }}>{String(exercise.movementType)}</Text>
                                         </View>
                                    )}
                                    {(!primaryMuscle && secondaryMuscles.length === 0 && properties.length === 0 && !exercise?.angle && !exercise?.attachment && !exercise?.movementType) && (
                                        <Text style={{ fontStyle: 'italic', color: currentColors.text, opacity: 0.6 }}>No specific properties</Text>
                                    )}
                                </>
                            );
                        })()}
                    </View>

                    {/* Attachment Selection Section for Lat Pulldown / Seated Cable Row */}
                    {exercise && (exercise.id === 'lat_pulldown' || exercise.id === 'seated_cable_row') && (
                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                                Select Attachment
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {(exercise.id === 'lat_pulldown' 
                                    ? ["Lat Bar", "Wide-Grip Bar", "Close-Grip V-Bar", "Neutral-Grip Handles"] 
                                    : ["Close-Grip V-Bar", "Wide-Grip Bar", "Neutral-Grip Handles", "Straight Bar"]
                                ).map((att) => {
                                    const isSelected = selectedAttachmentVal === att;
                                    return (
                                        <Pressable
                                            key={att}
                                            onPress={() => setSelectedAttachmentVal(att)}
                                            style={{
                                                backgroundColor: isSelected ? theme.primary : 'rgba(255,255,255,0.05)',
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <Text style={{
                                                color: isSelected ? '#FFFFFF' : currentColors.text,
                                                fontSize: 14,
                                                fontWeight: '600',
                                            }}>
                                                {att}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Equipment Selection Section */}
                    {exercise && Array.isArray(exercise.equipment) && exercise.equipment.length > 1 && (
                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                                Select Equipment
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {exercise.equipment.map((eqName: string) => {
                                    const value = eqName;
                                    const label = eqName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                    return { value, label };
                                }).map((opt: any) => {
                                    const isSelected = selectedEquipmentVal === opt.value;
                                    return (
                                        <Pressable
                                            key={opt.value}
                                            onPress={() => setSelectedEquipmentVal(opt.value)}
                                            style={{
                                                backgroundColor: isSelected ? theme.primary : 'rgba(255,255,255,0.05)',
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <Text style={{
                                                color: isSelected ? '#FFFFFF' : currentColors.text,
                                                fontSize: 14,
                                                fontWeight: '600',
                                            }}>
                                                {opt.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    <Text style={{ color: currentColors.text, opacity: 0.7, lineHeight: 24, fontSize: 15, marginBottom: 24 }}>
                        {exercise.description || "No description available for this exercise yet."}
                    </Text>

                    {/* Instructions Section */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <IconSymbol name="list.bullet" size={18} color={theme.primary} />
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700' }}>
                                Instructions
                            </Text>
                        </View>
                        {exercise.instructions && exercise.instructions.length > 0 ? (
                            <View style={{ gap: 12 }}>
                                {exercise.instructions.map((step: string, index: number) => (
                                    <View key={index} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                        <View style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            backgroundColor: (theme.bgLight || 'rgba(0,0,0,0.05)'),
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 1
                                        }}>
                                            <Text style={{ color: currentColors.text, fontSize: 11, fontWeight: '700', opacity: 0.8 }}>
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <Text style={{ flex: 1, color: currentColors.text, opacity: 0.8, fontSize: 14, lineHeight: 20 }}>
                                            {step}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={{ 
                                padding: 16, 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                borderRadius: 12, 
                                borderStyle: 'dashed', 
                                borderWidth: 1, 
                                borderColor: 'rgba(255,255,255,0.1)',
                                alignItems: 'center'
                            }}>
                                <Text style={{ color: currentColors.text, opacity: 0.5, fontSize: 14 }}>
                                    No step-by-step instructions available for this exercise yet.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Tips Section */}
                    <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <IconSymbol name="lightbulb.fill" size={18} color={theme.primary} />
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700' }}>
                                Training Tips
                            </Text>
                        </View>
                        {exercise.tips && exercise.tips.length > 0 ? (
                            <View style={{ gap: 10 }}>
                                {exercise.tips.map((tip: string, index: number) => (
                                    <View 
                                        key={index} 
                                        style={{ 
                                            flexDirection: 'row', 
                                            gap: 10, 
                                            backgroundColor: 'rgba(255,255,255,0.03)', 
                                            padding: 12, 
                                            borderRadius: 12,
                                            borderLeftWidth: 3,
                                            borderLeftColor: theme.primary
                                        }}
                                    >
                                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14, marginTop: 1 }}>
                                            {index + 1}
                                        </Text>
                                        <Text style={{ flex: 1, color: currentColors.text, opacity: 0.85, fontSize: 14, lineHeight: 20 }}>
                                            {tip}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={{ 
                                padding: 16, 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                borderRadius: 12, 
                                borderStyle: 'dashed', 
                                borderWidth: 1, 
                                borderColor: 'rgba(255,255,255,0.1)',
                                alignItems: 'center'
                            }}>
                                <Text style={{ color: currentColors.text, opacity: 0.5, fontSize: 14 }}>
                                    Focus on controlled execution and steady breathing.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {variations.length > 0 && (
                    <View style={{ display: activeTab === 'variations' ? 'flex' : 'none' }}>

                        {/* Attachment Filter Capsules */}
                        {uniqueAttachments.length > 1 && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ color: currentColors.text, fontSize: 14, fontWeight: '600', marginBottom: 8, opacity: 0.8 }}>
                                    Attachment
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {uniqueAttachments.map((att) => {
                                        const isSelected = selectedAttachment === att;
                                        return (
                                            <Pressable
                                                key={att}
                                                onPress={() => setSelectedAttachment(att)}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    backgroundColor: isSelected ? theme.primary : (theme.bgLight || 'rgba(255,255,255,0.05)'),
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? theme.primary : 'rgba(255,255,255,0.1)',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{
                                                    color: isSelected ? '#FFFFFF' : currentColors.text,
                                                    fontWeight: isSelected ? '600' : '400',
                                                    fontSize: 13,
                                                }}>
                                                    {att}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}


                        {filteredVariations.length === 0 ? (
                            <View style={{ 
                                padding: 32, 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                borderRadius: 16, 
                                borderStyle: 'dashed', 
                                borderWidth: 1, 
                                borderColor: 'rgba(255,255,255,0.1)',
                                alignItems: 'center' 
                            }}>
                                <Text style={{ color: currentColors.text, opacity: 0.5, fontSize: 14, textAlign: 'center' }}>
                                    No variations match the selected movement and attachment filters.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={{ padding: 16, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, marginBottom: 16 }}>
                                    <Text style={{ color: currentColors.text, opacity: 0.8, fontSize: 13, textAlign: 'center' }}>
                                        Tap a variation to view its details and manage goals.
                                    </Text>
                                </View>
                                <VariationTree 
                                    exercises={filteredVariations} 
                                    onSelect={handleSelectVariation}
                                    activeId={exercise.id}
                                />
                            </>
                        )}
                    </View>
                )}

                {/* Spacer to ensure content is fully scrollable above floating elements */}
                <View style={{ height: 160 }} />
            </ScrollView>

            {isSelectMode && (
                <View 
                    className="absolute self-center shadow-lg"
                    style={{ bottom: insets.bottom + 20, width: 'auto', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 999 }}
                >
                    <RaisedCard
                        onPress={() => {
                            if (onSelect) {
                                let res = { ...exercise };
                                if (selectedAttachmentVal) res.attachment = selectedAttachmentVal;
                                if (selectedEquipmentVal) res.equipment = selectedEquipmentVal;
                                onSelect(res);
                            }
                        }}
                        className="items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                        style={{ borderRadius: 9999 }}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-lg font-bold text-white">
                                Select {exercise.name}
                            </Text>
                        </View>
                    </RaisedCard>
                </View>
            )}

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
                            position: 'relative',
                        }}>
                            <Pressable 
                                onPress={() => setSelectedVariation(null)} 
                                style={{
                                    position: 'absolute',
                                    top: 16,
                                    left: 16,
                                    padding: 8,
                                    borderRadius: 9999,
                                    zIndex: 10,
                                }}
                            >
                                {({ pressed }) => (
                                    <IconSymbol name="xmark" size={20} color={currentColors.text} style={{ opacity: pressed ? 0.6 : 1 }} />
                                )}
                            </Pressable>

                            <Pressable 
                                onPress={() => handleViewVariationDetails(selectedVariation)} 
                                style={{
                                    position: 'absolute',
                                    top: 24,
                                    right: 20,
                                    zIndex: 10,
                                }}
                            >
                                {({ pressed }) => (
                                    <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600', opacity: pressed ? 0.6 : 1 }}>
                                        View Full Details
                                    </Text>
                                )}
                            </Pressable>

                            <View style={{ height: 28 }} />

                            <Text style={{ color: currentColors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                                {selectedVariation.name}
                            </Text>

                            {selectedVariation.difficulty !== undefined && selectedVariation.properties?.includes('Bodyweight') && (() => {
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

                            {(selectedVariation.equipment || selectedVariation.movementType || selectedVariation.angle || selectedVariation.attachment) ? (
                                <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    {selectedVariation.equipment && selectedVariation.equipment !== 'none' && (
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 5,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.12)'
                                        }}>
                                            <Text style={{ color: currentColors.text, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                                                {selectedVariation.equipment}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedVariation.angle && (
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 5,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.12)'
                                        }}>
                                            <Text style={{ color: currentColors.text, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                                                {selectedVariation.angle}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedVariation.attachment && (
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 5,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.12)'
                                        }}>
                                            <Text style={{ color: currentColors.text, fontSize: 12, fontWeight: '500' }}>
                                                {selectedVariation.attachment}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedVariation.movementType && (
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 5,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.12)'
                                        }}>
                                            <Text style={{ color: currentColors.text, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                                                {selectedVariation.movementType}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : null}

                            {selectedVariation.description ? (
                                <Text style={{ color: currentColors.text, fontSize: 15, opacity: 0.8, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                                    {selectedVariation.description}
                                </Text>
                            ) : (
                                <View style={{ height: 8 }} />
                            )}



                            {isSelectMode && (
                                <View style={{ alignItems: 'center', width: '100%' }}>
                                    <RaisedCard
                                        onPress={() => {
                                            if (onSelect) {
                                                onSelect(selectedVariation);
                                            }
                                        }}
                                        className="items-center justify-center py-3 px-6 rounded-full bg-primary dark:bg-primary-dark border-0"
                                        style={{ borderRadius: 9999, minWidth: 200 }}
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Text className="text-lg font-bold text-white">
                                                Select {selectedVariation.name}
                                            </Text>
                                        </View>
                                    </RaisedCard>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
}
