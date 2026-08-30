import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useUITheme, RaisedCard } from '@mysuite/ui';
import { FRONT_MUSCLES, BACK_MUSCLES, MUSCLE_ID_TO_GROUP } from './muscleData';

interface MuscleVolume {
    muscle: string;
    sets: number;
    exercises: string[];
}

interface MuscleHeatmapProps {
    volumes: Record<string, MuscleVolume>;
    isLoading?: boolean;
}

export function MuscleHeatmap({ volumes, isLoading }: MuscleHeatmapProps) {
    const theme = useUITheme();
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

    const isDark = !!theme.dark;

    const chartBg = isDark ? '#1c1c24' : '#f2f2f7';
    const bodyColor = theme.textMuted;
    const inactiveFill = isDark ? '#2e303e' : '#b0bec5';

    // Obliques share a volume bucket with Abdominals.
    const resolveGroup = (name: string) => (name === 'Obliques' ? 'Abdominals' : name);

    const getMuscleColor = (name: string): string => {
        const sets = volumes[resolveGroup(name)]?.sets ?? 0;
        if (sets === 0) return '#E5E7EB';
        if (sets <= 5)  return '#FDBA74';
        if (sets <= 10) return '#F97316';
        return '#991B1B';
    };

    const handlePress = (name: string) => {
        const lookup = resolveGroup(name);
        setSelectedMuscle(prev => prev === lookup ? null : lookup);
    };

    const isGroupSelected = (name: string) => selectedMuscle === resolveGroup(name);

    const activeInfo = selectedMuscle ? volumes[selectedMuscle] : null;

    const renderMuscle = (muscle: typeof FRONT_MUSCLES[number]) => {
        const groupName = MUSCLE_ID_TO_GROUP[muscle.id];
        const isSelected = groupName ? isGroupSelected(groupName) : false;
        const color = groupName ? getMuscleColor(groupName) : inactiveFill;

        return (
            <Path
                key={muscle.id}
                id={muscle.id}
                d={muscle.path}
                fill={color}
                stroke={isSelected ? theme.primary : bodyColor}
                strokeWidth={isSelected ? 0.8 : 0.3}
                onPress={() => groupName && handlePress(groupName)}
            />
        );
    };

    return (
        <RaisedCard className="p-4" style={{ borderRadius: 16 }}>
            <View className="mb-2">
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                    Weekly Muscle Heatmap
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    Tap a muscle group to view sets & exercises
                </Text>
            </View>

            <View style={[styles.chartWrapper, { backgroundColor: chartBg }]}>
                {isLoading ? (
                    <Text style={{ color: theme.textMuted }}>Loading…</Text>
                ) : (
                    <>
                        <Svg width="100%" height="100%" viewBox="0 0 70 95">
                            {/* Anterior (Front) View */}
                            <G id="anterior-view">
                                {FRONT_MUSCLES.map(renderMuscle)}
                            </G>

                            {/* Posterior (Back) View */}
                            <G id="posterior-view">
                                {BACK_MUSCLES.map(renderMuscle)}
                            </G>
                        </Svg>

                        {/* Labels */}
                        <View style={styles.labelsRow}>
                            <Text style={[styles.labelText, { color: theme.textMuted }]}>FRONT</Text>
                            <Text style={[styles.labelText, { color: theme.textMuted }]}>BACK</Text>
                        </View>
                    </>
                )}
            </View>

            {/* Tooltip HUD */}
            <View style={styles.tooltip}>
                {activeInfo ? (
                    <View className="items-center w-full">
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                            {activeInfo.muscle}: {activeInfo.sets} working sets
                        </Text>
                        {activeInfo.exercises.length > 0 ? (
                            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, textAlign: 'center' }} numberOfLines={1}>
                                {activeInfo.exercises.join(', ')}
                            </Text>
                        ) : (
                            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                                No exercises logged
                            </Text>
                        )}
                    </View>
                ) : (
                    <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic'}}>
                        Tap any muscle to see your training log
                    </Text>
                )}
            </View>
        </RaisedCard>
    );
}

const styles = StyleSheet.create({
    chartWrapper: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
    },
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 40,
        position: 'absolute',
        bottom: 6,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
    },
    tooltip: {
        minHeight: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        padding: 8,
        marginTop: 4,
    },
});
