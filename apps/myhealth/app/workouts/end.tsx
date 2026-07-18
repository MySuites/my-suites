import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import type MapView from 'react-native-maps';
import { storage } from '../../utils/storage';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { useActiveWorkout, useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { WorkoutNamePrompt } from '../../components/workouts/WorkoutNamePrompt';
import { RouteSnapshotMap } from '../../components/workouts/RouteSnapshotMap';
import { WorkoutLocationTrackingService, TrackedRoutePoint } from '../../services/WorkoutLocationTrackingService';
import { isOutdoorGpsExercise } from '../../utils/workout-logic';
import { formatStopwatch, formatPace } from '../../utils/formatting';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';

async function autoSaveToPhotos(uris: string[]) {
    try {
        const autoSave = await storage.getItem<boolean>('auto_save_photos_to_gallery');
        if (!autoSave || uris.length === 0) return;

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            return;
        }

        for (const uri of uris) {
            await MediaLibrary.saveToLibraryAsync(uri);
        }
    } catch (error) {
        console.error("Auto-save photos failed:", error);
    }
}

async function persistProgressPictures(uris: string[]): Promise<string[]> {
    const persistedUris: string[] = [];
    const directory = `${FileSystem.documentDirectory}progress_pictures/`;

    try {
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }

        for (const uri of uris) {
            if (uri.startsWith(FileSystem.documentDirectory || '')) {
                persistedUris.push(uri);
                continue;
            }

            const filename = uri.split('/').pop() || `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const destPath = `${directory}${filename}`;
            await FileSystem.copyAsync({
                from: uri,
                to: destPath
            });
            persistedUris.push(destPath);
        }
    } catch (error) {
        console.error("Failed to copy images to document directory:", error);
        return uris;
    }
    return persistedUris;
}

export default function EndWorkoutScreen() {
    const router = useRouter();
    const theme = useUITheme();
    const { unitSystem } = useUnitPreference();
    const { showToast } = useToast();
    const { 
        workoutName,
        exercises,
        finishWorkout,
        cancelWorkout,
        sourceWorkoutId,
        routineId 
    } = useActiveWorkout();
    
    const { workoutSeconds } = useActiveWorkoutTimer();
    
    const { savedWorkouts, updateSavedWorkout, saveWorkout } = useWorkoutManager();
    const [isSaving, setIsSaving] = React.useState(false);
    const [showNamePrompt, setShowNamePrompt] = React.useState(false);
    const [pendingName, setPendingName] = React.useState("");

    const completedSetsCount = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
    const filteredExercises = exercises.filter(ex => (ex.completedSets || 0) > 0);
    const totalExercises = filteredExercises.length;

    const [notes, setNotes] = React.useState("");
    const [imageUris, setImageUris] = React.useState<string[]>([]);

    // The GPS buffer is still live at this point (finishWorkout/stopTracking
    // hasn't run yet — that happens on Save), so read it directly for the
    // route thumbnail next to any outdoor exercise below.
    const [routePoints, setRoutePoints] = React.useState<TrackedRoutePoint[]>([]);
    React.useEffect(() => {
        WorkoutLocationTrackingService.getLiveRoute().then(setRoutePoints);
    }, []);
    const [showFullRoute, setShowFullRoute] = React.useState(false);
    const [isExportingRoute, setIsExportingRoute] = React.useState(false);
    const fullRouteMapRef = React.useRef<MapView>(null);

    const handleExportRoute = async () => {
        if (isExportingRoute) return;
        setIsExportingRoute(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Photos access is required to save the route image.");
                return;
            }
            const uri = await fullRouteMapRef.current?.takeSnapshot({ format: 'png', result: 'file' });
            if (!uri) throw new Error("Snapshot failed");
            await MediaLibrary.saveToLibraryAsync(uri);
            showToast({ message: "Route saved to Photos", type: 'success' });
        } catch (error) {
            console.error("Failed to export route image:", error);
            Alert.alert("Error", "Could not save the route image.");
        } finally {
            setIsExportingRoute(false);
        }
    };

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Camera access is required to take a progress picture.");
            return;
        }
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUris(prev => [result.assets[0].uri, ...prev]);
            }
        } catch (error) {
            console.error("Failed to launch camera:", error);
            Alert.alert(
                "Camera Unavailable",
                "The camera is not available on this device (e.g. iOS Simulator). Would you like to select a photo from your library instead?",
                [
                    { text: "Choose from Library", onPress: handleChooseFromLibrary },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    const handleChooseFromLibrary = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsMultipleSelection: true,
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newUris = result.assets.map(asset => asset.uri);
                setImageUris(prev => [...newUris, ...prev]);
            }
        } catch (error) {
            console.error("Failed to launch image library:", error);
            Alert.alert("Error", "Could not open the photo library.");
        }
    };

    const handlePickImage = async () => {
        Alert.alert(
            "Progress Picture",
            "How would you like to add a progress picture?",
            [
                { text: "Take Photo", onPress: handleTakePhoto },
                { text: "Choose from Library", onPress: handleChooseFromLibrary },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const ChangeType = {
        NONE: 'NONE',
        VALUE: 'VALUE',
        STRUCTURE: 'STRUCTURE'
    };
    
    const getWorkoutChangeType = (currentArr: any[], originalArr: any[]) => {
        if (currentArr.length !== originalArr.length) return ChangeType.STRUCTURE;
        
        let hasValueChange = false;
        
        for (let i = 0; i < currentArr.length; i++) {
            const cur = currentArr[i];
            const orig = originalArr[i];
            
            // Structure check: Name, Set count, and Properties
            if (cur.name !== orig.name) return ChangeType.STRUCTURE;
            if (Number(cur.sets) !== Number(orig.sets)) return ChangeType.STRUCTURE;
            
            const p1 = cur.properties || [];
            const p2 = orig.properties || [];
            if (p1.length !== p2.length) return ChangeType.STRUCTURE;
            for (let k = 0; k < p1.length; k++) {
                if (p1[k] !== p2[k]) return ChangeType.STRUCTURE;
            }
            
            // Value check (set targets)
            const t1 = cur.setTargets || [];
            const t2 = orig.setTargets || [];
            
            for (let j = 0; j < Math.max(t1.length, t2.length); j++) {
                const v1 = t1[j] || {};
                const v2 = t2[j] || {};
                const repsMatch = Number(v1.reps || 0) === Number(v2.reps || 0);
                const weightMatch = Number(v1.weight || 0) === Number(v2.weight || 0);
                const durMatch = Number(v1.duration || 0) === Number(v2.duration || 0);
                const distMatch = Number(v1.distance || 0) === Number(v2.distance || 0);
                
                if (!repsMatch || !weightMatch || !durMatch || !distMatch) {
                    hasValueChange = true;
                }
            }
        }
        return hasValueChange ? ChangeType.VALUE : ChangeType.NONE;
    };

    const handleSave = async () => {
        if (isSaving) return;

        if (completedSetsCount === 0) {
            Alert.alert(
                "No Sets Completed",
                "You must complete at least one set to save this workout.",
                [{ text: "OK" }]
            );
            return;
        }

        const finalize = async () => {
            setIsSaving(true);
            try {
                const persisted = await persistProgressPictures(imageUris);
                autoSaveToPhotos(persisted);
                finishWorkout(notes, persisted[0] || undefined, persisted);
                router.dismiss();
            } catch (error) {
                console.error("Failed to persist photos:", error);
                finishWorkout(notes, imageUris[0] || undefined, imageUris);
                router.dismiss();
            } finally {
                setIsSaving(false);
            }
        };

        // Paths are now mutually exclusive to prevent double-prompts
        if (sourceWorkoutId) {
            const original = savedWorkouts.find((w: any) => w.id === sourceWorkoutId);
            if (original) {
                const changeType = getWorkoutChangeType(exercises, original.exercises);
                
                if (changeType === ChangeType.STRUCTURE) {
                    Alert.alert(
                        "Update Template?",
                        "You've made structural changes to this workout. Do you want to update the saved template?",
                        [
                            {
                                text: "No, History Only",
                                onPress: finalize
                            },
                            {
                                text: "Update Values Only",
                                onPress: async () => {
                                    setIsSaving(true);
                                    try {
                                        await updateSavedWorkout(
                                            sourceWorkoutId, 
                                            original.name, 
                                            exercises, 
                                            finalize,
                                            true
                                        );
                                    } catch (e) {
                                        console.error("Failed to update values in template", e);
                                        finalize();
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            },
                            {
                                text: "Yes, Update Template",
                                onPress: async () => {
                                    setIsSaving(true);
                                    try {
                                        await updateSavedWorkout(
                                            sourceWorkoutId, 
                                            original.name, 
                                            exercises, 
                                            finalize
                                        );
                                    } catch (e) {
                                        console.error("Failed to update template", e);
                                        finalize();
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            },
                            {
                                text: "Cancel",
                                style: "cancel"
                            }
                        ]
                    );
                    return;
                } else if (changeType === ChangeType.VALUE) {
                    // Auto-update values in background
                    setIsSaving(true);
                    try {
                        await updateSavedWorkout(
                            sourceWorkoutId, 
                            original.name, 
                            exercises, 
                            finalize
                        );
                        return; // finalize is called by updateSavedWorkout
                    } catch (e) {
                        console.error("Failed to auto-update template", e);
                        finalize();
                    } finally {
                        setIsSaving(false);
                    }
                    return;
                }
            }
            
            finalize();
            return;
        } 
        
        // Only prompt for NEW template if there was no SOURCE template and it's not a routine
        if (totalExercises > 0 && !routineId) {
            Alert.alert(
                "Save as Template?",
                "Would you like to save this workout as a template for future use?",
                [
                    {
                        text: "History Only",
                        onPress: finalize
                    },
                    {
                        text: "Save as Template",
                        onPress: () => {
                            setPendingName(workoutName || "New Workout");
                            setShowNamePrompt(true);
                        }
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
            return;
        }

        // Catch-all for routines or empty workouts with no exercises
        finalize();
    };

    const handleDiscard = () => {
        Alert.alert(
            "Discard Workout?",
            "Are you sure you want to discard this workout? All progress will be lost.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Discard", 
                    style: "destructive", 
                    onPress: () => {
                        cancelWorkout();
                        router.dismiss();
                    }
                }
            ]
        );
    };

    const handlePromptSave = async (name: string) => {
        setShowNamePrompt(false);
        setIsSaving(true);
        try {
            // Strip logs and set counts to 0 for template
            const templateExercises = exercises.map(({ logs, previousLog, completedSets, ...rest }) => ({
                ...rest,
                completedSets: 0,
                logs: []
            }));
            
            await saveWorkout(
                name,
                templateExercises,
                () => {}
            );
            const persisted = await persistProgressPictures(imageUris);
            autoSaveToPhotos(persisted);
            finishWorkout(notes, persisted[0] || undefined, persisted);
            router.dismiss();
        } catch (e) {
            console.error("Failed to save new template", e);
            finishWorkout(notes, imageUris[0] || undefined, imageUris);
            router.dismiss();
        } finally {
            setIsSaving(false);
        }
    };

    const handlePromptCancel = () => {
        setShowNamePrompt(false);
        // Re-trigger the alert logic - we can just call handleSave again
        // wrapping it in setTimeout to ensure the modal is fully closed on some platforms
        setTimeout(() => {
            handleSave();
        }, 300);
    };

    // Helper to format time if utils generic doesn't exist
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader 
                title="Workout Summary" 
                leftAction={<BackButton />} 
                rightAction={
                    <RaisedCard
                        testID="save-workout-btn"
                        onPress={handleSave}
                        className="w-12 h-12 p-0 rounded-full items-center justify-center"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol name="checkmark" size={24} color={theme.primary} />
                    </RaisedCard>
                }
            />
            
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingTop: 124, paddingHorizontal: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <RaisedCard className="p-6 mb-6 items-center">
                    <Text className="text-2xl font-bold text-light dark:text-dark mb-4">{workoutName}</Text>
                    
                    <View className="flex-row justify-around w-full">
                        <View className="items-center">
                            <Text className="text-xl font-bold text-light dark:text-dark">
                                {formatDuration(workoutSeconds)}
                            </Text>
                            <Text className="text-gray-500 dark:text-gray-400">Duration</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-bold text-light dark:text-dark">{completedSetsCount}</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Sets</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-bold text-light dark:text-dark">{totalExercises}</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Exercises</Text>
                        </View>
                    </View>
                </RaisedCard>

                <RaisedCard className="p-4 mb-6">
                    <Text className="font-semibold text-light dark:text-dark mb-3 text-lg">Progress Pictures</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, alignItems: 'center' }}
                    >
                        <TouchableOpacity 
                            onPress={handlePickImage}
                            style={{ 
                                width: 100, 
                                height: 100, 
                                borderRadius: 12, 
                                borderStyle: 'dashed', 
                                borderWidth: 2, 
                                borderColor: theme.border || 'rgba(0,0,0,0.1)', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.02)'
                            }}
                            className="dark:bg-white/[0.02]"
                        >
                            <IconSymbol name="camera.fill" size={28} color={theme.primary} />
                            <Text className="text-xs font-semibold text-light dark:text-dark mt-1 text-center px-2">
                                Add Photo
                            </Text>
                        </TouchableOpacity>

                        {imageUris.map((uri, idx) => (
                            <View key={idx} style={{ position: 'relative', width: 100, height: 100, borderRadius: 12, overflow: 'hidden' }}>
                                <Image 
                                    source={{ uri }} 
                                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
                                />
                                <TouchableOpacity 
                                    onPress={() => setImageUris(prev => prev.filter((_, i) => i !== idx))}
                                    style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        width: 26,
                                        height: 26,
                                        borderRadius: 13,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <IconSymbol name="xmark" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </RaisedCard>

                <RaisedCard className="p-4 mb-6">
                    <Text className="font-semibold text-light dark:text-dark mb-2 text-lg">Notes</Text>
                    <TextInput 
                        className="text-light dark:text-dark min-h-[60px] p-2 border border-black/10 dark:border-white/10 rounded-lg"
                        multiline
                        placeholder="How did it feel?"
                        placeholderTextColor="#9CA3AF"
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                    />
                </RaisedCard>

                <RaisedCard className="p-4 mb-6">
                    <Text className="font-semibold text-light dark:text-dark mb-4 text-lg">Detailed Summary</Text>
                    {filteredExercises.map((ex, idx) => (
                        <View key={idx} className="flex-row items-center justify-between mb-2">
                             {isOutdoorGpsExercise(ex) && routePoints.length >= 2 && (
                                 <TouchableOpacity onPress={() => setShowFullRoute(true)} style={{ marginRight: 12 }}>
                                     <RouteSnapshotMap points={routePoints} size={56} />
                                 </TouchableOpacity>
                             )}
                             <Text className="text-light dark:text-dark flex-1">{ex.name}</Text>
                             {isOutdoorGpsExercise(ex) ? (() => {
                                 // Running/Biking are one continuous activity, not repeatable
                                 // sets — show elapsed time/pace/distance instead of a set count.
                                 const target = ex.setTargets?.[0] || {};
                                 const durationSecs = Number(target.duration) || 0;
                                 const distance = Number(target.distance) || 0;
                                 const unitLabel = unitSystem === 'imperial' ? 'mi' : 'km';
                                 return (
                                     <Text className="text-gray-500 dark:text-gray-400 text-right">
                                         {formatPace(durationSecs, distance, unitSystem)} · {formatStopwatch(durationSecs)} · {distance.toFixed(2)} {unitLabel}
                                     </Text>
                                 );
                             })() : (
                                 <Text className="text-gray-500 dark:text-gray-400">
                                    {ex.completedSets || 0} / {ex.sets} sets
                                 </Text>
                             )}
                        </View>
                    ))}
                </RaisedCard>
                <View className="gap-3 pb-40">
                    <TouchableOpacity 
                        onPress={handleDiscard}
                        className="bg-red-500/10 py-4 rounded-xl items-center border border-red-500/20"
                    >
                        <Text className="text-red-500 font-bold text-lg">Discard Workout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <WorkoutNamePrompt
                visible={showNamePrompt}
                onClose={handlePromptCancel}
                onSave={handlePromptSave}
                initialName={pendingName}
            />

            {/* Full-screen route viewer — opened by tapping the route thumbnail,
                same pattern as the progress-pictures detail view. */}
            {showFullRoute && (
                <View className="absolute inset-0 z-[110] bg-black justify-between">
                    <View className="flex-row justify-between items-center px-4 pt-16 pb-4 z-10">
                        <TouchableOpacity
                            onPress={() => setShowFullRoute(false)}
                            className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
                        >
                            <IconSymbol name="xmark" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-base">Route</Text>
                        <TouchableOpacity
                            onPress={handleExportRoute}
                            disabled={isExportingRoute}
                            className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
                        >
                            {isExportingRoute ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <IconSymbol name="square.and.arrow.down" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        <RouteSnapshotMap ref={fullRouteMapRef} points={routePoints} fill interactive />
                    </View>
                </View>
            )}
        </View>
    );
}
