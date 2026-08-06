import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, useWindowDimensions, Vibration, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { IconSymbol } from "@mysuite/ui";

import { getExerciseFields } from './getExerciseFields';
import { HorizontalSelectorWheel } from './HorizontalSelectorWheel';
import { OutdoorRunPanel } from './OutdoorRunPanel';
import { VerticalSelectorWheel } from './VerticalSelectorWheel';
import { inferEquipment, inferMovementType } from '../../providers/DataRepository';
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { formatSeconds, formatRestTime } from '../../utils/formatting';
import { getSuggestedGoal, getSuggestedUnilateralGoal, getSuggestedDurationGoal } from '../../utils/progressiveOverload';
import { lbToDisplay, displayToLb, roundForDisplay, snapToValues } from '../../utils/units';
import { getEffectiveBodyweightLoad, isOutdoorGpsExercise as computeIsOutdoorGpsExercise } from '../../utils/workout-logic';

type SetField = 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe';
type TickSize = 'lg' | 'md' | 'sm';

const INLINE_MIN_VALUES = Array.from({ length: 15 }, (_, i) => i);
const INLINE_SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);
const WEIGHT_VALUES_LB = Array.from({ length: 201 }, (_, i) => i * 2.5); // 0 to 500
const WEIGHT_VALUES_KG = Array.from({ length: 201 }, (_, i) => i * 1.25); // 0 to 250
// Bodyweight+Weighted combo exercises (e.g. merged pull_up) log weight
// relative to bodyweight - negative for band/machine assistance, positive
// for added load - so their wheel needs a negative range. Plain weighted
// exercises (bench press, curls, ...) never need negative and keep the
// positive-only wheel above so they can't be scrolled into a nonsense value.
const ASSISTABLE_WEIGHT_VALUES_LB = Array.from({ length: 261 }, (_, i) => -150 + i * 2.5); // -150 to 500
const ASSISTABLE_WEIGHT_VALUES_KG = Array.from({ length: 261 }, (_, i) => -75 + i * 1.25); // -75 to 250
const REP_VALUES = Array.from({ length: 51 }, (_, i) => i); // 0 to 50

// Ruler-style ticks (not per-item numbers), so tick spacing doesn't need to
// match a "one visible neighbor" width like a number wheel would - the
// wheel's own padding keeps it centered for any itemWidth. Kept tight so
// dragging feels like a real meter stick.
const WHEEL_ITEM_WIDTH = 16;
const WHEEL_HEIGHT = 56;
const DURATION_WHEEL_HEIGHT = 120;
const DURATION_ITEM_HEIGHT = 40;
const PREP_OPTIONS = [0, 3, 5, 10];

// Weight/reps wheel tick heights: big at every 10, medium at every 5, small
// otherwise. Module-level (not defined inline in render) so it's a stable
// function reference across renders - the wheel is React.memo'd and a fresh
// inline function every render would defeat that.
function getTickSizeByTens(val: number): TickSize {
    const v = Math.abs(val);
    if (v % 10 === 0) return 'lg';
    if (v % 5 === 0) return 'md';
    return 'sm';
}

// Fields that carry over from the previous log / exercise default when this
// set hasn't been touched yet.
const CARRYOVER_FIELDS: SetField[] = ['reps', 'reps_left', 'reps_right', 'duration', 'distance'];

function isBlank(val: any): boolean {
    return val === undefined || val === null || val === '';
}

function getTextColor(val: string): string {
    return val === '' ? 'text-light-muted dark:text-dark-muted' : 'text-light dark:text-dark';
}

// Numeric text inputs only accept a (possibly decimal) number or an empty
// string, so the field can never hold an unparseable value.
function isNumericInput(text: string): boolean {
    return text === '' || /^\d*\.?\d*$/.test(text);
}

// Fraction of the countdown ring left filled. Prep counts its own countdown
// down; a stopwatch has no target to count down to, so it sweeps the ring
// once per minute like a stopwatch hand; an idle clock shows a full ring.
function getClockProgress({
    isRunning,
    isPrepping,
    isStopwatch,
    prepTotalSecs,
    prepRemainingSecs,
    seconds,
    targetSecs,
}: {
    isRunning: boolean;
    isPrepping: boolean;
    isStopwatch: boolean;
    prepTotalSecs: number;
    prepRemainingSecs: number;
    seconds: number;
    targetSecs: number;
}): number {
    if (!isRunning) return 1;
    if (isPrepping) return prepTotalSecs > 0 ? prepRemainingSecs / prepTotalSecs : 0;
    if (isStopwatch) return (seconds % 60) / 60;
    return targetSecs > 0 ? seconds / targetSecs : 0;
}

function formatAssistableWeight(weight: number): string {
    return weight > 0 ? `+${weight}` : `${weight}`;
}

interface DistanceRowProps {
    value: string;
    onChange: (val: string) => void;
    placeholderColor: string;
    className?: string;
}

function DistanceRow({ value, onChange, placeholderColor, className = '' }: DistanceRowProps) {
    return (
        <View className={`flex-row justify-between items-center ${className}`}>
            <Text className="text-sm font-semibold text-light-muted dark:text-dark-muted">Distance</Text>
            <TextInput
                className={`w-24 bg-black/5 dark:bg-white/5 rounded-lg px-3 py-1.5 text-right text-sm font-bold ${getTextColor(value)}`}
                value={value}
                onChangeText={(t: string) => { if (isNumericInput(t)) onChange(t); }}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor={placeholderColor}
                selectTextOnFocus
            />
        </View>
    );
}

// Resting mirror of HorizontalSelectorWheel's ruler + value label, shown
// until the real wheel mounts so the swap is seamless (only the tick marks
// fade in).
function WheelPlaceholder({ text, isAtGoal, goalColor }: { text: string; isAtGoal: boolean; goalColor: string }) {
    return (
        <View>
            <View style={{ height: WHEEL_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                <View
                    className="border-l border-r border-primary/20 bg-primary/5"
                    style={{ width: WHEEL_ITEM_WIDTH, height: WHEEL_HEIGHT, borderRadius: 12 }}
                />
            </View>
            <View className="items-center justify-center flex-row mt-1">
                <Text
                    className="font-black text-2xl text-light dark:text-dark"
                    style={isAtGoal ? { color: goalColor } : undefined}
                >
                    {text}
                </Text>
            </View>
        </View>
    );
}

// The band marking the selected row of the m:s duration wheels. Rendered
// identically behind both the live wheels and their static placeholder.
function DurationSelectionBand() {
    return (
        <View
            className="absolute left-0 right-0 border-t border-b border-primary/20 bg-primary/5"
            style={{ height: DURATION_ITEM_HEIGHT, top: DURATION_ITEM_HEIGHT, borderRadius: 6 }}
            pointerEvents="none"
        />
    );
}

function DurationUnitLabel({ unit, className = '' }: { unit: string; className?: string }) {
    return <Text className={`text-sm font-bold text-light dark:text-dark ${className}`} style={{ width: 12 }}>{unit}</Text>;
}

// Static mirror of the duration wheels' resting state so the swap to the live
// wheels is seamless — same band, columns and labels, with the selected
// min/sec at the wheel's selected font size.
function StaticDurationDisplay({ currentMin, currentSec, goalMin, goalSec, goalColor }: {
    currentMin: number;
    currentSec: number;
    goalMin?: number;
    goalSec?: number;
    goalColor: string;
}) {
    const renderColumn = (val: number, goal?: number) => (
        <View style={{ height: DURATION_WHEEL_HEIGHT, width: 50 }} className="items-center justify-center">
            <Text
                className="font-black text-light dark:text-dark"
                style={{ fontSize: 36, ...(goal !== undefined && val === goal ? { color: goalColor } : null) }}
            >
                {val}
            </Text>
        </View>
    );

    return (
        <View style={{ height: DURATION_WHEEL_HEIGHT, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
            <DurationSelectionBand />
            {renderColumn(currentMin, goalMin)}
            <DurationUnitLabel unit="m" className="mr-0.5" />
            <Text className="text-light dark:text-dark font-bold px-1 text-3xl opacity-60">:</Text>
            {renderColumn(currentSec, goalSec)}
            <DurationUnitLabel unit="s" />
        </View>
    );
}

// Prep countdown selector - flanks the clock on the left, stacked vertically
// to match the flank's narrow column.
function PrepTimeSelector({ selectedPrepSec, onSelect, isDark }: {
    selectedPrepSec: number;
    onSelect: (val: number) => void;
    isDark: boolean;
}) {
    return (
        <View style={{ marginRight: 36, alignItems: 'center' }}>
            <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted mb-1.5 uppercase tracking-widest">Prep</Text>
            <View className="flex-col items-center bg-black/10 dark:bg-white/10 rounded-2xl p-0.5" style={{ width: 44 }}>
                {PREP_OPTIONS.map((val) => {
                    const isSelected = selectedPrepSec === val;
                    return (
                        <Pressable
                            key={val}
                            onPress={() => onSelect(val)}
                            style={{
                                width: '100%',
                                alignItems: 'center',
                                paddingHorizontal: 4,
                                paddingVertical: 12,
                                borderRadius: 14,
                                backgroundColor: isSelected ? (isDark ? '#2c2c2e' : '#fff') : 'transparent',
                            }}
                        >
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={{
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: isSelected ? '#f97316' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                                }}
                            >
                                {val === 0 ? 'None' : `${val}s`}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

interface CardWorkoutSetProps {
    index: number;
    exercise: any;
    onUpdateSetTarget?: (index: number, key: SetField, value: string) => void;
    onDeleteSet: (index: number) => void;
    onPressRPE?: (index: number, currentVal: string) => void;
    theme: any;
    latestBodyWeight?: number | null;
    isActiveWorkout?: boolean;
    exercisePrepTime?: number;
    onUpdatePrepTime?: (prepTime: number) => void;
    isActiveSet?: boolean;
    onPressRestTimer?: () => void;
    isCompleted: boolean;
    // True only while this exercise's page is actually the one visible on
    // screen — unlike isActiveSet, which is also true for preloaded
    // off-screen neighbors. Gates the live map (a heavy native view that can
    // visually bleed onto neighboring pages if left mounted while merely
    // preloaded).
    isCurrentPage?: boolean;
    // How long to wait before mounting the heavy wheel/SVG clock, in ms.
    // Preloaded neighbors get a longer, staggered delay than the current
    // page so simultaneously-preloaded cards don't all mount in one commit
    // (see the comment where ActiveWorkoutScreen computes this).
    wheelsReadyDelayMs?: number;
    // Threaded down as props instead of reading WorkoutManagerProvider/
    // ActiveWorkoutContext directly - a context value changing (e.g. any
    // set edit touches ActiveWorkoutContext's `exercises`) would otherwise
    // re-render every mounted CardWorkoutSet regardless of React.memo,
    // since useContext bypasses memo entirely.
    isRpeEnabled?: boolean;
    isProgressiveOverloadEnabled?: boolean;
    progressiveOverloadRepCeiling?: number;
    isGpsTrackingActive?: boolean;
}

function CardWorkoutSetInner({
    index,
    exercise,
    onUpdateSetTarget,
    onDeleteSet,
    onPressRPE,
    theme,
    latestBodyWeight,
    isActiveWorkout = true,
    exercisePrepTime,
    onUpdatePrepTime,
    isActiveSet = true,
    onPressRestTimer,
    isCompleted,
    isCurrentPage = true,
    wheelsReadyDelayMs = 60,
    isRpeEnabled = false,
    isProgressiveOverloadEnabled = false,
    progressiveOverloadRepCeiling,
    isGpsTrackingActive = false
}: CardWorkoutSetProps) {
    const { height: windowHeight } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const { unitSystem, weightUnit } = useUnitPreference();
    const isSmallScreen = windowHeight < 900;
    const rowPadding = isSmallScreen ? 'py-1' : 'py-2';

    // Always start false so mounting a card never synchronously builds the
    // heavy wheel inside the same commit that swaps the current exercise —
    // that would block the name/progress paint. The wheel is mounted via the
    // async timeout below (a separate commit, off the swipe's critical path).
    // Preloaded neighbours flip to true while idle off-screen, so the swipe
    // target already shows its wheel by the time it becomes current.
    const [wheelsReady, setWheelsReady] = React.useState(false);
    React.useEffect(() => {
        if (isActiveSet) {
            const handle = setTimeout(() => setWheelsReady(true), wheelsReadyDelayMs);
            return () => clearTimeout(handle);
        } else {
            setWheelsReady(false);
        }
    }, [isActiveSet, wheelsReadyDelayMs]);

    const { showBodyweight, showWeight, showReps, showDuration, showDistance, showRPE: calculatedShowRPE } = getExerciseFields(exercise.properties, exercise.id);
    const showRPE = calculatedShowRPE && isRpeEnabled;
    // Running/Biking get a live map + plain digital stopwatch instead of the
    // circular timer dial — there's no target duration to count down to,
    // only elapsed time for the run/ride actually recorded.
    const isOutdoorGpsExercise = computeIsOutdoorGpsExercise(exercise);

    const equipment = exercise.equipment || inferEquipment(exercise.name);
    const movementType = exercise.movementType || inferMovementType(exercise.name, equipment);
    const isUnilateral = movementType === 'unilateral';

    const getValue = (field: SetField): string => {
        let val = exercise.setTargets?.[index]?.[field];

        // Legacy rows stored a single-purpose value under `reps` — fall back
        // to it for exercises that only track duration (or only distance).
        if (isBlank(val) && field === 'duration' && !showReps) {
            val = exercise.setTargets?.[index]?.reps;
        }
        if (isBlank(val) && field === 'distance' && !showReps && !showDuration) {
            val = exercise.setTargets?.[index]?.reps;
        }

        // Only fall back to the previous log / exercise default when the field
        // has genuinely never been touched (val === undefined). An explicitly
        // cleared field (val === '') must stay empty, otherwise the input
        // snaps back to a non-empty value the instant the user backspaces it,
        // making it impossible to clear the field or type a fresh "0".
        if (isActiveWorkout && val == null && CARRYOVER_FIELDS.includes(field)) {
            // The previous log uses the same field names as setTargets.
            const prevVal = exercise.previousLog?.[index]?.[field];
            if (prevVal != null) return prevVal.toString();
            if (exercise.reps != null && exercise.reps !== 0) return exercise.reps.toString();
            return '';
        }

        if (val == null) return '';
        return val.toString();
    };

    const durationVal = getValue('duration');

    // Stable callbacks for the selector wheels. The wheels are React.memo'd;
    // passing a fresh closure each render would defeat the memo and force the
    // 201-item wheel to reconcile on every parent re-render (timer ticks,
    // exercise swipe), which stalls the name/progress paint. Refs hold the
    // latest values so identity stays stable across renders.
    const onUpdateSetTargetRef = useRef(onUpdateSetTarget);
    onUpdateSetTargetRef.current = onUpdateSetTarget;
    const durationValRef = useRef(durationVal);
    durationValRef.current = durationVal;
    const unitSystemRef = useRef(unitSystem);
    unitSystemRef.current = unitSystem;

    // The wheel operates in the user's display unit; storage always stays in
    // lb (canonical), so convert back on every change.
    const handleWeightChange = React.useCallback((val: number) => {
        const lbValue = displayToLb(val, unitSystemRef.current);
        onUpdateSetTargetRef.current?.(index, 'weight', lbValue.toString());
    }, [index]);

    const handleRepsChange = React.useCallback((val: number) => {
        onUpdateSetTargetRef.current?.(index, 'reps', val.toString());
    }, [index]);

    const handleRepsLeftChange = React.useCallback((val: number) => {
        onUpdateSetTargetRef.current?.(index, 'reps_left', val.toString());
    }, [index]);

    const handleRepsRightChange = React.useCallback((val: number) => {
        onUpdateSetTargetRef.current?.(index, 'reps_right', val.toString());
    }, [index]);

    // Progressive-overload suggestion (double progression, RPE-adjusted when
    // RPE tracking is on): same weight +1 rep until the rep ceiling, then
    // reset reps and bump the weight. Marked directly on the wheel by
    // coloring the goal value's digits (see goalColor below) rather than a
    // separate tappable badge — scroll to it like any other value.
    // Memoized: the wheel's touch handlers toggle state on the outer set
    // pager (to lock its scroll during a drag — see SetPagerScrollLock),
    // which re-renders this component on every touch start/end. Without
    // memoizing, that recomputed this on every such re-render, including
    // mid-gesture, which showed up as lag while actively scrolling the wheel.
    const prevLog = exercise.previousLog?.[index];
    const avgRpe = isRpeEnabled ? exercise.avgRpeBySetIndex?.[index] : undefined;
    const suggestedGoal = React.useMemo(
        () => (isProgressiveOverloadEnabled
            ? (isUnilateral
                ? getSuggestedUnilateralGoal(prevLog, avgRpe, progressiveOverloadRepCeiling)
                : getSuggestedGoal(prevLog, avgRpe, progressiveOverloadRepCeiling))
            : null),
        [isProgressiveOverloadEnabled, isUnilateral, prevLog, avgRpe, progressiveOverloadRepCeiling]
    );
    // Same idea for timed holds — see getSuggestedDurationGoal. Independent
    // from suggestedGoal above since an exercise tracks either reps or
    // duration, not both, though it may ALSO track weight alongside either.
    const suggestedDurationGoal = React.useMemo(
        () => (isProgressiveOverloadEnabled ? getSuggestedDurationGoal(prevLog, avgRpe) : null),
        [isProgressiveOverloadEnabled, prevLog, avgRpe]
    );
    // theme.info (hsl(217, 91%, 60%)) is identical in both themes, but 60%
    // lightness reads as faded against the light theme's pale background —
    // it only has good contrast against the dark theme's near-black one.
    // Same hue/saturation, darkened for light mode.
    const goalColor = theme.dark ? (theme.info || theme.primary) : 'hsl(217, 91%, 45%)';

    const handleDurationMinChange = React.useCallback((newMin: number) => {
        const currentSecs = parseInt(durationValRef.current) || 0;
        const currentSec = currentSecs % 60;
        const targetTotal = newMin * 60 + currentSec;
        if (targetTotal !== currentSecs) {
            onUpdateSetTargetRef.current?.(index, 'duration', targetTotal.toString());
        }
    }, [index]);

    const handleDurationSecChange = React.useCallback((newSec: number) => {
        const currentSecs = parseInt(durationValRef.current) || 0;
        const currentMin = Math.floor(currentSecs / 60);
        const targetTotal = currentMin * 60 + newSec;
        if (targetTotal !== currentSecs) {
            onUpdateSetTargetRef.current?.(index, 'duration', targetTotal.toString());
        }
    }, [index]);

    const [selectedPrepSec, setSelectedPrepSec] = React.useState(exercisePrepTime || 0);

    const [isLocalTimerRunning, setIsLocalTimerRunning] = React.useState(false);
    const [localRemainingSecs, setLocalRemainingSecs] = React.useState(0);
    const [localPrepSecs, setLocalPrepSecs] = React.useState(0);
    const [isLocalPrepping, setIsLocalPrepping] = React.useState(false);
    // Timer (countdown to a target duration) vs Stopwatch (counts up with no
    // target; the elapsed time becomes this set's logged duration on stop).
    const [isStopwatchMode, setIsStopwatchMode] = React.useState(isOutdoorGpsExercise);
    // Running/Biking are always stopwatch mode — no toggle is rendered for
    // them, and the mode can't be flipped away.
    const toggleStopwatchMode = () => {
        if (!isOutdoorGpsExercise) setIsStopwatchMode((prev) => !prev);
    };
    const stopwatchTogglePos = useSharedValue(0);
    React.useEffect(() => {
        stopwatchTogglePos.value = withTiming(isStopwatchMode ? 1 : 0, {
            duration: 220,
            easing: Easing.out(Easing.quad),
        });
    }, [isStopwatchMode, stopwatchTogglePos]);
    const stopwatchToggleThumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: stopwatchTogglePos.value * 42 }],
    }));
    React.useEffect(() => {
        if (!isLocalTimerRunning) return;

        const handle = setInterval(() => {
            if (isLocalPrepping) {
                setLocalPrepSecs(prev => {
                    if (prev > 1) {
                        Vibration.vibrate(10);
                        return prev - 1;
                    }
                    // Prep just finished — hand over to the timer/stopwatch.
                    setIsLocalPrepping(false);
                    const duration = parseInt(durationVal) || 0;
                    Vibration.vibrate(100);
                    if (isStopwatchMode) {
                        setLocalRemainingSecs(0);
                    } else {
                        setLocalRemainingSecs(duration);
                        if (duration <= 0) {
                            setIsLocalTimerRunning(false);
                            Vibration.vibrate([0, 500, 200, 500]);
                        }
                    }
                    return 0;
                });
            } else if (isStopwatchMode) {
                setLocalRemainingSecs(prev => prev + 1);
            } else {
                setLocalRemainingSecs(prev => {
                    if (prev > 1) return prev - 1;
                    setIsLocalTimerRunning(false);
                    Vibration.vibrate([0, 500, 200, 500]);
                    return 0;
                });
            }
        }, 1000);

        return () => clearInterval(handle);
    }, [isLocalTimerRunning, isLocalPrepping, isStopwatchMode, durationVal]);

    const startLocalTimer = () => {
        const prep = selectedPrepSec;
        // A stopwatch always has something to count; a countdown timer needs
        // either a target duration or a prep phase to be worth starting.
        const duration = isStopwatchMode ? 0 : (parseInt(durationVal) || 0);
        if (!isStopwatchMode && duration <= 0 && prep <= 0) return;

        setIsLocalPrepping(prep > 0);
        if (prep > 0) setLocalPrepSecs(prep);
        setLocalRemainingSecs(duration);
        setIsLocalTimerRunning(true);
    };

    const stopLocalTimer = () => {
        setIsLocalTimerRunning(false);
        setIsLocalPrepping(false);
        // Log the elapsed time as this set's duration.
        if (isStopwatchMode && !isLocalPrepping && localRemainingSecs > 0) {
            onUpdateSetTarget?.(index, 'duration', localRemainingSecs.toString());
        }
    };

    React.useEffect(() => {
        setSelectedPrepSec(exercisePrepTime || 0);
    }, [exercisePrepTime]);

    const getPreviousDisplay = () => {
        const prev = exercise.previousLog?.[index];
        if (!prev) return "-";

        const parts = [];
        const formatValue = (val: any, fallback = "0") => (isBlank(val) ? fallback : val);
        // Previous-log weights are stored in lb like everything else — convert
        // to the user's display unit before showing them.
        const formatWeightValue = (val: any, fallback = "0") => {
            if (isBlank(val)) return fallback;
            const num = parseFloat(val);
            if (isNaN(num)) return fallback;
            return roundForDisplay(lbToDisplay(num, unitSystem), unitSystem);
        };

        if (showWeight) {
            if (showBodyweight) {
                const bw = prev.bodyweight ?? getEffectiveBodyweightLoad(exercise, latestBodyWeight);
                const added = prev.weight;
                if (bw != null && added != null && added !== 0) {
                    // Negative = assistance (band/machine), positive = added weight.
                    const sign = added > 0 ? '+' : '-';
                    parts.push(`${formatWeightValue(bw)}${sign}${formatWeightValue(Math.abs(added))}`);
                } else {
                    parts.push(formatWeightValue(bw ?? added));
                }
            } else {
                parts.push(formatWeightValue(prev.weight));
            }
        }

        if (showReps) {
            if (isUnilateral) {
                const l = prev.reps_left ?? prev.reps ?? "0";
                const r = prev.reps_right ?? prev.reps ?? "0";
                parts.push(`${l}L/${r}R`);
            } else {
                parts.push(formatValue(prev.reps));
            }
        }
        if (showDuration) {
            parts.push(prev.duration ? formatSeconds(parseInt(prev.duration) || 0) : "00:00");
        }
        if (showDistance) {
            parts.push(formatValue(prev.distance));
        }
        
        let display = parts.join(" x ");
        if (showRPE && prev.rpe) {
            display += ` @ ${prev.rpe}`;
        }
        return display.length > 0 ? display : "-";
    };

    return (
        <View className={`w-full flex-col px-0 flex-1 ${isOutdoorGpsExercise ? 'py-0 justify-start' : 'py-1 justify-around'}`}>
            {!isOutdoorGpsExercise && (
                <View className="flex-row justify-between w-full px-0 mb-3">
                    <View className="min-w-[80px] h-[72px] items-start justify-center p-1">
                        <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>Previous</Text>
                        <Text className="text-xl font-bold text-light dark:text-dark mt-1" numberOfLines={1}>
                            {getPreviousDisplay()}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => onPressRestTimer?.()}
                        className="min-w-[80px] h-[72px] items-end justify-center p-1 active:opacity-75"
                    >
                        <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>Rest</Text>
                        <Text className="text-xl font-bold text-light dark:text-dark mt-1" numberOfLines={1}>
                            {formatRestTime(exercise.restTime ?? 90)}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {showDuration && (
                <View className={`${(showDistance || showRPE) ? 'border-b border-black/5 dark:border-white/5 pb-3' : ''} flex-col ${isOutdoorGpsExercise ? 'py-0 flex-1' : rowPadding}`}>
                    {isOutdoorGpsExercise ? (
                        <OutdoorRunPanel
                            index={index}
                            exercise={exercise}
                            onUpdateSetTarget={onUpdateSetTarget}
                            showDistance={showDistance}
                            isGpsTrackingActive={isGpsTrackingActive}
                            isCurrentPage={isCurrentPage}
                            wheelsReady={wheelsReady}
                            exercisePrepTime={exercisePrepTime}
                            theme={theme}
                        />
                    ) : (() => {
                        const clockSize = isSmallScreen ? 240 : 260;
                        const radius = isSmallScreen ? 100 : 110;
                        const strokeWidth = isSmallScreen ? 10 : 14;
                        const center = clockSize / 2;
                        const circumference = 2 * Math.PI * radius;
                        const targetSecs = parseInt(durationVal) || 0;
                        const dashoffset = circumference * (1 - getClockProgress({
                            isRunning: isLocalTimerRunning,
                            isPrepping: isLocalPrepping,
                            isStopwatch: isStopwatchMode,
                            prepTotalSecs: selectedPrepSec,
                            prepRemainingSecs: localPrepSecs,
                            seconds: localRemainingSecs,
                            targetSecs,
                        }));
                        const currentMin = Math.floor(targetSecs / 60);
                        const currentSec = targetSecs % 60;
                        const goalMin = suggestedDurationGoal ? Math.floor(suggestedDurationGoal.duration / 60) : undefined;
                        const goalSec = suggestedDurationGoal ? suggestedDurationGoal.duration % 60 : undefined;

                        // What sits inside the ring: a live readout while the
                        // timer runs, otherwise the editable m:s duration
                        // wheels (a stopwatch has nothing to preset, so it
                        // just shows a zeroed readout).
                        let clockFace;
                        if (isLocalTimerRunning) {
                            clockFace = (
                                <>
                                    <Text className="text-light-muted dark:text-dark-muted uppercase tracking-wider text-[11px] font-semibold mb-0.5">
                                        {isLocalPrepping ? 'Prep' : (isStopwatchMode ? 'Elapsed' : 'Time')}
                                    </Text>
                                    <Text className={`font-black text-light dark:text-dark text-center ${isSmallScreen ? 'text-5xl' : 'text-6xl'}`}>
                                        {isLocalPrepping ? `${localPrepSecs}s` : formatSeconds(localRemainingSecs)}
                                    </Text>
                                </>
                            );
                        } else if (isStopwatchMode) {
                            clockFace = (
                                <>
                                    <Text className="text-light-muted dark:text-dark-muted uppercase tracking-wider text-[11px] font-semibold mb-0.5">
                                        Stopwatch
                                    </Text>
                                    <Text className={`font-black text-light dark:text-dark text-center ${isSmallScreen ? 'text-5xl' : 'text-6xl'}`}>
                                        00:00
                                    </Text>
                                </>
                            );
                        } else if (wheelsReady) {
                            clockFace = (
                                <View style={{ height: DURATION_WHEEL_HEIGHT, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                                    <DurationSelectionBand />
                                    <VerticalSelectorWheel
                                        value={currentMin}
                                        onValueChange={handleDurationMinChange}
                                        values={INLINE_MIN_VALUES}
                                        itemHeight={DURATION_ITEM_HEIGHT}
                                        width={50}
                                        goalValue={goalMin}
                                        goalColor={goalColor}
                                    />
                                    <DurationUnitLabel unit="m" className="mr-0.5" />
                                    <Text className="text-light dark:text-dark font-bold px-1 text-3xl opacity-60">:</Text>
                                    <VerticalSelectorWheel
                                        value={currentSec}
                                        onValueChange={handleDurationSecChange}
                                        values={INLINE_SEC_VALUES}
                                        itemHeight={DURATION_ITEM_HEIGHT}
                                        width={50}
                                        goalValue={goalSec}
                                        goalColor={goalColor}
                                    />
                                    <DurationUnitLabel unit="s" />
                                </View>
                            );
                        } else {
                            clockFace = (
                                <StaticDurationDisplay
                                    currentMin={currentMin}
                                    currentSec={currentSec}
                                    goalMin={goalMin}
                                    goalSec={goalSec}
                                    goalColor={goalColor}
                                />
                            );
                        }

                        return (
                            <View className="w-full items-center justify-center my-0.5">
                                {/* Explicit full width + a flex:1 middle column, not just
                                    row content centered in the parent - with equal fixed-
                                    width flanks either side, the middle column's own
                                    center always lands on the row's true center regardless
                                    of available width, instead of drifting off-center
                                    whenever the row's natural content width doesn't line
                                    up with how the parent centers it. */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                    <View style={{ width: 96, alignItems: 'flex-end' }}>
                                        {wheelsReady && (
                                            <PrepTimeSelector
                                                selectedPrepSec={selectedPrepSec}
                                                onSelect={(val) => {
                                                    setSelectedPrepSec(val);
                                                    onUpdatePrepTime?.(val);
                                                }}
                                                isDark={colorScheme === 'dark'}
                                            />
                                        )}
                                    </View>

                                    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 12 }}>
                                        <View style={{ width: clockSize, height: clockSize, justifyContent: 'center', alignItems: 'center' }}>
                                            <Svg width={clockSize} height={clockSize}>
                                                <Circle
                                                    cx={center}
                                                    cy={center}
                                                    r={radius}
                                                    stroke={theme.bgDark === '#000000' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                                    strokeWidth={strokeWidth}
                                                    fill="transparent"
                                                />
                                                <Circle
                                                    cx={center}
                                                    cy={center}
                                                    r={radius}
                                                    stroke={isLocalTimerRunning && isLocalPrepping ? '#ff9f0a' : theme.primary}
                                                    strokeWidth={strokeWidth}
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={dashoffset}
                                                    strokeLinecap="round"
                                                    transform={`rotate(-90 ${center} ${center})`}
                                                />
                                            </Svg>
                                            <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', width: clockSize - 40, height: clockSize - 40 }}>
                                                {clockFace}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Timer/Stopwatch mode toggle, stacked above the
                                        Play/Stop button - both flank the clock on the
                                        right. */}
                                    <View style={{ width: 96, alignItems: 'flex-start' }}>
                                        {wheelsReady && (
                                            <View style={{ marginLeft: 36, alignItems: 'center' }}>
                                                <TouchableOpacity
                                                    disabled={isLocalTimerRunning}
                                                    onPress={toggleStopwatchMode}
                                                    className="flex-col bg-black/10 dark:bg-white/10 rounded-full p-0.5"
                                                    style={{ width: 48, height: 88, marginBottom: 16, opacity: isLocalTimerRunning ? 0.5 : 1 }}
                                                >
                                                    <Animated.View
                                                        style={[
                                                            stopwatchToggleThumbStyle,
                                                            {
                                                                position: 'absolute',
                                                                left: 2,
                                                                top: 2,
                                                                width: 44,
                                                                height: 42,
                                                                borderRadius: 22,
                                                                backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff',
                                                            },
                                                        ]}
                                                    />
                                                    <View style={{ height: 42, alignItems: 'center', justifyContent: 'center' }}>
                                                        <IconSymbol
                                                            name="timer"
                                                            size={14}
                                                            color={!isStopwatchMode ? theme.primary : (theme.textMuted || '#888')}
                                                        />
                                                    </View>
                                                    <View style={{ height: 42, alignItems: 'center', justifyContent: 'center' }}>
                                                        <IconSymbol
                                                            name="stopwatch"
                                                            size={14}
                                                            color={isStopwatchMode ? theme.primary : (theme.textMuted || '#888')}
                                                        />
                                                    </View>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={isLocalTimerRunning ? stopLocalTimer : startLocalTimer}
                                                    className={`w-12 h-12 rounded-full items-center justify-center active:opacity-90 shadow-sm ${
                                                        isLocalTimerRunning ? 'bg-danger' : 'bg-primary dark:bg-primary-dark'
                                                    }`}
                                                >
                                                    <IconSymbol
                                                        name={isLocalTimerRunning ? "stop.fill" : "play.fill"}
                                                        size={18}
                                                        color="#fff"
                                                        style={!isLocalTimerRunning ? { marginLeft: 2 } : undefined}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })()}

                    {/* Distance (shown here, between the timer/map and Prep/RPE, for duration+distance exercises).
                        Outdoor GPS exercises (Running/Biking) render their own Distance tile above instead. */}
                    {showDistance && !isOutdoorGpsExercise && (
                        <DistanceRow
                            value={getValue('distance')}
                            onChange={(v) => onUpdateSetTarget?.(index, 'distance', v)}
                            placeholderColor={theme.placeholder || '#888'}
                            className="mt-1.5"
                        />
                    )}

                </View>
            )}

            {showWeight && (
                <View className="flex-col items-center justify-center py-2">
                    <Text className="text-xs font-bold text-light-muted dark:text-dark-muted mb-2 uppercase tracking-widest">Weight ({weightUnit})</Text>
                    {(() => {
                        const allowsAssistance = showBodyweight && showWeight;
                        const weightValues = allowsAssistance
                            ? (unitSystem === 'metric' ? ASSISTABLE_WEIGHT_VALUES_KG : ASSISTABLE_WEIGHT_VALUES_LB)
                            : (unitSystem === 'metric' ? WEIGHT_VALUES_KG : WEIGHT_VALUES_LB);
                        // Snapped to an exact entry in weightValues, not just
                        // rounded — see snapToValues for why that distinction
                        // matters (a "rounded but not-a-real-step" value fed
                        // into the wheel causes it to flicker indefinitely).
                        const displayWeight = snapToValues(lbToDisplay(parseFloat(getValue('weight')) || 0, unitSystem), weightValues);
                        // Weight goal comes from whichever suggestion applies
                        // to this exercise — reps-based for rep sets,
                        // duration-based for timed holds (which may also
                        // track weight, e.g. a weighted plank).
                        const weightGoalLb = suggestedGoal?.weight ?? suggestedDurationGoal?.weight;
                        const goalDisplayWeight = weightGoalLb !== undefined
                            ? snapToValues(lbToDisplay(weightGoalLb, unitSystem), weightValues)
                            : undefined;
                        const isAtGoal = goalDisplayWeight !== undefined && displayWeight === goalDisplayWeight;
                        if (!wheelsReady) {
                            return (
                                <WheelPlaceholder
                                    text={allowsAssistance ? formatAssistableWeight(displayWeight) : String(displayWeight || 0)}
                                    isAtGoal={isAtGoal}
                                    goalColor={goalColor}
                                />
                            );
                        }
                        return (
                            <HorizontalSelectorWheel
                                value={displayWeight}
                                onValueChange={handleWeightChange}
                                values={weightValues}
                                itemWidth={WHEEL_ITEM_WIDTH}
                                unit=""
                                goalValue={goalDisplayWeight}
                                goalColor={goalColor}
                                formatValue={allowsAssistance ? formatAssistableWeight : undefined}
                                getTickSize={getTickSizeByTens}
                            />
                        );
                    })()}
                </View>
            )}

            {showReps && (
                <View className="flex-col items-center justify-center py-2">
                    <Text className="text-xs font-bold text-light-muted dark:text-dark-muted mb-2 uppercase tracking-widest">Reps</Text>
                    {(() => {
                        const goalReps = suggestedGoal?.reps;
                        const renderRepsWheel = (
                            field: 'reps' | 'reps_left' | 'reps_right',
                            onChange: (val: number) => void,
                        ) => {
                            const val = parseInt(getValue(field)) || 0;
                            if (!wheelsReady) {
                                return (
                                    <WheelPlaceholder
                                        text={getValue(field) || '0'}
                                        isAtGoal={goalReps !== undefined && val === goalReps}
                                        goalColor={goalColor}
                                    />
                                );
                            }
                            return (
                                <HorizontalSelectorWheel
                                    value={val}
                                    onValueChange={onChange}
                                    values={REP_VALUES}
                                    itemWidth={WHEEL_ITEM_WIDTH}
                                    unit=""
                                    goalValue={goalReps}
                                    goalColor={goalColor}
                                    getTickSize={getTickSizeByTens}
                                />
                            );
                        };

                        if (!isUnilateral) {
                            return renderRepsWheel('reps', handleRepsChange);
                        }

                        // L and R wheels are stacked, not side by side, so
                        // each spans the full card width — centered exactly
                        // like the weight wheel, not offset by a side label.
                        return ([
                            { side: 'left', field: 'reps_left', label: 'Left', onChange: handleRepsLeftChange },
                            { side: 'right', field: 'reps_right', label: 'Right', onChange: handleRepsRightChange },
                        ] as const).map(({ side, field, label, onChange }) => (
                            <View key={side} style={{ marginTop: side === 'right' ? 12 : 0, alignItems: 'center' }}>
                                <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1">
                                    {label}
                                </Text>
                                {renderRepsWheel(field, onChange)}
                            </View>
                        ));
                    })()}
                </View>
            )}

            {/* Distance (standalone row for distance-only exercises; duration+distance
                exercises render it inside the showDuration block above instead) */}
            {showDistance && !showDuration && (
                <DistanceRow
                    value={getValue('distance')}
                    onChange={(v) => onUpdateSetTarget?.(index, 'distance', v)}
                    placeholderColor={theme.placeholder || '#888'}
                    className={`border-b border-black/5 dark:border-white/5 ${rowPadding}`}
                />
            )}

            {/* RPE - always last, under everything else in the set. */}
            {showRPE && !isOutdoorGpsExercise && (
                <View className="flex-row justify-end w-full px-0 mt-1">
                    <TouchableOpacity
                        onPress={() => onPressRPE?.(index, getValue('rpe'))}
                        className="min-w-[80px] h-[72px] items-end justify-center p-1 active:opacity-75"
                    >
                        <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>RPE</Text>
                        <Text className={`text-xl font-bold mt-1 ${getTextColor(getValue('rpe'))}`} numberOfLines={1}>
                            {getValue('rpe') || '-'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// Same rationale as ExerciseCard/SetRow's memo: callback props are recreated
// per render by the caller (index-closing inline functions), so their
// identity always changes - compare data/display props instead.
export const CardWorkoutSet = React.memo(CardWorkoutSetInner, (prev, next) => {
    return (
        prev.exercise === next.exercise &&
        prev.index === next.index &&
        prev.theme === next.theme &&
        prev.latestBodyWeight === next.latestBodyWeight &&
        prev.isActiveWorkout === next.isActiveWorkout &&
        prev.exercisePrepTime === next.exercisePrepTime &&
        prev.isActiveSet === next.isActiveSet &&
        prev.isCompleted === next.isCompleted &&
        prev.isCurrentPage === next.isCurrentPage &&
        prev.wheelsReadyDelayMs === next.wheelsReadyDelayMs &&
        prev.isRpeEnabled === next.isRpeEnabled &&
        prev.isProgressiveOverloadEnabled === next.isProgressiveOverloadEnabled &&
        prev.progressiveOverloadRepCeiling === next.progressiveOverloadRepCeiling &&
        prev.isGpsTrackingActive === next.isGpsTrackingActive
    );
});
