import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
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
    const { progressionId, currentExerciseId } = useLocalSearchParams();
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

    const handleSetActive = async (exercise: Exercise) => {
        const updated = exercises.map(e => ({
            ...e,
            isActiveProgression: e.id === exercise.id
        }));
        setExercises(updated);

        try {
            await DataRepository.saveExercises(updated);
            // Optionally, we could show a toast here.
        } catch (e) {
            console.error("Failed to save progression", e);
            Alert.alert("Error", "Failed to update progression");
            // Revert on failure
            setExercises(exercises);
        }
    };

    const handleSelect = (exercise: Exercise) => {
         router.replace({
            pathname: '/exercises/details',
            params: { exercise: JSON.stringify(exercise) }
        });
    };

    const bgColors = {
        background: (theme.bgDark || theme.bg) as string,
        text: theme.text as string,
        primary: theme.primary as string,
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
                            Tap a variation to view details. Tap and hold to set as active goal.
                        </Text>
                    </View>
                    <VariationTree 
                        exercises={exercises} 
                        currentExerciseId={currentExerciseId as string}
                        onSetActive={handleSetActive}
                        onSelect={handleSelect}
                    />
                </>
            )}
        </View>
    );
}
