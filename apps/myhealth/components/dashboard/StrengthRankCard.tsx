import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RaisedCard, useUITheme } from '@mysuite/ui';
import { RANKED_LIFTS, getStrengthRank, StrengthSex, StrengthTier } from '../../utils/strengthStandards';
import { LiftBest } from '../../hooks/workouts/useStrengthRanks';

interface StrengthRankCardProps {
    bests: LiftBest[];
    bodyweight: number | null;
    sex: StrengthSex;
    onChangeSex: (sex: StrengthSex) => void;
    isLoading?: boolean;
}

function tierColor(theme: any, tier: StrengthTier | null): string {
    switch (tier) {
        case 'Elite': return theme.primary;
        case 'Advanced': return theme.warning || theme.primary;
        case 'Intermediate': return theme.success || theme.primary;
        case 'Novice': return theme.info || theme.textMuted;
        case 'Beginner': return theme.textMuted;
        default: return theme.textMuted;
    }
}

export function StrengthRankCard({ bests, bodyweight, sex, onChangeSex, isLoading }: StrengthRankCardProps) {
    const theme = useUITheme();

    return (
        <RaisedCard className="p-4" style={{ borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                    Strength Rank
                </Text>
                <View style={{ flexDirection: 'row', backgroundColor: theme.bgLight, borderRadius: 8, padding: 2 }}>
                    {(['male', 'female'] as StrengthSex[]).map((option) => (
                        <TouchableOpacity
                            key={option}
                            testID={`strength-rank-sex-${option}`}
                            onPress={() => onChangeSex(option)}
                            style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 6,
                                backgroundColor: sex === option ? theme.primary : 'transparent',
                            }}
                        >
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: sex === option ? '#fff' : theme.textMuted,
                                textTransform: 'capitalize',
                            }}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {!bodyweight ? (
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                    Log your body weight to see your strength rank.
                </Text>
            ) : (
                <View style={{ marginTop: 8 }}>
                    {RANKED_LIFTS.map((lift) => {
                        const best = bests.find((b) => b.exerciseId === lift.exerciseId)?.bestEstimatedOneRepMax ?? null;
                        const rank = best ? getStrengthRank(lift.exerciseId, best, bodyweight, sex) : null;
                        const color = tierColor(theme, rank?.tier ?? null);

                        return (
                            <View
                                key={lift.exerciseId}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingVertical: 10,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textMuted, width: 36, textTransform: 'uppercase' }}>
                                        {lift.category}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                                        {lift.name}
                                    </Text>
                                </View>

                                {isLoading ? (
                                    <Text style={{ fontSize: 12, color: theme.textMuted }}>…</Text>
                                ) : !best || !rank ? (
                                    <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>
                                        No data yet
                                    </Text>
                                ) : (
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View
                                            style={{
                                                backgroundColor: color + '20',
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                borderRadius: 100,
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: '700', color }}>
                                                {rank.tier ?? 'Untrained'}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                                            {Math.round(best)} lbs · {rank.ratio.toFixed(2)}x BW
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </RaisedCard>
    );
}
