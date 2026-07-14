import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, useWindowDimensions, Vibration, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DurationTimerPicker } from './DurationTimerPicker';
import { HorizontalSelectorWheel } from './HorizontalSelectorWheel';
import { VerticalSelectorWheel } from './VerticalSelectorWheel';
import { formatSeconds, formatRestTime } from '../../utils/formatting';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import { inferEquipment, inferMovementType } from '../../providers/DataRepository';
import { IconSymbol } from "@mysuite/ui";
import { useUnitPreference } from '../../providers/UnitPreferenceProvider';
import { lbToDisplay, displayToLb, roundForDisplay } from '../../utils/units';

const INLINE_MIN_VALUES = Array.from({ length: 15 }, (_, i) => i);
const INLINE_SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);
const WEIGHT_VALUES_LB = Array.from({ length: 201 }, (_, i) => i * 2.5); // 0 to 500
const WEIGHT_VALUES_KG = Array.from({ length: 201 }, (_, i) => i * 1.25); // 0 to 250
const WEIGHT_ITEM_WIDTH = 120;
const REP_VALUES = Array.from({ length: 51 }, (_, i) => i); // 0 to 50

import { getExerciseFields } from './SetRow';

interface CardWorkoutSetProps {
    index: number;
    exercise: any;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe', value: string) => void;
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
}

export function CardWorkoutSet({
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
    isCompleted
}: CardWorkoutSetProps) {
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const { unitSystem, weightUnit } = useUnitPreference();
    const isSmallScreen = windowHeight < 900;
    const rowPadding = isSmallScreen ? 'py-1' : 'py-2';
    const [isDurationPickerVisible, setIsDurationPickerVisible] = React.useState(false);
    const [durationAutoStart, setDurationAutoStart] = React.useState(false);

    // Always start false so mounting a card never synchronously builds the
    // heavy wheel inside the same commit that swaps the current exercise —
    // that would block the name/progress paint. The wheel is mounted via the
    // async timeout below (a separate commit, off the swipe's critical path).
    // Preloaded neighbours flip to true while idle off-screen, so the swipe
    // target already shows its wheel by the time it becomes current.
    const [wheelsReady, setWheelsReady] = React.useState(false);
    React.useEffect(() => {
        if (isActiveSet) {
            const handle = setTimeout(() => setWheelsReady(true), 60);
            return () => clearTimeout(handle);
        } else {
            setWheelsReady(false);
        }
    }, [isActiveSet]);

    const { isRpeEnabled } = useWorkoutManager();
    const { showBodyweight, showWeight, showReps, showDuration, showDistance, showRPE: calculatedShowRPE } = getExerciseFields(exercise.properties, exercise.id);
    const showRPE = calculatedShowRPE && isRpeEnabled;

    const equipment = exercise.equipment || inferEquipment(exercise.name);
    const movementType = exercise.movementType || inferMovementType(exercise.name, equipment);
    const isUnilateral = movementType === 'unilateral';

    const getValue = (field: 'weight' | 'reps' | 'reps_left' | 'reps_right' | 'duration' | 'distance' | 'rpe') => {
        let val = exercise.setTargets?.[index]?.[field];
        
        if ((val === undefined || val === null || val === '') && field === 'duration' && !showReps) {
            val = exercise.setTargets?.[index]?.reps;
        }
        if ((val === undefined || val === null || val === '') && field === 'distance' && !showReps && !showDuration) {
            val = exercise.setTargets?.[index]?.reps;
        }

        // Only fall back to the previous log / exercise default when the field
        // has genuinely never been touched (val === undefined). An explicitly
        // cleared field (val === '') must stay empty, otherwise the input
        // snaps back to a non-empty value the instant the user backspaces it,
        // making it impossible to clear the field or type a fresh "0".
        if (isActiveWorkout && (val === undefined || val === null)) {
            if (field === 'reps' || field === 'reps_left' || field === 'reps_right' || field === 'duration' || field === 'distance') {
                const prev = exercise.previousLog?.[index];
                if (prev) {
                    if (field === 'reps' && prev.reps !== undefined && prev.reps !== null) {
                        return prev.reps.toString();
                    }
                    if (field === 'reps_left' && prev.reps_left !== undefined && prev.reps_left !== null) {
                        return prev.reps_left.toString();
                    }
                    if (field === 'reps_right' && prev.reps_right !== undefined && prev.reps_right !== null) {
                        return prev.reps_right.toString();
                    }
                    if (field === 'duration' && prev.duration !== undefined && prev.duration !== null) {
                        return prev.duration.toString();
                    }
                    if (field === 'distance' && prev.distance !== undefined && prev.distance !== null) {
                        return prev.distance.toString();
                    }
                }
                if (exercise.reps !== undefined && exercise.reps !== null && exercise.reps !== 0) {
                    return exercise.reps.toString();
                }
                return '';
            }
        }

        if (val === undefined || val === null) return '';
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
    const localIntervalRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (isLocalTimerRunning) {
            localIntervalRef.current = setInterval(() => {
                if (isLocalPrepping) {
                    setLocalPrepSecs(prev => {
                        if (prev <= 1) {
                            setIsLocalPrepping(false);
                            const duration = parseInt(durationVal) || 0;
                            setLocalRemainingSecs(duration);
                            Vibration.vibrate(100);
                            if (duration <= 0) {
                                setIsLocalTimerRunning(false);
                                Vibration.vibrate([0, 500, 200, 500]);
                                return 0;
                            }
                            return 0;
                        }
                        Vibration.vibrate(10);
                        return prev - 1;
                    });
                } else {
                    setLocalRemainingSecs(prev => {
                        if (prev <= 1) {
                            setIsLocalTimerRunning(false);
                            Vibration.vibrate([0, 500, 200, 500]);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        } else {
            if (localIntervalRef.current) {
                clearInterval(localIntervalRef.current);
            }
        }
        return () => {
            if (localIntervalRef.current) {
                clearInterval(localIntervalRef.current);
            }
        };
    }, [isLocalTimerRunning, isLocalPrepping, durationVal]);

    const startLocalTimer = () => {
        const duration = parseInt(durationVal) || 0;
        const prep = selectedPrepSec;
        if (duration > 0 || prep > 0) {
            if (prep > 0) {
                setIsLocalPrepping(true);
                setLocalPrepSecs(prep);
                setLocalRemainingSecs(duration);
            } else {
                setIsLocalPrepping(false);
                setLocalRemainingSecs(duration);
            }
            setIsLocalTimerRunning(true);
        }
    };

    const stopLocalTimer = () => {
        setIsLocalTimerRunning(false);
        setIsLocalPrepping(false);
    };

    React.useEffect(() => {
        setSelectedPrepSec(exercisePrepTime || 0);
    }, [exercisePrepTime]);

    const getTextColor = (val: string) => (val === '') ? 'text-light-muted dark:text-dark-muted' : 'text-light dark:text-dark';

    const handleNumericChange = (text: string, currentVal: string, onUpdate: (v: string) => void) => {
        if (text === '' || /^\d*\.?\d*$/.test(text)) {
             onUpdate(text);
        }
    };

    const getPreviousDisplay = () => {
        const prev = exercise.previousLog?.[index];
        if (!prev) return "-";
        
        const parts = [];
        const formatValue = (val: any, fallback = "0") => (val !== undefined && val !== null && val !== '') ? val : fallback;
        // Previous-log weights are stored in lb like everything else — convert
        // to the user's display unit before showing them.
        const formatWeightValue = (val: any, fallback = "0") => {
            if (val === undefined || val === null || val === '') return fallback;
            const num = parseFloat(val);
            if (isNaN(num)) return fallback;
            return roundForDisplay(lbToDisplay(num, unitSystem), unitSystem);
        };

        if (showWeight) {
            if (showBodyweight) {
                const bw = prev.bodyweight ?? (showBodyweight ? latestBodyWeight : undefined);
                const added = prev.weight;
                if (bw != null && added != null && added > 0) {
                    parts.push(`${formatWeightValue(bw)}+${formatWeightValue(added)}`);
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
        <View className="w-full flex-col px-0 py-1 flex-1 justify-around">
            {/* Top Row: Previous and Rest Timer next to each other */}
            <View className="flex-row justify-between w-full px-0 mb-3">
                {/* Previous compact square */}
                <View className="min-w-[80px] h-[72px] items-start justify-center p-1">
                    <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>Previous</Text>
                    <Text className="text-xl font-bold text-light dark:text-dark mt-1" numberOfLines={1}>
                        {getPreviousDisplay() || '-'}
                    </Text>
                </View>

                {/* Rest Timer compact square */}
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

            {/* Weight */}
            {showWeight && (
                <View className="flex-col items-center justify-center py-2">
                    <Text className="text-xs font-bold text-light-muted dark:text-dark-muted mb-2 uppercase tracking-widest">Weight ({weightUnit})</Text>
                    {wheelsReady ? (
                        <HorizontalSelectorWheel
                            value={roundForDisplay(lbToDisplay(parseFloat(getValue('weight')) || 0, unitSystem), unitSystem)}
                            onValueChange={handleWeightChange}
                            values={unitSystem === 'metric' ? WEIGHT_VALUES_KG : WEIGHT_VALUES_LB}
                            itemWidth={WEIGHT_ITEM_WIDTH}
                            unit=""
                        />
                    ) : (
                        <View style={{ height: 56, justifyContent: 'center', alignItems: 'center' }}>
                            {/* Matches the wheel's resting center box so the swap
                                to the live wheel is seamless (only the faded
                                neighbour values slide in). */}
                            <View
                                className="border-l border-r border-primary/20 bg-primary/5 justify-center items-center flex-row"
                                style={{ width: WEIGHT_ITEM_WIDTH, height: 56, borderRadius: 12 }}
                            >
                                <Text className="text-4xl font-black text-light dark:text-dark">
                                    {roundForDisplay(lbToDisplay(parseFloat(getValue('weight')) || 0, unitSystem), unitSystem) || '0'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Reps */}
            {showReps && (
                <View className="flex-col items-center justify-center py-2">
                    <Text className="text-xs font-bold text-light-muted dark:text-dark-muted mb-2 uppercase tracking-widest">Reps</Text>
                    {(() => {
                        // itemWidth = width/3 so the two side gaps each equal
                        // exactly one item slot — the same ratio that makes the
                        // weight wheel show exactly one neighbor per side, not a
                        // fixed constant that happens to work at one width.
                        const repsItemWidth = windowWidth / 3;
                        const placeholder = (field: 'reps' | 'reps_left' | 'reps_right') => (
                            <View style={{ height: 56, justifyContent: 'center', alignItems: 'center' }}>
                                {/* Matches the wheel's resting center box so the
                                    swap to the live wheel is seamless. */}
                                <View
                                    className="border-l border-r border-primary/20 bg-primary/5 justify-center items-center"
                                    style={{ width: repsItemWidth, height: 56, borderRadius: 12 }}
                                >
                                    <Text className="text-4xl font-black text-light dark:text-dark">
                                        {getValue(field) || '0'}
                                    </Text>
                                </View>
                            </View>
                        );

                        if (isUnilateral) {
                            // L and R wheels are stacked, not side by side, so
                            // each spans the full card width — centered exactly
                            // like the weight wheel, not offset by a side label.
                            return (['left', 'right'] as const).map((side) => {
                                const field = side === 'left' ? 'reps_left' : 'reps_right';
                                const label = side === 'left' ? 'Left' : 'Right';
                                const onChange = side === 'left' ? handleRepsLeftChange : handleRepsRightChange;
                                return (
                                    <View key={side} style={{ marginTop: side === 'right' ? 12 : 0, alignItems: 'center' }}>
                                        <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1">
                                            {label}
                                        </Text>
                                        {wheelsReady ? (
                                            <HorizontalSelectorWheel
                                                value={parseInt(getValue(field)) || 0}
                                                onValueChange={onChange}
                                                values={REP_VALUES}
                                                itemWidth={repsItemWidth}
                                                unit=""
                                            />
                                        ) : placeholder(field)}
                                    </View>
                                );
                            });
                        }

                        return wheelsReady ? (
                            <HorizontalSelectorWheel
                                value={parseInt(getValue('reps')) || 0}
                                onValueChange={handleRepsChange}
                                values={REP_VALUES}
                                itemWidth={repsItemWidth}
                                unit=""
                            />
                        ) : placeholder('reps');
                    })()}
                </View>
            )}

            {/* Duration */}
            {showDuration && (
                <View className={`${(showDistance || showRPE) ? 'border-b border-black/5 dark:border-white/5' : ''} flex-col ${rowPadding}`}>
                    {/* Circular Countdown Clock */}
                    {(() => {
                        const clockSize = isSmallScreen ? 240 : 260;
                        const radius = isSmallScreen ? 100 : 110;
                        const strokeWidth = isSmallScreen ? 10 : 14;
                        const center = clockSize / 2;
                        const circumference = 2 * Math.PI * radius;
                        const dashoffset = circumference * (1 - (
                            isLocalTimerRunning
                                ? (isLocalPrepping
                                    ? (selectedPrepSec > 0 ? localPrepSecs / selectedPrepSec : 0)
                                    : ((parseInt(durationVal) || 0) > 0 ? localRemainingSecs / (parseInt(durationVal) || 0) : 0))
                                : 1.0
                        ));

                        return (
                            <View className="w-full items-center justify-center my-0.5">
                                <View style={{ width: clockSize, height: clockSize, justifyContent: 'center', alignItems: 'center' }}>
                                    <Svg width={clockSize} height={clockSize}>
                                        {/* Background Circle */}
                                        <Circle
                                            cx={center}
                                            cy={center}
                                            r={radius}
                                            stroke={theme.bgDark === '#000000' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                            strokeWidth={strokeWidth}
                                            fill="transparent"
                                        />
                                        {/* Foreground Progress Circle */}
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
                                        {isLocalTimerRunning ? (
                                            <>
                                                <Text className="text-light-muted dark:text-dark-muted uppercase tracking-wider text-[11px] font-semibold mb-0.5">
                                                    {isLocalPrepping ? 'Prep' : 'Time'}
                                                </Text>
                                                <Text className={`font-black text-light dark:text-dark text-center ${isSmallScreen ? 'text-5xl' : 'text-6xl'}`}>
                                                    {isLocalPrepping ? `${localPrepSecs}s` : formatSeconds(localRemainingSecs)}
                                                </Text>
                                            </>
                                        ) : wheelsReady ? (
                                            <View style={{ height: 120, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                                                {/* Selection Highlight */}
                                                <View 
                                                    className="absolute left-0 right-0 border-t border-b border-primary/20 bg-primary/5"
                                                    style={{ height: 40, top: 40, borderRadius: 6 }} 
                                                    pointerEvents="none" 
                                                />

                                                <VerticalSelectorWheel
                                                    value={Math.floor((parseInt(durationVal) || 0) / 60)}
                                                    onValueChange={handleDurationMinChange}
                                                    values={INLINE_MIN_VALUES}
                                                    itemHeight={40}
                                                    width={50}
                                                />

                                                {/* Stationary 'm' Label */}
                                                <Text className="text-sm font-bold text-light dark:text-dark mr-0.5" style={{ width: 12 }}>m</Text>

                                                {/* Colon separator */}
                                                <Text className="text-light dark:text-dark font-bold px-1 text-3xl opacity-60">:</Text>

                                                <VerticalSelectorWheel
                                                    value={(parseInt(durationVal) || 0) % 60}
                                                    onValueChange={handleDurationSecChange}
                                                    values={INLINE_SEC_VALUES}
                                                    itemHeight={40}
                                                    width={50}
                                                />

                                                {/* Stationary 's' Label */}
                                                <Text className="text-sm font-bold text-light dark:text-dark" style={{ width: 12 }}>s</Text>
                                            </View>
                                        ) : (
                                            /* Static mirror of the live wheel's resting
                                               state so the swap is seamless — same
                                               highlight band, columns and labels, with
                                               the selected min/sec at the wheel's
                                               selected font size (36). */
                                            <View style={{ height: 120, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                                                <View
                                                    className="absolute left-0 right-0 border-t border-b border-primary/20 bg-primary/5"
                                                    style={{ height: 40, top: 40, borderRadius: 6 }}
                                                    pointerEvents="none"
                                                />
                                                <View style={{ height: 120, width: 50 }} className="items-center justify-center">
                                                    <Text className="font-black text-light dark:text-dark" style={{ fontSize: 36 }}>
                                                        {Math.floor((parseInt(durationVal) || 0) / 60)}
                                                    </Text>
                                                </View>
                                                <Text className="text-sm font-bold text-light dark:text-dark mr-0.5" style={{ width: 12 }}>m</Text>
                                                <Text className="text-light dark:text-dark font-bold px-1 text-3xl opacity-60">:</Text>
                                                <View style={{ height: 120, width: 50 }} className="items-center justify-center">
                                                    <Text className="font-black text-light dark:text-dark" style={{ fontSize: 36 }}>
                                                        {(parseInt(durationVal) || 0) % 60}
                                                    </Text>
                                                </View>
                                                <Text className="text-sm font-bold text-light dark:text-dark" style={{ width: 12 }}>s</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Play/Stop Action Button directly below the clock */}
                                {wheelsReady && (
                                    <TouchableOpacity 
                                        onPress={isLocalTimerRunning ? stopLocalTimer : startLocalTimer}
                                        className={`w-12 h-12 rounded-full items-center justify-center active:opacity-90 mt-2 shadow-sm ${
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
                                )}
                            </View>
                        );
                    })()}

                    {/* Bottom Row: Prep and RPE next to each other */}
                    <View className="flex-row justify-between w-full px-0 mt-3">
                        {/* Prep Timer inline selector */}
                        <View className="items-start justify-center p-1">
                            <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted mb-1.5 uppercase tracking-widest">Prep</Text>
                            <View className="flex-row bg-black/10 dark:bg-white/10 rounded-2xl p-0.5">
                                {[0, 3, 5, 10].map((val) => (
                                    <Pressable
                                        key={val}
                                        onPress={() => {
                                            setSelectedPrepSec(val);
                                            onUpdatePrepTime?.(val);
                                        }}
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 14,
                                            backgroundColor: selectedPrepSec === val
                                                ? (colorScheme === 'dark' ? '#2c2c2e' : '#fff')
                                                : 'transparent',
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 13,
                                            fontWeight: '700',
                                            color: selectedPrepSec === val ? '#f97316' : colorScheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                                        }}>
                                            {val === 0 ? 'None' : `${val}s`}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* RPE compact square */}
                        {showRPE ? (
                            <TouchableOpacity 
                                onPress={() => onPressRPE?.(index, getValue('rpe'))}
                                className="min-w-[80px] h-[72px] items-end justify-center p-1 active:opacity-75"
                            >
                                <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted" numberOfLines={1}>RPE</Text>
                                <Text className={`text-xl font-bold mt-1 ${getTextColor(getValue('rpe'))}`} numberOfLines={1}>
                                    {getValue('rpe') || '-'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="min-w-[80px] h-[72px]" />
                        )}
                    </View>
                </View>
            )}

            {/* Distance */}
            {showDistance && (
                <View className={`flex-row justify-between items-center border-b border-black/5 dark:border-white/5 ${rowPadding}`}>
                    <Text className="text-sm font-semibold text-light-muted dark:text-dark-muted">Distance</Text>
                    <TextInput 
                        className={`w-24 bg-black/5 dark:bg-white/5 rounded-lg px-3 py-1.5 text-right text-sm font-bold ${getTextColor(getValue('distance'))}`}
                        value={getValue('distance')}
                        onChangeText={(t: string) => handleNumericChange(t, getValue('distance'), (v) => onUpdateSetTarget?.(index, 'distance', v))}
                        keyboardType="numeric" 
                        placeholder="-"
                        placeholderTextColor={theme.placeholder || '#888'}
                        selectTextOnFocus
                    />
                </View>
            )}

            {/* RPE */}
            {showRPE && !showDuration && (
                <View className="flex-row justify-end w-full px-0 mt-3">
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

            <DurationTimerPicker 
                visible={isDurationPickerVisible}
                onClose={() => {
                    setIsDurationPickerVisible(false);
                    setDurationAutoStart(false);
                }}
                initialValue={parseInt(getValue('duration')) || 0}
                onSave={(val) => {
                    onUpdateSetTarget?.(index, 'duration', val.toString());
                }}
                isActiveWorkout={isActiveWorkout}
                autoStart={durationAutoStart}
                prepTime={exercisePrepTime}
                onPrepTimeChange={onUpdatePrepTime}
            />
        </View>
    );
}
