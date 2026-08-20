import React from 'react';
import { View, Text } from 'react-native';
import { useUITheme, IconSymbol } from '@mysuite/ui';

interface BodyweightLoadCardProps {
    bodyweightLoadPercentage: number;
    effectiveLoadDisplay: number | null;
    weightUnit: string;
}

export function BodyweightLoadCard({ bodyweightLoadPercentage, effectiveLoadDisplay, weightUnit }: BodyweightLoadCardProps) {
    const theme = useUITheme();
    const text = theme.text as string;

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <IconSymbol name="scalemass.fill" size={18} color={theme.primary} />
                <Text style={{ color: text, fontSize: 16, fontWeight: '700' }}>
                    Bodyweight Load
                </Text>
            </View>
            {effectiveLoadDisplay != null ? (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: theme.bgLight,
                    borderRadius: 12,
                    padding: 16,
                }}>
                    <View>
                        <Text style={{ color: text, fontSize: 15, opacity: 0.8 }}>
                            {Math.round(bodyweightLoadPercentage * 100)}% of your bodyweight
                        </Text>
                        <Text style={{ color: text, opacity: 0.5, fontSize: 12, marginTop: 2 }}>
                            Based on your latest logged weight
                        </Text>
                    </View>
                    <Text style={{ color: theme.primary, fontSize: 22, fontWeight: '800' }}>
                        {effectiveLoadDisplay} {weightUnit}
                    </Text>
                </View>
            ) : (
                <View style={{
                    padding: 16,
                    backgroundColor: theme.bgLight,
                    borderRadius: 12,
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                }}>
                    <Text style={{ color: text, opacity: 0.5, fontSize: 14, textAlign: 'center' }}>
                        This exercise loads {Math.round(bodyweightLoadPercentage * 100)}% of your bodyweight. Log your bodyweight to see the estimated load.
                    </Text>
                </View>
            )}
        </View>
    );
}
