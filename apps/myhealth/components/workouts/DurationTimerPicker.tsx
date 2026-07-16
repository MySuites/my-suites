import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Vibration } from 'react-native';
import { IconSymbol, useUITheme, RaisedCard } from '@mysuite/ui';
import Svg, { Circle } from 'react-native-svg';
import { formatSeconds } from '../../utils/formatting';
import { VerticalSelectorWheel } from './VerticalSelectorWheel';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MIN_VALUES = Array.from({ length: 15 }, (_, i) => i);
const SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);

function renderUnitItem(unit: string) {
    return (item: number, isSelected: boolean) => (
        <>
            <Text className={`text-2xl font-bold ${isSelected ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
                {item}
            </Text>
            <Text className={`text-sm font-bold ml-1 ${isSelected ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
                {unit}
            </Text>
        </>
    );
}

const renderMinItem = renderUnitItem('min');
const renderSecItem = renderUnitItem('sec');

interface DurationTimerPickerProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number;
    onSave: (value: number) => void;
    isActiveWorkout?: boolean;
    autoStart?: boolean;
    /** Per-exercise prep countdown in seconds. Defaults to 0 (no prep). */
    prepTime?: number;
    /** Called when the user changes the prep countdown for this exercise. */
    onPrepTimeChange?: (value: number) => void;
}

export function DurationTimerPicker({ visible, onClose, initialValue, onSave, isActiveWorkout = false, autoStart = false, prepTime = 0, onPrepTimeChange }: DurationTimerPickerProps) {
    const theme = useUITheme();
    
    const [selectedMin, setSelectedMin] = useState(Math.floor(initialValue / 60));
    const [selectedSec, setSelectedSec] = useState(initialValue % 60);
    
    // Timer state
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(initialValue);
    const [localPrepTime, setLocalPrepTime] = useState(prepTime);
    const [isPrepping, setIsPrepping] = useState(false);
    const [prepRemaining, setPrepRemaining] = useState(0);
    const timerIntervalRef = useRef<any>(null);

    const totalDuration = (selectedMin * 60) + selectedSec;
    const progress = isPrepping
        ? (localPrepTime > 0 ? prepRemaining / localPrepTime : 0)
        : (totalDuration > 0 ? remainingSeconds / totalDuration : 0);

    const radius = 95;
    const strokeWidth = 10;
    const size = 220;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        if (visible) {
            const m = Math.floor(initialValue / 60);
            const s = initialValue % 60;
            setSelectedMin(m);
            setSelectedSec(s);
            setRemainingSeconds(initialValue);
            setLocalPrepTime(prepTime);
            
            if (autoStart && (initialValue > 0 || prepTime > 0)) {
                if (prepTime > 0) {
                    setIsPrepping(true);
                    setPrepRemaining(prepTime);
                } else {
                    setIsPrepping(false);
                }
                setIsTimerRunning(true);
            } else {
                setIsTimerRunning(false);
                setIsPrepping(false);
            }
        }
    }, [visible, initialValue, prepTime, autoStart]);



    useEffect(() => {
        if (isTimerRunning) {
            timerIntervalRef.current = setInterval(() => {
                if (isPrepping) {
                    setPrepRemaining(prev => {
                        if (prev <= 1) {
                            setIsPrepping(false);
                            Vibration.vibrate(100);
                            return 0;
                        }
                        Vibration.vibrate(10);
                        return prev - 1;
                    });
                } else {
                    setRemainingSeconds(prev => {
                        if (prev <= 1) {
                            setIsTimerRunning(false);
                            Vibration.vibrate([0, 500, 200, 500]);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        }
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isTimerRunning, isPrepping]);

    const handleMinChange = (newMin: number) => {
        setSelectedMin(newMin);
        if (!isTimerRunning) {
            setRemainingSeconds(newMin * 60 + selectedSec);
        }
    };

    const handleSecChange = (newSec: number) => {
        setSelectedSec(newSec);
        if (!isTimerRunning) {
            setRemainingSeconds(selectedMin * 60 + newSec);
        }
    };

    const handleSave = () => {
        onSave((selectedMin * 60) + selectedSec);
        onClose();
    };

    const handleStop = () => {
        setIsTimerRunning(false);
        setIsPrepping(false);
        setRemainingSeconds(selectedMin * 60 + selectedSec);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-light dark:bg-dark-lighter rounded-t-3xl p-6 pb-12">
                    <View className="flex-row items-center justify-between mb-8">
                        <Text className="text-xl font-bold text-light dark:text-dark">Duration Timer</Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <IconSymbol name="xmark" size={24} color={theme.textMuted || '#888'} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: WHEEL_HEIGHT + 100 }} className="items-center justify-center mb-8">
                        {isTimerRunning ? (
                            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                                <Svg width={size} height={size}>
                                    {/* Background Circle */}
                                    <Circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={theme.bgDark === '#000000' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                    />
                                    {/* Foreground Progress Circle */}
                                    <Circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={isPrepping ? '#ff9f0a' : theme.primary}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circumference * (1 - progress)}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                    />
                                </Svg>
                                <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text className="text-4xl font-black text-light dark:text-dark">
                                        {isPrepping ? prepRemaining : formatSeconds(remainingSeconds)}
                                    </Text>
                                    <Text className="text-xs font-bold text-light-muted dark:text-dark-muted tracking-widest mt-1 uppercase">
                                        {isPrepping ? 'READY' : 'GO!'}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={{ height: WHEEL_HEIGHT }} className="flex-row items-center justify-center relative w-full px-4">
                                    {/* Selection Highlight */}
                                    <View 
                                        className="absolute left-4 right-4 border-t border-b border-primary/20 bg-primary/5"
                                        style={{ height: ITEM_HEIGHT, top: ITEM_HEIGHT * 2, borderRadius: 12 }} 
                                        pointerEvents="none" 
                                    />

                                    {/* Minutes Wheel */}
                                    <View className="flex-1 items-end pr-4">
                                        <View style={{ height: WHEEL_HEIGHT, width: 80 }}>
                                            <VerticalSelectorWheel
                                                value={selectedMin}
                                                onValueChange={handleMinChange}
                                                values={MIN_VALUES}
                                                itemHeight={ITEM_HEIGHT}
                                                width={80}
                                                visibleItems={VISIBLE_ITEMS}
                                                renderItem={renderMinItem}
                                            />
                                        </View>
                                    </View>

                                    {/* Seconds Wheel */}
                                    <View className="flex-1 items-start pl-4">
                                        <View style={{ height: WHEEL_HEIGHT, width: 80 }}>
                                            <VerticalSelectorWheel
                                                value={selectedSec}
                                                onValueChange={handleSecChange}
                                                values={SEC_VALUES}
                                                itemHeight={ITEM_HEIGHT}
                                                width={80}
                                                visibleItems={VISIBLE_ITEMS}
                                                renderItem={renderSecItem}
                                            />
                                        </View>
                                    </View>
                                </View>

                                 {/* Prep Time Selector */}
                                 <View className="mt-8 items-center">
                                     <Text className="text-[11px] font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-3">Prep Countdown</Text>
                                     <View className="flex-row bg-black/10 dark:bg-white/10 rounded-2xl p-1">
                                         {[0, 3, 5, 10].map((s) => (
                                             <TouchableOpacity 
                                                 key={s}
                                                 onPress={() => {
                                                     setLocalPrepTime(s);
                                                     onPrepTimeChange?.(s);
                                                 }}
                                                 className={`px-6 py-2.5 rounded-xl ${localPrepTime === s ? 'bg-white dark:bg-dark shadow-sm' : 'bg-transparent'}`}
                                             >
                                                 <Text className={`text-sm font-extrabold ${localPrepTime === s ? 'text-primary dark:text-primary-dark' : 'text-light-muted/60 dark:text-dark-muted/60'}`}>
                                                     {s === 0 ? 'None' : `${s}s`}
                                                 </Text>
                                             </TouchableOpacity>
                                         ))}
                                     </View>
                                 </View>
                            </>
                        )}
                    </View>

                    <View className="flex-row gap-4">
                        {isTimerRunning ? (
                            <TouchableOpacity onPress={handleStop} className="flex-1 bg-danger py-4 rounded-2xl items-center justify-center">
                                <Text className="text-white text-lg font-bold">Stop Timer</Text>
                            </TouchableOpacity>
                        ) : (
                            <RaisedCard 
                                onPress={handleSave}
                                className="flex-1 py-4 bg-primary items-center justify-center"
                                style={{ backgroundColor: theme.primary, borderRadius: 16 }}
                            >
                                <Text className="text-white text-lg font-bold">Save & Close</Text>
                            </RaisedCard>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
