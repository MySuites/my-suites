import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUITheme, IconSymbol } from '@mysuite/ui';
import { BodyweightLoadCard } from './BodyweightLoadCard';

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
                    <BodyweightLoadCard
                        bodyweightLoadPercentage={bodyweightLoadPercentage}
                        effectiveLoadDisplay={effectiveLoadDisplay}
                        weightUnit={weightUnit}
                    />
                </View>
            )}
        </View>
    );
}
