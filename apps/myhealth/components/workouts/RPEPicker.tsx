import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';
import { VerticalSelectorWheel } from './VerticalSelectorWheel';

const ITEM_HEIGHT = 50;

// Hardcoded values to simplify selection based on user preference
const VALUES = [1, 6, 7, 8, 8.5, 9, 9.5, 10];

interface RPEPickerProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number | string | undefined;
    onSave: (value: number) => void;
}

// Safely parse initial value which can be string or number
function getParsedValue(val: number | string | undefined) {
    if (val === undefined || val === null || val === '') return undefined;
    const parsed = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(parsed) ? undefined : parsed;
}

// If the value isn't one of our reduced options, snap to the nearest one
function snapToNearest(val: number) {
    if (VALUES.includes(val)) return val;
    return VALUES.reduce((nearest, v) => (
        Math.abs(v - val) < Math.abs(nearest - val) ? v : nearest
    ), VALUES[0]);
}

export function RPEPicker({ visible, onClose, initialValue, onSave }: RPEPickerProps) {
    const theme = useUITheme();

    const [selectedValue, setSelectedValue] = useState(snapToNearest(getParsedValue(initialValue) ?? 8.0));

    useEffect(() => {
        if (visible) {
            setSelectedValue(snapToNearest(getParsedValue(initialValue) ?? 8.0));
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
                        <Text className="text-xl font-bold text-light dark:text-dark">Select RPE</Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <IconSymbol name="xmark" size={24} color={theme.textMuted || '#888'} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: ITEM_HEIGHT * 5 }} className="relative items-center justify-center">
                        {/* Highlight */}
                        <View
                            className="absolute left-4 right-4 border-t border-b border-primary/20 bg-primary/5"
                            style={{ height: ITEM_HEIGHT }}
                            pointerEvents="none"
                        />

                        <VerticalSelectorWheel
                            value={selectedValue}
                            onValueChange={setSelectedValue}
                            values={VALUES}
                            itemHeight={ITEM_HEIGHT}
                            width={200}
                            visibleItems={5}
                            renderItem={(item, isSelected) => (
                                <Text className={`text-2xl font-bold ${
                                    isSelected
                                        ? 'text-primary dark:text-primary-dark'
                                        : 'text-light-muted dark:text-dark-muted opacity-40'
                                }`}>
                                    {item % 1 === 0 ? item.toString() : item.toFixed(1)}
                                </Text>
                            )}
                        />
                    </View>

                    <View className="mt-8 flex-row items-center justify-center gap-2 mb-4">
                        <Text className="text-light-muted dark:text-dark-muted text-sm text-center italic">
                            {(() => {
                                if (selectedValue === 1) return 'Very light';
                                if (selectedValue === 4) return '8–10 Reps/Secs in Reserve';

                                const rir = 10 - selectedValue;
                                if (rir === 0) return 'Maximum Effort (0 RIR)';
                                if (rir % 1 === 0.5) return `Maybe ${Math.ceil(rir)} Reps/Secs in Reserve`;
                                return `${rir} ${rir === 1 ? 'Rep/Sec' : 'Reps/Secs'} in Reserve`;
                            })()}
                        </Text>
                    </View>

                    <RaisedCard
                        onPress={() => onSave(selectedValue)}
                        className="py-3 px-6 bg-primary items-center justify-center"
                        style={{ backgroundColor: theme.primary, borderRadius: 9999 }}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-white text-lg font-bold">Save RPE</Text>
                        </View>
                    </RaisedCard>
                </View>
            </View>
        </Modal>
    );
}
