import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { IconSymbol, useUITheme } from '@mysuite/ui';

export const ATTACHMENT_OPTIONS: Record<string, string[]> = {
    lat_pulldown: ['Lat Bar', 'Wide-Grip Bar', 'Close-Grip V-Bar', 'Neutral-Grip Handles'],
    seated_cable_row: ['Close-Grip V-Bar', 'Wide-Grip Bar', 'Neutral-Grip Handles', 'Straight Bar'],
};

interface AttachmentPickerProps {
    visible: boolean;
    exerciseId: string;
    currentAttachment?: string;
    onClose: () => void;
    onSelect: (attachment: string) => void;
}

export function AttachmentPicker({ visible, exerciseId, currentAttachment, onClose, onSelect }: AttachmentPickerProps) {
    const theme = useUITheme();
    const options = ATTACHMENT_OPTIONS[exerciseId] || [];

    if (options.length === 0) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 justify-end"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View className="bg-light dark:bg-dark-lighter rounded-t-3xl pb-10">
                        {/* Handle bar */}
                        <View className="items-center pt-3 pb-2">
                            <View
                                className="rounded-full bg-black/10 dark:bg-white/10"
                                style={{ width: 36, height: 4 }}
                            />
                        </View>

                        {/* Header */}
                        <View className="flex-row items-center justify-between px-6 pt-2 pb-5">
                            <Text className="text-xl font-bold text-light dark:text-dark">
                                Select Attachment
                            </Text>
                            <TouchableOpacity onPress={onClose} className="p-2">
                                <IconSymbol name="xmark" size={20} color={theme.textMuted || '#888'} />
                            </TouchableOpacity>
                        </View>

                        {/* Options */}
                        <View className="px-4 gap-2">
                            {options.map((opt) => {
                                const isSelected = currentAttachment === opt;
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => {
                                            onSelect(opt);
                                            onClose();
                                        }}
                                        className={`flex-row items-center justify-between p-4 rounded-2xl ${
                                            isSelected
                                                ? 'bg-primary dark:bg-primary-dark'
                                                : 'bg-black/5 dark:bg-white/5'
                                        }`}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <IconSymbol
                                                name="gearshape.fill"
                                                size={16}
                                                color={isSelected ? '#ffffff' : (theme.textMuted || '#888')}
                                            />
                                            <Text
                                                className={`font-semibold text-base ${
                                                    isSelected ? 'text-white' : 'text-light dark:text-dark'
                                                }`}
                                            >
                                                {opt}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <IconSymbol name="checkmark" size={18} color="#ffffff" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
