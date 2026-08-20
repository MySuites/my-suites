import React from 'react';
import { View, Text } from 'react-native';
import { useUITheme } from '@mysuite/ui';

interface InstructionsListProps {
    instructions?: string[];
}

export function InstructionsList({ instructions }: InstructionsListProps) {
    const theme = useUITheme();
    const text = theme.text as string;

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Text style={{ color: text, fontSize: 16, fontWeight: '700' }}>
                    Instructions
                </Text>
            </View>
            {instructions && instructions.length > 0 ? (
                <View style={{ gap: 12 }}>
                    {instructions.map((step: string, index: number) => (
                        <View key={index} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                            <View style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: (theme.bgLight || 'rgba(0,0,0,0.05)'),
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 1
                            }}>
                                <Text style={{ color: text, fontSize: 11, fontWeight: '700', opacity: 0.8 }}>
                                    {index + 1}
                                </Text>
                            </View>
                            <Text style={{ flex: 1, color: text, opacity: 0.8, fontSize: 14, lineHeight: 20 }}>
                                {step}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={{
                    padding: 16,
                    backgroundColor: theme.bgLight,
                    borderRadius: 12,
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center'
                }}>
                    <Text style={{ color: text, opacity: 0.5, fontSize: 14 }}>
                        No step-by-step instructions available for this exercise yet.
                    </Text>
                </View>
            )}
        </View>
    );
}
