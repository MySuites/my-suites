import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent, Vibration, StyleSheet } from 'react-native';
import { IconSymbol, useUITheme, RaisedCard } from '@mysuite/ui';
import { formatSeconds } from '../../utils/formatting';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MIN_VALUES = Array.from({ length: 15 }, (_, i) => i);
const SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);

interface DurationTimerPickerProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number;
    onSave: (value: number) => void;
    isActiveWorkout?: boolean;
    autoStart?: boolean;
}

export function DurationTimerPicker({ visible, onClose, initialValue, onSave, isActiveWorkout = false, autoStart = false }: DurationTimerPickerProps) {
    const theme = useUITheme();
    
    const [selectedMin, setSelectedMin] = useState(Math.floor(initialValue / 60));
    const [selectedSec, setSelectedSec] = useState(initialValue % 60);
    
    // Timer state
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(initialValue);
    const [prepTime, setPrepTime] = useState(0);
    const [isPrepping, setIsPrepping] = useState(false);
    const [prepRemaining, setPrepRemaining] = useState(0);
    const timerIntervalRef = useRef<any>(null);
    
    const minListRef = useRef<FlatList>(null);
    const secListRef = useRef<FlatList>(null);

    // Pad values for centering
    const minData = [null, null, ...MIN_VALUES, null, null];
    const secData = [null, null, ...SEC_VALUES, null, null];

    useEffect(() => {
        if (visible) {
            const m = Math.floor(initialValue / 60);
            const s = initialValue % 60;
            setSelectedMin(m);
            setSelectedSec(s);
            setRemainingSeconds(initialValue);
            setIsTimerRunning(false);
            setIsPrepping(false);
            
            // Scroll after delay
            setTimeout(() => {
                const mIdx = MIN_VALUES.indexOf(m);
                const sIdx = SEC_VALUES.indexOf(s);
                
                if (mIdx !== -1 && minListRef.current) {
                    minListRef.current.scrollToOffset({ 
                        offset: mIdx * ITEM_HEIGHT, 
                        animated: false 
                    });
                }
                if (sIdx !== -1 && secListRef.current) {
                    secListRef.current.scrollToOffset({ 
                        offset: sIdx * ITEM_HEIGHT, 
                        animated: false 
                    });
                }
            }, 100);
        }
    }, [visible, initialValue]);

    useEffect(() => {
        if (visible && autoStart && initialValue > 0) {
            handleStartTimer();
        }
    }, [visible, autoStart, initialValue]);

    const handleStartTimer = () => {
        if (prepTime > 0) {
            setIsPrepping(true);
            setPrepRemaining(prepTime);
        } else {
            setIsPrepping(false);
        }
        setIsTimerRunning(true);
    };

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

    const handleMinScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const index = Math.round(offset / ITEM_HEIGHT);
        if (index >= 0 && index < MIN_VALUES.length) {
            const newMin = MIN_VALUES[index];
            setSelectedMin(newMin);
            if (!isTimerRunning) {
                setRemainingSeconds(newMin * 60 + selectedSec);
            }
        }
    };

    const handleSecScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const index = Math.round(offset / ITEM_HEIGHT);
        if (index >= 0 && index < SEC_VALUES.length) {
            const newSec = SEC_VALUES[index];
            setSelectedSec(newSec);
            if (!isTimerRunning) {
                setRemainingSeconds(selectedMin * 60 + newSec);
            }
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
                            <View className="items-center justify-center">
                                <Text className="text-[64px] font-black text-primary dark:text-primary-dark mb-2">
                                    {isPrepping ? prepRemaining : formatSeconds(remainingSeconds)}
                                </Text>
                                <Text className="text-xl font-bold text-light-muted dark:text-dark-muted tracking-widest">
                                    {isPrepping ? 'READY...' : 'GO!'}
                                </Text>
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
                                            <FlatList
                                                ref={minListRef}
                                                data={minData}
                                                keyExtractor={(_, i) => `m-${i}`}
                                                showsVerticalScrollIndicator={false}
                                                snapToInterval={ITEM_HEIGHT}
                                                snapToAlignment="start"
                                                decelerationRate="fast"
                                                onScroll={handleMinScroll}
                                                onMomentumScrollEnd={handleMinScroll}
                                                scrollEventThrottle={16}
                                                renderItem={({ item }) => (
                                                    <View style={{ height: ITEM_HEIGHT }} className="items-center justify-center flex-row">
                                                        {item !== null && (
                                                            <>
                                                                <Text className={`text-2xl font-bold ${item === selectedMin ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
                                                                    {item}
                                                                </Text>
                                                                <Text className={`text-sm font-bold ml-1 ${item === selectedMin ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
                                                                    min
                                                                </Text>
                                                            </>
                                                        )}
                                                    </View>
                                                )}
                                            />
                                        </View>
                                    </View>

                                    {/* Seconds Wheel */}
                                    <View className="flex-1 items-start pl-4">
                                        <View style={{ height: WHEEL_HEIGHT, width: 80 }}>
                                            <FlatList
                                                ref={secListRef}
                                                data={secData}
                                                keyExtractor={(_, i) => `s-${i}`}
                                                showsVerticalScrollIndicator={false}
                                                snapToInterval={ITEM_HEIGHT}
                                                snapToAlignment="start"
                                                decelerationRate="fast"
                                                onScroll={handleSecScroll}
                                                onMomentumScrollEnd={handleSecScroll}
                                                scrollEventThrottle={16}
                                                renderItem={({ item }) => (
                                                    <View style={{ height: ITEM_HEIGHT }} className="items-center justify-center flex-row">
                                                        {item !== null && (
                                                            <>
                                                                <Text className={`text-2xl font-bold ${item === selectedSec ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
                                                                    {item}
                                                                </Text>
                                                                <Text className={`text-sm font-bold ml-1 ${item === selectedSec ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
                                                                    sec
                                                                </Text>
                                                            </>
                                                        )}
                                                    </View>
                                                )}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Prep Time Selector */}
                                <View className="mt-8 items-center">
                                    <Text className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-3">Prep Countdown</Text>
                                    <View className="flex-row bg-black/5 dark:bg-white/5 rounded-xl p-1">
                                        {[0, 3, 5, 10].map((s) => (
                                            <TouchableOpacity 
                                                key={s}
                                                onPress={() => setPrepTime(s)}
                                                className={`px-4 py-2 rounded-lg ${prepTime === s ? 'bg-white dark:bg-black/20' : 'bg-transparent'}`}
                                            >
                                                <Text className={`text-sm font-bold ${prepTime === s ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted'}`}>
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
