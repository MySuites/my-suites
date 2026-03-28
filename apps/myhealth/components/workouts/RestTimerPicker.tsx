import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Generate values from 0 to 300 in steps of 5
const VALUES = Array.from({ length: 61 }, (_, i) => i * 5);

interface RestTimerPickerProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number;
    onSave: (value: number) => void;
}

export function RestTimerPicker({ visible, onClose, initialValue, onSave }: RestTimerPickerProps) {
    const theme = useUITheme();
    const [selectedValue, setSelectedValue] = useState(initialValue);
    const flatListRef = useRef<FlatList>(null);

    // Pad values for centering
    const data = [null, null, ...VALUES, null, null];

    useEffect(() => {
        if (visible) {
            setSelectedValue(initialValue);
            // Scroll to initial value after a short delay
            setTimeout(() => {
                const index = VALUES.indexOf(initialValue);
                if (index !== -1 && flatListRef.current) {
                    flatListRef.current.scrollToOffset({ 
                        offset: index * ITEM_HEIGHT, 
                        animated: false 
                    });
                }
            }, 100);
        }
    }, [visible, initialValue]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const index = Math.round(offset / ITEM_HEIGHT);
        if (index >= 0 && index < VALUES.length) {
            setSelectedValue(VALUES[index]);
        }
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
                        <Text className="text-xl font-bold text-light dark:text-dark">Set Rest Time</Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <IconSymbol name="xmark" size={24} color={theme.textMuted || '#888'} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: WHEEL_HEIGHT, overflow: 'hidden' }} className="relative justify-center">
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
                            onScroll={handleScroll}
                            onMomentumScrollEnd={handleScroll}
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
                                            {item}s
                                        </Text>
                                    </View>
                                );
                            }}
                        />
                    </View>

                    <RaisedCard 
                        onPress={() => onSave(selectedValue)}
                        className="py-3 px-6 bg-primary items-center justify-center"
                        style={{ backgroundColor: theme.primary, borderRadius: 9999 }}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-white text-lg font-bold">Save Duration</Text>
                        </View>
                    </RaisedCard>
                </View>
            </View>
        </Modal>
    );
}
