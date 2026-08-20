import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUITheme } from '@mysuite/ui';

export interface PillPickerOption {
    value: string;
    label: string;
}

interface PillPickerProps {
    title: string;
    options: PillPickerOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

export function PillPicker({ title, options, selectedValue, onSelect }: PillPickerProps) {
    const theme = useUITheme();
    const text = theme.text as string;

    return (
        <View style={{ marginBottom: 24 }}>
            <Text style={{ color: text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                {title}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {options.map((opt) => {
                    const isSelected = selectedValue === opt.value;
                    return (
                        <Pressable
                            key={opt.value}
                            onPress={() => onSelect(opt.value)}
                            style={{
                                backgroundColor: isSelected ? theme.primary : theme.bgLight,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: isSelected ? 'transparent' : theme.border,
                            }}
                        >
                            <Text style={{
                                color: isSelected ? '#FFFFFF' : text,
                                fontSize: 14,
                                fontWeight: '600',
                            }}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
