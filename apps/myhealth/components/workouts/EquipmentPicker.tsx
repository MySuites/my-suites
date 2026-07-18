import React from 'react';
import { BottomSheetOptionPicker } from '../ui/BottomSheetOptionPicker';
import DefaultExercises from '../../assets/data/default-exercises';

// Equipment options shown for any exercise that has an equipment field
export const EQUIPMENT_OPTIONS = [
    { value: 'barbell',    label: 'Barbell',    icon: 'dumbbell.fill' as const },
    { value: 'dumbbell',   label: 'Dumbbell',   icon: 'dumbbell.fill' as const },
    { value: 'cable',      label: 'Cable',      icon: 'dumbbell.fill' as const },
    { value: 'machine',    label: 'Machine',    icon: 'dumbbell.fill' as const },
    { value: 'parallettes', label: 'Parallettes', icon: 'dumbbell.fill' as const },
    { value: 'pull up bar', label: 'Pull Up Bar', icon: 'dumbbell.fill' as const },
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
    { value: 'parallettes',       label: 'Parallettes',       icon: 'dumbbell.fill' as const },
    { value: 'pull up bar',       label: 'Pull Up Bar',       icon: 'dumbbell.fill' as const },
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
    const defaultExercise = DefaultExercises.find(e => e.id === exerciseId) as any;
    const options = (defaultExercise && Array.isArray(defaultExercise.equipment))
        ? ALL_EQUIPMENT_OPTIONS.filter(opt => defaultExercise.equipment.includes(opt.value))
        : EQUIPMENT_OPTIONS;

    return (
        <BottomSheetOptionPicker
            visible={visible}
            onClose={onClose}
            title="Select Equipment"
            options={options}
            selectedValue={currentEquipment}
            onSelect={onSelect}
        />
    );
}
