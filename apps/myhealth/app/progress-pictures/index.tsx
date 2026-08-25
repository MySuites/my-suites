import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
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
import {
    AnalysisStatus,
    analyzeMuscleGroupsInBackground,
    cancelAnalysis,
    getAnalysisStatus,
    subscribeAnalysisStatus,
} from '../../services/ai/analyzeProgressPicture';

const { width } = Dimensions.get('window');
const GAP = 10;
const COLUMN_WIDTH = (width - 32 - (GAP * 2)) / 3; // 3 column layout with padding

// Tracks which progress picture is currently mid-analysis and which are
// queued behind it, so the UI can show a spinner on the active one and a
// spinner+pause on queued ones - the underlying model only runs one at a time.
function useAnalysisStatus(): AnalysisStatus {
    const [status, setStatus] = useState<AnalysisStatus>(getAnalysisStatus());

    useEffect(() => {
        return subscribeAnalysisStatus(setStatus);
    }, []);

    return status;
}

export default function ProgressPicturesScreen() {
    const { user } = useAuth();
    const theme = useUITheme();
    const { showToast } = useToast();

    // State variables
    const [pictures, setPictures] = useState<ProgressPictureEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { activeId: activeAnalysisId, queuedIds } = useAnalysisStatus();

    // Muscle group filter - built from tags actually present on pictures,
    // not the full app-wide list, so there's never an empty-result filter chip.
    const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
    const availableMuscleFilters = useMemo(() => {
        const tags = new Set<string>();
        pictures.forEach((p) => {
            p.muscleGroups?.primaryMuscles?.forEach((m) => tags.add(m));
            p.muscleGroups?.secondaryMuscles?.forEach((m) => tags.add(m));
        });
        return Array.from(tags).sort();
    }, [pictures]);
    const filteredPictures = useMemo(() => {
        if (!muscleFilter) return pictures;
        return pictures.filter(
            (p) =>
                p.muscleGroups?.primaryMuscles?.includes(muscleFilter) ||
                p.muscleGroups?.secondaryMuscles?.includes(muscleFilter)
        );
    }, [pictures, muscleFilter]);

    // Clear the filter if its tag no longer exists (e.g. the only tagged
    // picture with it was deleted) rather than silently showing zero results.
    useEffect(() => {
        if (muscleFilter && !availableMuscleFilters.includes(muscleFilter)) {
            setMuscleFilter(null);
        }
    }, [muscleFilter, availableMuscleFilters]);

    // Detail State - tracked by id and derived from `pictures` below so it
    // picks up muscle-group updates live, instead of freezing a stale copy
    // from the moment the user tapped the thumbnail.
    const [selectedPictureId, setSelectedPictureId] = useState<string | null>(null);
    const selectedPicture = useMemo(
        () => pictures.find((p) => p.id === selectedPictureId) ?? null,
        [pictures, selectedPictureId]
    );

    // Multi-select state for bulk delete/analyze on the grid.
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    };

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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

    const handleBulkDelete = () => {
        const targets = pictures.filter((p) => selectedIds.has(p.id));
        if (targets.length === 0) return;

        Alert.alert(
            "Delete Pictures",
            `Are you sure you want to delete ${targets.length} progress picture(s) permanently?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            for (const item of targets) {
                                await ProgressPictureService.deleteProgressPicture(item.id, item.imageUri);
                            }
                            showToast({ message: `${targets.length} picture(s) deleted`, type: 'success' });
                            exitSelectMode();
                            loadPictures();
                        } catch (e) {
                            console.error('Failed to bulk delete pictures:', e);
                            showToast({ message: 'Failed to delete some pictures', type: 'error' });
                        }
                    }
                }
            ]
        );
    };

    const handleBulkAnalyze = () => {
        const targets = pictures.filter((p) => selectedIds.has(p.id));
        if (targets.length === 0) return;

        targets.forEach((item) => analyzeMuscleGroupsInBackground(item.id, item.imageUri));
        showToast({ message: `Queued ${targets.length} picture(s) for analysis`, type: 'success' });
        exitSelectMode();
    };

    const handlePicturePress = (item: ProgressPictureEntry) => {
        if (isSelectMode) {
            toggleSelected(item.id);
            return;
        }
        setSelectedPictureId(item.id);
    };

    const handlePictureLongPress = (item: ProgressPictureEntry) => {
        if (!isSelectMode) {
            setIsSelectMode(true);
            setSelectedIds(new Set([item.id]));
        }
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

    const renderPictureItem = useCallback(({ item }: { item: ProgressPictureEntry }) => {
        const isAnalyzing = activeAnalysisId === item.id;
        const isQueued = queuedIds.includes(item.id);
        const isSelected = selectedIds.has(item.id);
        return (
            <TouchableOpacity
                onPress={() => handlePicturePress(item)}
                onLongPress={() => handlePictureLongPress(item)}
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
                                <ActivityIndicator size="large" color="#fff" />
                                {isQueued && (
                                    <View
                                        className="absolute inset-0 flex-row items-center justify-center"
                                        pointerEvents="none"
                                        style={{ gap: 3 }}
                                    >
                                        {/* Two plain bars instead of the pause glyph - MaterialIcons'
                                            "pause" character isn't visually centered in its own box. */}
                                        <View style={{ width: 4, height: 14, borderRadius: 1, backgroundColor: '#fff' }} />
                                        <View style={{ width: 4, height: 14, borderRadius: 1, backgroundColor: '#fff' }} />
                                    </View>
                                )}
                            </View>
                        )}
                        {isSelectMode && (
                            <View
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: isSelected ? theme.primary : 'rgba(0,0,0,0.4)',
                                    borderWidth: isSelected ? 0 : 1.5,
                                    borderColor: '#fff',
                                }}
                                testID={`select-check-${item.id}`}
                            >
                                {isSelected && <IconSymbol name="checkmark" size={14} color="#fff" />}
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
    }, [activeAnalysisId, queuedIds, selectedIds, isSelectMode, theme]);

    const muscleFilterRow = availableMuscleFilters.length > 0 ? (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            testID="muscle-filter-row"
        >
            <TouchableOpacity
                onPress={() => setMuscleFilter(null)}
                className={`px-4 py-2 rounded-full border ${!muscleFilter ? 'bg-primary border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                testID="muscle-filter-all"
            >
                <Text className={`font-semibold text-sm ${!muscleFilter ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                    All
                </Text>
            </TouchableOpacity>
            {availableMuscleFilters.map((tag) => (
                <TouchableOpacity
                    key={tag}
                    onPress={() => setMuscleFilter(muscleFilter === tag ? null : tag)}
                    className={`px-4 py-2 rounded-full border ${muscleFilter === tag ? 'bg-primary border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                    testID={`muscle-filter-${tag}`}
                >
                    <Text className={`font-semibold text-sm ${muscleFilter === tag ? 'text-white' : 'text-light-muted dark:text-dark-muted'}`}>
                        {tag}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    ) : null;

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader
                title={isSelectMode ? `${selectedIds.size} selected` : "Progress Pictures"}
                leftAction={
                    isSelectMode ? (
                        <RaisedCard
                            onPress={exitSelectMode}
                            style={{ borderRadius: 9999 }}
                            className="w-12 h-12 p-0 items-center justify-center"
                            testID="cancel-select-btn"
                        >
                            <IconSymbol name="xmark" size={18} color={theme.primary} />
                        </RaisedCard>
                    ) : (
                        <BackButton />
                    )
                }
                rightAction={
                    isSelectMode ? (
                        <View className="flex-row" style={{ gap: 8 }}>
                            <RaisedCard
                                onPress={handleBulkAnalyze}
                                style={{ borderRadius: 9999, opacity: selectedIds.size === 0 ? 0.4 : 1 }}
                                className="w-12 h-12 p-0 items-center justify-center"
                                testID="bulk-analyze-btn"
                            >
                                <IconSymbol name="brain.head.profile" size={20} color={theme.primary} />
                            </RaisedCard>
                            <RaisedCard
                                onPress={handleBulkDelete}
                                style={{ borderRadius: 9999, opacity: selectedIds.size === 0 ? 0.4 : 1 }}
                                className="w-12 h-12 p-0 items-center justify-center"
                                testID="bulk-delete-btn"
                            >
                                <IconSymbol name="trash.fill" size={20} color={theme.danger} />
                            </RaisedCard>
                        </View>
                    ) : (
                        <RaisedCard
                            onPress={() => router.push('/progress-pictures/add' as any)}
                            style={{ borderRadius: 9999 }}
                            className="w-12 h-12 p-0 items-center justify-center"
                            testID="add-picture-header-btn"
                        >
                            <IconSymbol name="plus" size={24} color={theme.primary} />
                        </RaisedCard>
                    )
                }
            />

            {isLoading ? (
                <View className="flex-1 justify-center items-center" style={{ paddingTop: 140 }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : pictures.length === 0 ? (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingTop: 140, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
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
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredPictures}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPictureItem}
                    numColumns={3}
                    columnWrapperStyle={{ gap: GAP }}
                    contentContainerStyle={{ padding: 16, paddingTop: 140, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={9}
                    maxToRenderPerBatch={9}
                    windowSize={5}
                    removeClippedSubviews
                    ListHeaderComponent={muscleFilterRow}
                    ListEmptyComponent={
                        <HollowedCard className="p-10 mt-10 justify-center items-center" style={{ borderRadius: 20 }}>
                            <IconSymbol name="camera.fill" size={40} color={theme.textMuted} style={{ marginBottom: 12 }} />
                            <Text className="text-base font-bold text-center text-light dark:text-dark">
                                No pictures tagged &quot;{muscleFilter}&quot;
                            </Text>
                        </HollowedCard>
                    }
                />
            )}

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
