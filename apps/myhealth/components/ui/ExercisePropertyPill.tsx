import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconSymbol, useUITheme } from '@mysuite/ui';

interface ExercisePropertyPillProps {
    icon: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    // 'default' matches ExerciseCard's look (theme.bgLight background, larger
    // text/icons). 'subtle' matches WorkoutDraftExerciseItem's look (faint
    // black/white overlay background, smaller text/icons, chevron hidden
    // when disabled instead of just non-interactive).
    variant?: 'default' | 'subtle';
}

export function ExercisePropertyPill({ icon, label, onPress, disabled = false, variant = 'default' }: ExercisePropertyPillProps) {
    const theme = useUITheme();
    const handlePress = (e: any) => {
        e.stopPropagation();
        onPress();
    };

    if (variant === 'subtle') {
        const isDark = theme.dark;
        const bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
        const iconColor = isDark ? '#bbb' : '#555';
        const textColor = isDark ? '#ccc' : '#444';
        return (
            <TouchableOpacity
                disabled={disabled}
                onPress={handlePress}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: bg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 4,
                }}
            >
                <IconSymbol name={icon as any} size={10} color={iconColor} />
                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '600', color: textColor }}>
                    {label}
                </Text>
                {!disabled && (
                    <IconSymbol name="chevron.down" size={8} color={textColor} style={{ marginLeft: 3 }} />
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            disabled={disabled}
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.bgLight,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
            }}
        >
            <IconSymbol name={icon as any} size={13} color={theme.textMuted} />
            <Text style={{ marginLeft: 5, fontSize: 12, fontWeight: '600', color: theme.textMuted }}>
                {label}
            </Text>
            <IconSymbol name="chevron.down" size={10} color={theme.textMuted} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
    );
}

interface ExercisePropertyPillRowProps {
    isAttachmentSupported: boolean;
    attachment?: string;
    onPressAttachment: () => void;
    equipment?: string;
    onPressEquipment: () => void;
    movementType?: string;
    onPressMovementType: () => void;
    disabled?: boolean;
    variant?: 'default' | 'subtle';
    // Active workout screen moved the movement-type pill into the exercise's
    // ellipsis menu instead; the workout builder still shows it inline here.
    showMovementType?: boolean;
    // Same deal as showMovementType, but for the attachment pill.
    showAttachment?: boolean;
    // Same deal as showMovementType, but for the equipment pill.
    showEquipment?: boolean;
}

// Attachment/equipment/movement-type pill row shown under an exercise's
// name — same three pills repeated across ExerciseCard (active workout) and
// WorkoutDraftExerciseItem (workout builder), each opening its own picker.
export function ExercisePropertyPillRow({
    isAttachmentSupported,
    attachment,
    onPressAttachment,
    equipment,
    onPressEquipment,
    movementType,
    onPressMovementType,
    disabled = false,
    variant = 'default',
    showMovementType = true,
    showAttachment = true,
    showEquipment = true,
}: ExercisePropertyPillRowProps) {
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 2, alignItems: 'center' }}>
            {showAttachment && isAttachmentSupported && attachment && (
                <ExercisePropertyPill
                    icon="gearshape.fill"
                    label={attachment}
                    onPress={onPressAttachment}
                    disabled={disabled}
                    variant={variant}
                />
            )}
            {showEquipment && equipment && (
                <ExercisePropertyPill
                    icon="dumbbell.fill"
                    label={equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                    onPress={onPressEquipment}
                    disabled={disabled}
                    variant={variant}
                />
            )}
            {showMovementType && movementType && (
                <ExercisePropertyPill
                    icon="figure.walk"
                    label={movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                    onPress={onPressMovementType}
                    disabled={disabled}
                    variant={variant}
                />
            )}
        </View>
    );
}
