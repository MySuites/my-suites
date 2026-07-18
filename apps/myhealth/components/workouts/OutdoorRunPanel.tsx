import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LiveWorkoutMap } from './LiveWorkoutMap';
import { formatStopwatch, formatPace } from '../../utils/formatting';
import { IconSymbol } from '@mysuite/ui';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { useActiveWorkoutTimer } from '../../providers/ActiveWorkoutProvider';
import { WorkoutLocationTrackingService } from '../../services/WorkoutLocationTrackingService';
import { computeRouteDistance } from '../../utils/geo';

interface OutdoorRunPanelProps {
    index: number;
    exercise: any;
    onUpdateSetTarget?: (index: number, key: 'distance' | 'duration', value: string) => void;
    showDistance: boolean;
    isGpsTrackingActive: boolean;
    isCurrentPage: boolean;
    wheelsReady: boolean;
    exercisePrepTime?: number;
    theme: any;
}

// Running/Biking's elapsed clock, distance tile, live map and pause/resume
// button, split out of CardWorkoutSet so the once-a-second stopwatch tick
// only re-renders this leaf instead of the whole set card (and everything
// the FlatList has to reconcile around it — this was the fix for the
// "VirtualizedList: large list is slow to update" warning during a run).
function OutdoorRunPanelInner({
    index,
    exercise,
    onUpdateSetTarget,
    showDistance,
    isGpsTrackingActive,
    isCurrentPage,
    wheelsReady,
    exercisePrepTime,
    theme,
}: OutdoorRunPanelProps) {
    const distanceInputRef = React.useRef<TextInput>(null);
    const { isRunning: isWorkoutRunning } = useActiveWorkoutTimer();

    const [isRunning, setIsRunning] = React.useState(false);
    const [remainingSecs, setRemainingSecs] = React.useState(0);
    const [isPrepping, setIsPrepping] = React.useState(false);
    const [prepSecs, setPrepSecs] = React.useState(0);

    React.useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            if (isPrepping) {
                setPrepSecs(prev => {
                    if (prev <= 1) {
                        setIsPrepping(false);
                        setRemainingSecs(0);
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setRemainingSecs(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning, isPrepping]);

    const pause = () => {
        setIsRunning(false);
        if (!isPrepping && remainingSecs > 0) {
            onUpdateSetTarget?.(index, 'duration', remainingSecs.toString());
        }
    };
    const resume = () => setIsRunning(true);

    // Only the very first time this page becomes current should it reset
    // and run the prep countdown — every later return (after swiping away
    // and back) just resumes from wherever the elapsed time was paused.
    const hasStartedRef = React.useRef(false);

    // No manual play button — starts on its own as soon as this set becomes
    // the active page, and pauses itself when the user swipes away or the
    // whole workout gets paused from the header. Without the pause half, a
    // page visited once keeps ticking forever in the background (still
    // mounted as a preloaded neighbor / cached cell), committing a
    // re-render every second for the rest of the workout.
    React.useEffect(() => {
        const shouldRun = isCurrentPage && wheelsReady && isWorkoutRunning;
        if (shouldRun && !isRunning) {
            if (!hasStartedRef.current) {
                hasStartedRef.current = true;
                const prep = exercisePrepTime || 0;
                if (prep > 0) {
                    setIsPrepping(true);
                    setPrepSecs(prep);
                }
                setRemainingSecs(0);
            }
            setIsRunning(true);
        } else if (!shouldRun && isRunning) {
            pause();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCurrentPage, wheelsReady, isWorkoutRunning]);

    const { unitSystem } = useUnitPreference();
    const isRunningRef = React.useRef(isRunning);
    isRunningRef.current = isRunning;
    const isWorkoutRunningRef = React.useRef(isWorkoutRunning);
    isWorkoutRunningRef.current = isWorkoutRunning;
    const unitSystemRef = React.useRef(unitSystem);
    unitSystemRef.current = unitSystem;
    const onUpdateSetTargetRef = React.useRef(onUpdateSetTarget);
    onUpdateSetTargetRef.current = onUpdateSetTarget;

    // Auto-fill this set's Distance from the live GPS route while tracking
    // is active. The location service keeps polling regardless of pause
    // state (it's the source of truth for the eventual route/map), but the
    // displayed/logged distance is only updated while actually running —
    // paused time (either this exercise's own pause button, or the whole
    // workout being paused from the header) shouldn't make distance climb.
    React.useEffect(() => {
        if (!isGpsTrackingActive) return;
        let cancelled = false;

        const poll = async () => {
            const points = await WorkoutLocationTrackingService.getLiveRoute();
            if (cancelled || points.length < 2 || !isRunningRef.current || !isWorkoutRunningRef.current) return;
            const meters = computeRouteDistance(points);
            const displayValue = unitSystemRef.current === 'imperial' ? meters / 1609.34 : meters / 1000;
            onUpdateSetTargetRef.current?.(index, 'distance', displayValue.toFixed(2));
        };

        poll();
        const interval = setInterval(poll, 3000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [isGpsTrackingActive, index]);
    const distanceValue = exercise.setTargets?.[index]?.distance != null
        ? String(exercise.setTargets[index].distance)
        : '';
    const distanceTextColor = distanceValue === '' ? 'text-light-muted dark:text-dark-muted' : 'text-light dark:text-dark';
    const avgPace = formatPace(remainingSecs, parseFloat(distanceValue) || 0, unitSystem);

    return (
        <View className="w-full items-center" style={{ flex: 1 }}>
            {/* Elapsed + Pace + Distance, aligned with the Previous/Rest row above (left/right, same tile size) */}
            <View className="flex-row justify-between w-full px-0 mb-2">
                <View className="min-w-[80px] h-[72px] items-start justify-center p-1">
                    <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>Avg Pace</Text>
                    <Text className={`text-xl font-bold mt-1 ${avgPace === '--' ? 'text-light-muted dark:text-dark-muted' : 'text-light dark:text-dark'}`} numberOfLines={1}>
                        {avgPace}
                    </Text>
                </View>
                <View className="flex-1 h-[72px] items-center justify-center p-1">
                    <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>
                        {isPrepping ? 'Prep' : 'Elapsed'}
                    </Text>
                    <Text className="text-xl font-bold mt-1 text-light dark:text-dark" numberOfLines={1}>
                        {isPrepping ? `${prepSecs}s` : formatStopwatch(remainingSecs)}
                    </Text>
                </View>
                {showDistance && (
                    <TouchableOpacity
                        className="min-w-[80px] h-[72px] items-end justify-center p-1 active:opacity-75"
                        onPress={() => distanceInputRef.current?.focus()}
                        disabled={isGpsTrackingActive}
                    >
                        <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>Distance</Text>
                        <TextInput
                            ref={distanceInputRef}
                            className={`text-xl font-bold mt-1 text-right ${distanceTextColor}`}
                            // Skip the "previous session" fallback here — an untouched set for a
                            // fresh Running/Biking run should read blank/0, not a stale distance
                            // logged from a past workout.
                            value={distanceValue}
                            onChangeText={(t: string) => {
                                if (t === '' || /^\d*\.?\d*$/.test(t)) {
                                    onUpdateSetTarget?.(index, 'distance', t);
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="-"
                            placeholderTextColor={theme.placeholder || '#888'}
                            selectTextOnFocus
                            editable={!isGpsTrackingActive}
                            style={{ minWidth: 40 }}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Fills exactly whatever space remains (flex: 1) rather than a
                fixed height fraction — self-adjusting, so it can never overflow
                into (and get clipped by) the page's own bounds, and never leaves
                a wasted gap before the play button either. */}
            {isGpsTrackingActive && isCurrentPage ? (
                <LiveWorkoutMap color={theme.primary} />
            ) : (
                <View
                    className="w-full items-center justify-center py-6 px-4 bg-black/5 dark:bg-white/5 rounded-2xl"
                    style={{ flex: 1 }}
                >
                    <Text className="text-sm text-center text-light-muted dark:text-dark-muted">
                        {isGpsTrackingActive
                            ? 'Loading route…'
                            : 'Enable Allow GPS Route Tracking in Settings to see your route here.'}
                    </Text>
                </View>
            )}

            {/* Timer/Stopwatch toggle and play button intentionally omitted here —
                Running/Biking are always stopwatch mode and auto-start (see the
                effect above). This just pauses/resumes; Complete Set ends the set. */}
            {wheelsReady && !isPrepping && (
                <TouchableOpacity
                    onPress={isRunning ? pause : resume}
                    className={`w-12 h-12 rounded-full items-center justify-center active:opacity-90 shadow-sm mt-2 ${
                        isRunning ? 'bg-black/10 dark:bg-white/10' : 'bg-primary dark:bg-primary-dark'
                    }`}
                >
                    <IconSymbol
                        name={isRunning ? "pause.fill" : "play.fill"}
                        size={18}
                        color={isRunning ? (theme.textMuted || '#888') : '#fff'}
                        style={!isRunning ? { marginLeft: 2 } : undefined}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

export const OutdoorRunPanel = React.memo(OutdoorRunPanelInner);
