import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Alert,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@mysuite/auth';
import { RaisedCard, HollowedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { ProgressPictureService, ProgressPictureEntry } from '../../services/ProgressPictureService';
import { analyzeMuscleGroupsInBackground, cancelAnalysis } from '../../services/ai/analyzeProgressPicture';
import { useAnalysisStatus } from '../../hooks/ai/useActiveAnalysis';

const { width } = Dimensions.get('window');
const GAP = 10;
const COLUMN_WIDTH = (width - 32 - (GAP * 2)) / 3; // 3 column layout with padding

export default function ProgressPicturesScreen() {
    const { user } = useAuth();
    const theme = useUITheme();
    const { showToast } = useToast();

    // State variables
    const [pictures, setPictures] = useState<ProgressPictureEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { activeId: activeAnalysisId, queuedIds } = useAnalysisStatus();

    // Detail State - tracked by id and derived from `pictures` below so it
    // picks up muscle-group updates live, instead of freezing a stale copy
    // from the moment the user tapped the thumbnail.
    const [selectedPictureId, setSelectedPictureId] = useState<string | null>(null);
    const selectedPicture = useMemo(
        () => pictures.find((p) => p.id === selectedPictureId) ?? null,
        [pictures, selectedPictureId]
    );

    // Load pictures
    const loadPictures = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        try {
            const data = await ProgressPictureService.getProgressPictures(user?.id || null);
            setPictures(data);
        } catch (e) {
            console.error('Failed to load progress pictures:', e);
            showToast({ message: 'Failed to load progress pictures', type: 'error' });
        } finally {
            if (showSpinner) setIsLoading(false);
        }
    }, [user, showToast]);

    // Re-loads on mount and on focus, so muscle-group labels appear once
    // background analysis finishes after returning from the add screen.
    useFocusEffect(
        useCallback(() => {
            loadPictures();
        }, [loadPictures])
    );

    // While any picture is still awaiting analysis, poll quietly (no spinner)
    // so labels appear without needing to leave and return to this screen.
    const hasPendingAnalysis = pictures.some((p) => !p.muscleGroups);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (hasPendingAnalysis) {
            pollingRef.current = setInterval(() => loadPictures(false), 5000);
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [hasPendingAnalysis, loadPictures]);


    // Delete Picture
    const handleDeletePicture = async (item: ProgressPictureEntry) => {
        Alert.alert(
            "Delete Picture",
            "Are you sure you want to delete this progress picture permanently?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await ProgressPictureService.deleteProgressPicture(item.id, item.imageUri);
                            showToast({ message: 'Picture deleted', type: 'success' });
                            setSelectedPictureId(null);
                            loadPictures();
                        } catch (e) {
                            console.error('Failed to delete picture:', e);
                            showToast({ message: 'Failed to delete picture', type: 'error' });
                        }
                    }
                }
            ]
        );
    };

    const handleAnalyze = (item: ProgressPictureEntry) => {
        analyzeMuscleGroupsInBackground(item.id, item.imageUri);
    };

    const handleStopAnalysis = (item: ProgressPictureEntry) => {
        const stopped = cancelAnalysis(item.id);
        if (!stopped) {
            showToast({ message: 'Still queued, nothing to stop yet', type: 'error' });
        }
    };

    const handlePicturePress = (item: ProgressPictureEntry) => {
        setSelectedPictureId(item.id);
    };

    // Muscle groups can be: undefined/null and never queued (truly untouched),
    // undefined/null but actively running/queued, an error result (ran but
    // failed), an empty result (ran, found nothing), or a populated result -
    // each needs distinct copy so nothing looks stuck or implies activity
    // that isn't actually happening.
    const formatMuscleGroups = (item: ProgressPictureEntry) => {
        if (activeAnalysisId === item.id) return 'Analyzing…';
        if (queuedIds.includes(item.id)) return 'Queued…';
        const muscleGroups = item.muscleGroups;
        if (!muscleGroups) return 'Not analyzed yet';
        if (muscleGroups.error) return 'Muscle group analysis unavailable';
        const all = [...muscleGroups.primaryMuscles, ...muscleGroups.secondaryMuscles];
        return all.length > 0 ? all.join(', ') : 'No muscle groups detected';
    };

    // Format Date Helper
    const formatDate = (dateStr: string) => {
        try {
            const [y, m, d] = dateStr.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader 
                title="Progress Pictures" 
                leftAction={<BackButton />}
                rightAction={
                    <RaisedCard 
                        onPress={() => router.push('/progress-pictures/add' as any)}
                        style={{ borderRadius: 9999 }}
                        className="w-12 h-12 p-0 items-center justify-center"
                        testID="add-picture-header-btn"
                    >
                        <IconSymbol name="plus" size={24} color={theme.primary} />
                    </RaisedCard>
                }
            />

            <ScrollView 
                contentContainerStyle={{ padding: 16, paddingTop: 140, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <View className="py-20 justify-center items-center">
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : pictures.length === 0 ? (
                    <HollowedCard className="p-10 mt-10 justify-center items-center" style={{ borderRadius: 20 }}>
                        <IconSymbol name="camera.fill" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
                        <Text className="text-lg font-bold text-center text-light dark:text-dark mb-2">No Pictures Yet</Text>
                        <Text className="text-sm text-center text-light-muted dark:text-dark-muted mb-6">
                            Take progress photos regularly to visualise your body transformation and track muscle gain.
                        </Text>
                        <RaisedCard 
                            onPress={() => router.push('/progress-pictures/add' as any)} 
                            className="bg-primary py-3 px-6 rounded-full"
                        >
                            <Text className="text-white font-bold text-base">Add First Picture</Text>
                        </RaisedCard>
                    </HollowedCard>
                ) : (
                    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
                        {pictures.map((item) => {
                            const isAnalyzing = activeAnalysisId === item.id;
                            const isQueued = queuedIds.includes(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handlePicturePress(item)}
                                    activeOpacity={0.8}
                                    style={{ width: COLUMN_WIDTH, marginBottom: 12 }}
                                    testID={`pic-card-${item.id}`}
                                >
                                    <RaisedCard className="p-0 overflow-hidden" style={{ borderRadius: 12 }}>
                                        <View>
                                            <Image
                                                source={{ uri: item.imageUri }}
                                                style={{ width: '100%', height: COLUMN_WIDTH }}
                                                contentFit="cover"
                                                transition={200}
                                            />
                                            {(isAnalyzing || isQueued) && (
                                                <View
                                                    className="absolute inset-0 items-center justify-center bg-black/40"
                                                    testID={isAnalyzing ? `analyzing-badge-${item.id}` : `queued-badge-${item.id}`}
                                                >
                                                    <ActivityIndicator size="small" color="#fff" />
                                                    {isQueued && (
                                                        <View style={{ position: 'absolute' }}>
                                                            <IconSymbol name="pause.fill" size={14} color="#fff" />
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                        <View className="p-2">
                                            <Text className="font-bold text-[9px] text-light dark:text-dark">{formatDate(item.date)}</Text>
                                            {item.notes ? (
                                                <Text className="text-[8px] text-light-muted dark:text-dark-muted mt-0.5" numberOfLines={1}>
                                                    {item.notes}
                                                </Text>
                                            ) : null}
                                            {item.muscleGroups?.primaryMuscles?.length ? (
                                                <Text className="text-[8px] mt-0.5" numberOfLines={1} style={{ color: theme.primary }}>
                                                    {item.muscleGroups.primaryMuscles.join(', ')}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </RaisedCard>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* DETAIL VIEW MODAL */}
            {selectedPicture && (
                <View className="absolute inset-0 z-[110] bg-black justify-between">
                    <View className="flex-row justify-between items-center px-4 pt-16 pb-4 z-10">
                        <TouchableOpacity 
                            onPress={() => setSelectedPictureId(null)}
                            className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
                        >
                            <IconSymbol name="xmark" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-base">
                            {selectedPicture ? formatDate(selectedPicture.date) : ""}
                        </Text>
                        <TouchableOpacity 
                            onPress={() => selectedPicture && handleDeletePicture(selectedPicture)}
                            className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
                            testID="delete-picture-btn"
                        >
                            <IconSymbol name="trash.fill" size={18} color="#ff3b30" />
                        </TouchableOpacity>
                    </View>

                    {selectedPicture && (
                        <Image 
                            source={{ uri: selectedPicture.imageUri }} 
                            style={{ width: '100%', height: '70%' }}
                            contentFit="contain"
                        />
                    )}

                    <View className="px-6 pb-16 pt-4 bg-black/80">
                        <Text className="text-white/60 text-xs mb-1">MUSCLE GROUPS</Text>
                        <Text className="text-white text-base mb-2">
                            {selectedPicture ? formatMuscleGroups(selectedPicture) : ''}
                        </Text>
                        {selectedPicture && (
                            <TouchableOpacity
                                onPress={() =>
                                    activeAnalysisId === selectedPicture.id
                                        ? handleStopAnalysis(selectedPicture)
                                        : handleAnalyze(selectedPicture)
                                }
                                className="self-start bg-white/10 px-4 py-2 rounded-full mb-3"
                                testID="analyze-picture-btn"
                            >
                                <Text className="text-white text-sm font-semibold">
                                    {activeAnalysisId === selectedPicture.id
                                        ? 'Stop Analysis'
                                        : selectedPicture.muscleGroups
                                            ? 'Re-analyze'
                                            : 'Analyze Now'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <Text className="text-white/60 text-xs mb-1">NOTES</Text>
                        <Text className="text-white text-base">
                            {selectedPicture?.notes || "No notes added to this progress photo."}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}
