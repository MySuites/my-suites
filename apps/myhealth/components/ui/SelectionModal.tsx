import React from 'react';
import { View, Modal, TouchableOpacity, FlatList } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './icon-symbol';
import { useUITheme } from '@mycsuite/ui';

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: any[];
    onSelect: (item: any) => void;
    isSelected: (item: any) => boolean;
    multiSelect?: boolean;
}

export const SelectionModal = ({
    visible,
    onClose,
    title,
    items,
    onSelect,
    isSelected,
    multiSelect = false
}: SelectionModalProps) => {
    const theme = useUITheme();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ThemedView className="flex-1">
                <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <ThemedText type="link">Done</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="subtitle">{title}</ThemedText>
                    <View style={{ width: 50 }} />
                </View>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.value || item.id}
                    renderItem={({ item }) => {
                        const selected = isSelected(item);
                        return (
                            <TouchableOpacity 
                                className={`flex-row items-center justify-between p-4 border-b border-surface dark:border-white/5 ${selected ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                                onPress={() => {
                                    onSelect(item);
                                    if (!multiSelect) onClose();
                                }}
                            >
                                <ThemedText type="defaultSemiBold">{item.label || item.name}</ThemedText>
                                {selected && <IconSymbol name="checkmark" size={20} color={theme.primary} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            </ThemedView>
        </Modal>
    );
};
