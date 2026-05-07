import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Hardcoded values to simplify selection based on user preference
const VALUES = [1, 4, 6, 7, 8, 8.5, 9, 9.5, 10];

interface RPEPickerProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number | string | undefined;
    onSave: (value: number) => void;
}

export function RPEPicker({ visible, onClose, initialValue, onSave }: RPEPickerProps) {
    const theme = useUITheme();
    
    // Safely parse initial value which can be string or number
    const getParsedValue = (val: any) => {
        if (val === undefined || val === null || val === '') return undefined;
        const parsed = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(parsed) ? undefined : parsed;
    };

    const parsedInitialValue = getParsedValue(initialValue);
    const [selectedValue, setSelectedValue] = useState(parsedInitialValue ?? 8.0);
    const flatListRef = useRef<FlatList>(null);

    // Pad values for centering
    const data = [null, null, ...VALUES, null, null];

    useEffect(() => {
        if (visible) {
            let startVal = getParsedValue(initialValue) ?? 8.0;
            
            // If the start value isn't in our reduced options, snap to the nearest one
            const exactIndex = VALUES.findIndex(v => Math.abs(v - startVal) < 0.1);
            if (exactIndex === -1) {
                let nearest = VALUES[0];
                let minDiff = Math.abs(VALUES[0] - startVal);
                for (let i = 1; i < VALUES.length; i++) {
                    const diff = Math.abs(VALUES[i] - startVal);
                    if (diff < minDiff) {
                        minDiff = diff;
                        nearest = VALUES[i];
                    }
                }
                startVal = nearest;
            }

            setSelectedValue(startVal);
            
            // Use a slightly longer delay to ensure the Modal is fully visible and Layout is done
            const timer = setTimeout(() => {
                const index = VALUES.findIndex(v => Math.abs(v - startVal) < 0.1);
                
                if (index !== -1 && flatListRef.current) {
                    flatListRef.current.scrollToIndex({ 
                        index: index, 
                        animated: false 
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [visible, initialValue]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const index = Math.round(offset / ITEM_HEIGHT);
        if (index >= 0 && index < VALUES.length) {
            setSelectedValue(VALUES[index]);
        }
    };

    const initialIndex = VALUES.findIndex(v => Math.abs(v - (getParsedValue(initialValue) ?? 8.0)) < 0.1);

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

                    <View style={{ height: WHEEL_HEIGHT, overflow: 'hidden' }} className="relative justify-center px-4">
                        {/* Highlights */}
                        <View 
                            className="absolute left-0 right-0 border-t border-b border-primary/20 bg-primary/5"
                            style={{ height: ITEM_HEIGHT, top: ITEM_HEIGHT * 2 }} 
                            pointerEvents="none"
                        />
                        
                        <FlatList
                            ref={flatListRef}
                            data={data}
                            keyExtractor={(_, i) => i.toString()}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            snapToAlignment="start"
                            decelerationRate="fast"
                            // Use a key to force re-render when visible changes to ensure initialScrollIndex works better
                            key={visible ? 'visible' : 'hidden'}
                            initialScrollIndex={initialIndex !== -1 ? initialIndex : undefined}
                            getItemLayout={(_, index) => ({
                                length: ITEM_HEIGHT,
                                offset: ITEM_HEIGHT * index,
                                index,
                            })}
                            onMomentumScrollEnd={handleScroll}
                            onScrollEndDrag={handleScroll}
                            scrollEventThrottle={16}
                            renderItem={({ item, index }) => {
                                if (item === null) return <View style={{ height: ITEM_HEIGHT }} />;
                                
                                const isSelected = item === selectedValue;
                                return (
                                    <View 
                                        style={{ height: ITEM_HEIGHT }} 
                                        className="items-center justify-center"
                                    >
                                        <Text className={`text-2xl font-bold ${
                                            isSelected 
                                                ? 'text-primary dark:text-primary-dark' 
                                                : 'text-light-muted dark:text-dark-muted opacity-40'
                                        }`}>
                                            {item % 1 === 0 ? item.toString() : item.toFixed(1)}
                                        </Text>
                                    </View>
                                );
                            }}
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
