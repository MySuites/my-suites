import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUITheme } from '@mysuite/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { DataRepository } from '../../providers/DataRepository';
import { Exercise } from '../../utils/workout-api/types';
import { VariationTree } from '../../components/exercises/VariationTree';

export default function VariationsScreen() {
    const theme = useUITheme();
    const { progressionId } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            if (!progressionId) {
                setLoading(false);
                return;
            }
            try {
                const all = await DataRepository.getExercises();
                if (!isMounted) return;
                const siblings = all.filter(e => e.progressionId === progressionId);
                setExercises(siblings);
            } catch (e) {
                console.error("Failed to load variations", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();
        return () => { isMounted = false; };
    }, [progressionId]);

    const [selectedVariation, setSelectedVariation] = useState<Exercise | null>(null);

    const handleSetActive = async (exercise: Exercise) => {
        const updated = exercises.map(e => ({
            ...e,
            isActiveProgression: e.id === exercise.id
        }));
        setExercises(updated);

        try {
            await DataRepository.saveExercises(updated);
            setSelectedVariation(null);
            // Optionally, we could show a toast here.
        } catch (e) {
            console.error("Failed to save progression", e);
            Alert.alert("Error", "Failed to update progression");
            // Revert on failure
            setExercises(exercises);
        }
    };

    const handleSelect = (exercise: Exercise) => {
         setSelectedVariation(exercise);
    };
    
    const handleViewDetails = (exercise: Exercise) => {
         setSelectedVariation(null);
         router.push({
            pathname: '/exercises/details' as any,
            params: { exercise: JSON.stringify(exercise) }
        });
    };

    const bgColors = {
        background: (theme.bgDark || theme.bg) as string,
        text: theme.text as string,
        primary: theme.primary as string,
        card: theme.bgLight as string,
    };

    return (
        <View style={{ flex: 1, backgroundColor: bgColors.background, paddingTop: Math.max(insets.top, 50) }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader 
                title="Variations" 
                leftAction={<BackButton />} 
            />
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={bgColors.primary} />
                </View>
            ) : exercises.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: bgColors.text }}>No variations found.</Text>
                </View>
            ) : (
                <>
                    <View 
                    className="mt-20"
                    style={{ padding: 16, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10 }}>
                        <Text style={{ color: bgColors.text, opacity: 0.8, fontSize: 13, textAlign: 'center' }}>
                            Tap a variation to view its details and manage goals.
                        </Text>
                    </View>
                    <VariationTree 
                        exercises={exercises} 
                        onSetActive={handleSetActive}
                        onSelect={handleSelect}
                    />

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
                                    backgroundColor: bgColors.card,
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
                                    <Text style={{ color: bgColors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                                        {selectedVariation.name}
                                    </Text>
                                    <Text style={{ color: bgColors.text, opacity: 0.7, fontSize: 16, marginBottom: 24, textTransform: 'capitalize', textAlign: 'center' }}>
                                        {selectedVariation.difficulty || 'Normal'} Difficulty
                                    </Text>

                                    <Pressable
                                        onPress={() => handleSetActive(selectedVariation)}
                                        style={({pressed}: {pressed: boolean}) => ({
                                            backgroundColor: bgColors.primary,
                                            padding: 16,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            marginBottom: 12,
                                            opacity: pressed ? 0.8 : 1
                                        })}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                            Set as Active Goal
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => handleViewDetails(selectedVariation)}
                                        style={({pressed}: {pressed: boolean}) => ({
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            padding: 16,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            opacity: pressed ? 0.8 : 1
                                        })}
                                    >
                                        <Text style={{ color: bgColors.text, fontSize: 16, fontWeight: '600' }}>
                                            View Full Details
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </Modal>
                </>
            )}
        </View>
    );
}
