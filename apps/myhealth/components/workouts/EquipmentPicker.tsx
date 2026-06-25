import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { IconSymbol, useUITheme } from '@mysuite/ui';
import DefaultExercises from '../../assets/data/default-exercises';

// Equipment options shown for any exercise that has an equipment field
export const EQUIPMENT_OPTIONS = [
    { value: 'barbell',    label: 'Barbell',    icon: 'dumbbell.fill' as const },
    { value: 'dumbbell',   label: 'Dumbbell',   icon: 'dumbbell.fill' as const },
    { value: 'cable',      label: 'Cable',      icon: 'dumbbell.fill' as const },
    { value: 'machine',    label: 'Machine',    icon: 'dumbbell.fill' as const },
    { value: 'none',       label: 'None',       icon: 'dumbbell.fill' as const },
    { value: 'other',      label: 'Other',      icon: 'dumbbell.fill' as const },
];

export const ALL_EQUIPMENT_OPTIONS = [
    { value: 'barbell',          label: 'Barbell',          icon: 'dumbbell.fill' as const },
    { value: 'dumbbell',         label: 'Dumbbell',         icon: 'dumbbell.fill' as const },
    { value: 'cable',            label: 'Cable',            icon: 'dumbbell.fill' as const },
    { value: 'machine',          label: 'Machine',          icon: 'dumbbell.fill' as const },
    { value: 'smith machine',    label: 'Smith Machine',    icon: 'dumbbell.fill' as const },
    { value: 'hack machine',     label: 'Hack Machine',     icon: 'dumbbell.fill' as const },
    { value: 'pendulum machine', label: 'Pendulum Machine', icon: 'dumbbell.fill' as const },
    { value: 'none',             label: 'None',             icon: 'dumbbell.fill' as const },
    { value: 'other',            label: 'Other',            icon: 'dumbbell.fill' as const },
];

interface EquipmentPickerProps {
    visible: boolean;
    exerciseId?: string;
    currentEquipment?: string;
    onClose: () => void;
    onSelect: (equipment: string) => void;
}

export function EquipmentPicker({ visible, exerciseId, currentEquipment, onClose, onSelect }: EquipmentPickerProps) {
    const theme = useUITheme();
    
    const defaultExercise = DefaultExercises.find(e => e.id === exerciseId) as any;
    const options = (defaultExercise && Array.isArray(defaultExercise.equipment))
        ? ALL_EQUIPMENT_OPTIONS.filter(opt => defaultExercise.equipment.includes(opt.value))
        : EQUIPMENT_OPTIONS;

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
                                Select Equipment
                            </Text>
                            <TouchableOpacity onPress={onClose} className="p-2">
                                <IconSymbol name="xmark" size={20} color={theme.textMuted || '#888'} />
                            </TouchableOpacity>
                        </View>

                        {/* Options */}
                        <View className="px-4 gap-2">
                            {options.map((opt) => {
                                const isSelected = currentEquipment?.toLowerCase() === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => {
                                            onSelect(opt.value);
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
                                                name={opt.icon as any}
                                                size={16}
                                                color={isSelected ? '#ffffff' : (theme.textMuted || '#888')}
                                            />
                                            <Text
                                                className={`font-semibold text-base ${
                                                    isSelected ? 'text-white' : 'text-light dark:text-dark'
                                                }`}
                                            >
                                                {opt.label}
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
