import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { VerticalSelectorWheel } from './VerticalSelectorWheel';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MIN_VALUES = Array.from({ length: 6 }, (_, i) => i);
const SEC_VALUES = Array.from({ length: 12 }, (_, i) => i * 5);

interface RestTimerPickerProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number;
    onSave: (value: number) => void;
    isHapticsEnabled?: boolean;
}

function renderTimeItem(item: number, isSelected: boolean) {
    return (
        <Text className={`text-2xl font-bold ${isSelected ? 'text-primary dark:text-primary-dark' : 'text-light-muted dark:text-dark-muted opacity-40'}`}>
            {item.toString().padStart(2, '0')}
        </Text>
    );
}

export function RestTimerPicker({ visible, onClose, initialValue, onSave, isHapticsEnabled = true }: RestTimerPickerProps) {
    const theme = useUITheme();
    const [selectedMin, setSelectedMin] = useState(Math.floor(initialValue / 60));
    const [selectedSec, setSelectedSec] = useState(Math.floor((initialValue % 60) / 5) * 5);

    useEffect(() => {
        if (visible) {
            setSelectedMin(Math.floor(initialValue / 60));
            setSelectedSec(Math.floor((initialValue % 60) / 5) * 5);
        }
    }, [visible, initialValue]);

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
                        <Text className="text-xl font-bold text-light dark:text-dark">Set Rest Time</Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <IconSymbol name="xmark" size={24} color={theme.textMuted || '#888'} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: WHEEL_HEIGHT }} className="relative flex-row items-center justify-center mb-8">
                        {/* Global Centering Highlight */}
                        <View
                            className="absolute left-0 right-0 border-t border-b border-primary/20 bg-primary/5"
                            style={{ height: ITEM_HEIGHT, top: ITEM_HEIGHT * 2, borderRadius: 12 }}
                            pointerEvents="none"
                        />

                        {/* Minutes Wheel */}
                        <View className="flex-1 items-end pr-2">
                            <View style={{ height: WHEEL_HEIGHT, width: 80 }}>
                                <VerticalSelectorWheel
                                    value={selectedMin}
                                    onValueChange={setSelectedMin}
                                    values={MIN_VALUES}
                                    itemHeight={ITEM_HEIGHT}
                                    width={80}
                                    visibleItems={VISIBLE_ITEMS}
                                    renderItem={renderTimeItem}
                                    isHapticsEnabled={isHapticsEnabled}
                                />
                            </View>
                        </View>

                        <Text className="text-2xl font-bold text-light dark:text-dark px-1">:</Text>

                        {/* Seconds Wheel */}
                        <View className="flex-1 items-start pl-2">
                            <View style={{ height: WHEEL_HEIGHT, width: 80 }}>
                                <VerticalSelectorWheel
                                    value={selectedSec}
                                    onValueChange={setSelectedSec}
                                    values={SEC_VALUES}
                                    itemHeight={ITEM_HEIGHT}
                                    width={80}
                                    visibleItems={VISIBLE_ITEMS}
                                    renderItem={renderTimeItem}
                                    isHapticsEnabled={isHapticsEnabled}
                                />
                            </View>
                        </View>
                    </View>

                    <RaisedCard
                        onPress={() => onSave((selectedMin * 60) + selectedSec)}
                        className="py-3 px-6 bg-primary items-center justify-center"
                        style={{ backgroundColor: theme.primary, borderRadius: 9999 }}
                    >
                        <Text className="text-white text-lg font-bold">Save Duration</Text>
                    </RaisedCard>
                </View>
            </View>
        </Modal>
    );
}
