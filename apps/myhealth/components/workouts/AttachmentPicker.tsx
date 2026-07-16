import React from 'react';
import { BottomSheetOptionPicker } from '../ui/BottomSheetOptionPicker';

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
    const attachments = ATTACHMENT_OPTIONS[exerciseId] || [];

    if (attachments.length === 0) return null;

    return (
        <BottomSheetOptionPicker
            visible={visible}
            onClose={onClose}
            title="Select Attachment"
            options={attachments.map(a => ({ value: a, label: a }))}
            selectedValue={currentAttachment}
            onSelect={onSelect}
        />
    );
}
