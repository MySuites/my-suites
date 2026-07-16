import React from 'react';
import { BottomSheetOptionPicker } from '../ui/BottomSheetOptionPicker';

export const MOVEMENT_TYPE_OPTIONS = [
    { value: 'unilateral', label: 'Unilateral', icon: 'figure.walk' as const },
    { value: 'uniform',    label: 'Uniform',    icon: 'figure.walk' as const },
];

interface MovementTypePickerProps {
    visible: boolean;
    currentMovementType?: string;
    onClose: () => void;
    onSelect: (movementType: string) => void;
}

export function MovementTypePicker({ visible, currentMovementType, onClose, onSelect }: MovementTypePickerProps) {
    return (
        <BottomSheetOptionPicker
            visible={visible}
            onClose={onClose}
            title="Select Movement Type"
            options={MOVEMENT_TYPE_OPTIONS}
            selectedValue={currentMovementType}
            onSelect={onSelect}
        />
    );
}
