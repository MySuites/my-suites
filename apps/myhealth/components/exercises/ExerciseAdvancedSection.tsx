import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUITheme, IconSymbol } from '@mysuite/ui';

interface ExerciseAdvancedSectionProps {
    isBodyweightExercise: boolean;
    bodyweightLoadPercentage: number;
    effectiveLoadDisplay: number | null;
    weightUnit: string;
}

export function ExerciseAdvancedSection({
    isBodyweightExercise,
    bodyweightLoadPercentage,
    effectiveLoadDisplay,
    weightUnit,
}: ExerciseAdvancedSectionProps) {
    const theme = useUITheme();
    const text = theme.text as string;
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={{ marginTop: 8 }}>
            <Pressable
                onPress={() => setExpanded(prev => !prev)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: text, fontSize: 16, fontWeight: '700' }}>
                        Advanced
                    </Text>
                </View>
                <IconSymbol
                    name={expanded ? "chevron.up" : "chevron.down"}
                    size={16}
                    color={text}
                />
            </Pressable>

            {expanded && isBodyweightExercise && (
                <View style={{ marginTop: 12 }}>
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
                </View>
            )}
        </View>
    );
}
