import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { useExerciseStats } from '../../hooks/workouts/useExerciseStats';
import { ExerciseChart } from '../../components/exercises/ExerciseChart';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import DefaultExercises from '../../assets/data/default-exercises';
import { DataRepository, inferMovementType } from '../../providers/DataRepository';
import { Exercise } from '../../utils/workout-api/types';
import { VariationTree } from '../../components/exercises/VariationTree';
import { VariationDetailModal } from '../../components/exercises/VariationDetailModal';
import { ExerciseAdvancedSection } from '../../components/exercises/ExerciseAdvancedSection';
import { InstructionsList } from '../../components/exercises/InstructionsList';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { BottomSheetOptionPicker } from '../../components/ui/BottomSheetOptionPicker';
import { ATTACHMENT_OPTIONS } from '../../components/workouts/AttachmentPicker';
import { MovementTypePicker } from '../../components/workouts/MovementTypePicker';
import { useLatestBodyWeight } from '../../hooks/workouts/useLatestBodyWeight';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { getBodyweightLoadPercentage, getEffectiveBodyweightLoad } from '../../utils/workout-logic';
import { lbToDisplay, roundForDisplay } from '../../utils/units';

interface ExerciseDetailsScreenProps {
    exercise?: Exercise;
    onBack?: () => void;
}

export default function ExerciseDetailsScreen({
    exercise: propExercise,
    onBack
}: ExerciseDetailsScreenProps = {}) {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();
    const { user } = useAuth();
    const { deleteCustomExercise } = useWorkoutManager();
    
    const [freshExercise, setFreshExercise] = useState<Exercise | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'performance' | 'variations'>('performance');
    const [variations, setVariations] = useState<Exercise[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<Exercise | null>(null);
    const [selectedAttachment, setSelectedAttachment] = useState<string>('All');
    const [selectedAttachmentVal, setSelectedAttachmentVal] = useState<string>('');
    const [selectedEquipmentVal, setSelectedEquipmentVal] = useState<string>('');
    const [selectedMovementTypeVal, setSelectedMovementTypeVal] = useState<string>('');
    const [isAttachmentPickerVisible, setIsAttachmentPickerVisible] = useState(false);
    const [isEquipmentPickerVisible, setIsEquipmentPickerVisible] = useState(false);
    const [isMovementTypePickerVisible, setIsMovementTypePickerVisible] = useState(false);

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
        if (exercise) {
            setSelectedMovementTypeVal(
                exercise.movementType || inferMovementType(exercise.name, exercise.equipment as any)
            );
        }
    }, [exercise?.id, exercise?.attachment, exercise?.equipment, exercise?.movementType]);

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

    const tabOptions = useMemo(() => {
        const options: { label: string; value: 'details' | 'performance' | 'variations' }[] = [
            { label: 'Details', value: 'details' },
            { label: 'Performance', value: 'performance' },
        ];
        if (variations.length > 0) {
            options.push({ label: 'Variations', value: 'variations' });
        }
        return options;
    }, [variations.length]);

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

    const { weight: latestBodyWeightLb } = useLatestBodyWeight();
    const { unitSystem, weightUnit } = useUnitPreference();

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

    // Bodyweight load estimate - only meaningful for exercises tagged
    // Bodyweight, and only known once the user has logged a body weight.
    const isBodyweightExercise = (exercise.properties || []).includes('Bodyweight');
    const bodyweightLoadPercentage = getBodyweightLoadPercentage(exercise);
    const effectiveLoadLb = getEffectiveBodyweightLoad(exercise, latestBodyWeightLb);
    const effectiveLoadDisplay = effectiveLoadLb != null
        ? roundForDisplay(lbToDisplay(effectiveLoadLb, unitSystem), unitSystem)
        : null;

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
                <SegmentedControl
                    options={tabOptions}
                    value={activeTab}
                    onChange={setActiveTab}
                    containerClassName="mb-6"
                />

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
                                            backgroundColor: theme.bgLight, 
                                            paddingHorizontal: 12, 
                                            paddingVertical: 6, 
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: theme.border
                                        }}>
                                            <Text style={{ fontSize: 13, color: currentColors.text }}>{String(prop)}</Text>
                                        </View>
                                    ))}
                                    {exercise?.angle && (
                                         <View style={{ 
                                             backgroundColor: theme.bgLight, 
                                             paddingHorizontal: 12, 
                                             paddingVertical: 6, 
                                             borderRadius: 16,
                                             borderWidth: 1,
                                             borderColor: theme.border
                                         }}>
                                             <Text style={{ fontSize: 13, color: currentColors.text, textTransform: 'capitalize' }}>{String(exercise.angle)}</Text>
                                         </View>
                                    )}
                                    {selectedAttachmentVal && (
                                         <View style={{ 
                                             backgroundColor: theme.bgLight, 
                                             paddingHorizontal: 12, 
                                             paddingVertical: 6, 
                                             borderRadius: 16,
                                             borderWidth: 1,
                                             borderColor: theme.border
                                         }}>
                                             <Text style={{ fontSize: 13, color: currentColors.text }}>{selectedAttachmentVal}</Text>
                                         </View>
                                    )}
                                    {selectedEquipmentVal && selectedEquipmentVal !== 'none' && (
                                         <View style={{ 
                                             backgroundColor: theme.bgLight, 
                                             paddingHorizontal: 12, 
                                             paddingVertical: 6, 
                                             borderRadius: 16,
                                             borderWidth: 1,
                                             borderColor: theme.border
                                         }}>
                                             <Text style={{ fontSize: 13, color: currentColors.text, textTransform: 'capitalize' }}>{selectedEquipmentVal}</Text>
                                         </View>
                                    )}
                                    {selectedMovementTypeVal && (
                                         <View style={{
                                              backgroundColor: theme.bgLight,
                                              paddingHorizontal: 12,
                                              paddingVertical: 6,
                                              borderRadius: 16,
                                              borderWidth: 1,
                                              borderColor: theme.border
                                          }}>
                                              <Text style={{ fontSize: 13, color: currentColors.text, textTransform: 'capitalize' }}>{selectedMovementTypeVal}</Text>
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
                    {exercise && exercise.id in ATTACHMENT_OPTIONS && (
                        <Pressable
                            onPress={() => setIsAttachmentPickerVisible(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: theme.bgLight,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700' }}>
                                Select Attachment
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: currentColors.text, opacity: 0.7, fontSize: 14 }}>
                                    {selectedAttachmentVal || 'Choose'}
                                </Text>
                                <IconSymbol name="chevron.right" size={14} color={currentColors.text} />
                            </View>
                        </Pressable>
                    )}

                    {/* Equipment Selection Section */}
                    {exercise && Array.isArray(exercise.equipment) && exercise.equipment.length > 1 && (
                        <Pressable
                            onPress={() => setIsEquipmentPickerVisible(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: theme.bgLight,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700' }}>
                                Select Equipment
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: currentColors.text, opacity: 0.7, fontSize: 14, textTransform: 'capitalize' }}>
                                    {selectedEquipmentVal || 'Choose'}
                                </Text>
                                <IconSymbol name="chevron.right" size={14} color={currentColors.text} />
                            </View>
                        </Pressable>
                    )}

                    {/* Movement Type Selection Section */}
                    {exercise && (
                        <Pressable
                            onPress={() => setIsMovementTypePickerVisible(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: theme.bgLight,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Text style={{ color: currentColors.text, fontSize: 16, fontWeight: '700' }}>
                                Select Movement Type
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ color: currentColors.text, opacity: 0.7, fontSize: 14, textTransform: 'capitalize' }}>
                                    {selectedMovementTypeVal || 'Choose'}
                                </Text>
                                <IconSymbol name="chevron.right" size={14} color={currentColors.text} />
                            </View>
                        </Pressable>
                    )}

                    {exercise && exercise.id in ATTACHMENT_OPTIONS && (
                        <BottomSheetOptionPicker
                            visible={isAttachmentPickerVisible}
                            onClose={() => setIsAttachmentPickerVisible(false)}
                            title="Select Attachment"
                            options={ATTACHMENT_OPTIONS[exercise.id].map((att) => ({ value: att, label: att }))}
                            selectedValue={selectedAttachmentVal}
                            onSelect={setSelectedAttachmentVal}
                        />
                    )}

                    {exercise && Array.isArray(exercise.equipment) && exercise.equipment.length > 1 && (
                        <BottomSheetOptionPicker
                            visible={isEquipmentPickerVisible}
                            onClose={() => setIsEquipmentPickerVisible(false)}
                            title="Select Equipment"
                            options={exercise.equipment.map((eqName: string) => ({
                                value: eqName,
                                label: eqName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                            }))}
                            selectedValue={selectedEquipmentVal}
                            onSelect={setSelectedEquipmentVal}
                        />
                    )}

                    {exercise && (
                        <MovementTypePicker
                            visible={isMovementTypePickerVisible}
                            currentMovementType={selectedMovementTypeVal}
                            onClose={() => setIsMovementTypePickerVisible(false)}
                            onSelect={setSelectedMovementTypeVal}
                        />
                    )}

                    <Text style={{ color: currentColors.text, opacity: 0.7, lineHeight: 24, fontSize: 15, marginBottom: 24 }}>
                        {exercise.description || "No description available for this exercise yet."}
                    </Text>

                    <InstructionsList instructions={exercise.instructions} />

                    {isBodyweightExercise && (
                        <ExerciseAdvancedSection
                            isBodyweightExercise={isBodyweightExercise}
                            bodyweightLoadPercentage={bodyweightLoadPercentage}
                            effectiveLoadDisplay={effectiveLoadDisplay}
                            weightUnit={weightUnit}
                        />
                    )}
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
                                                    backgroundColor: isSelected ? theme.primary : theme.bgLight,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? theme.primary : theme.border,
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
                                backgroundColor: theme.bgLight, 
                                borderRadius: 16, 
                                borderStyle: 'dashed', 
                                borderWidth: 1, 
                                borderColor: theme.border,
                                alignItems: 'center' 
                            }}>
                                <Text style={{ color: currentColors.text, opacity: 0.5, fontSize: 14, textAlign: 'center' }}>
                                    No variations match the selected movement and attachment filters.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={{ padding: 16, backgroundColor: theme.bgLight, borderRadius: 12, marginBottom: 16 }}>
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

            <VariationDetailModal
                variation={selectedVariation}
                onClose={() => setSelectedVariation(null)}
                onViewFullDetails={handleViewVariationDetails}
            />
        </View>
    );
}
