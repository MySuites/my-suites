import React from 'react';
import { View, Text } from 'react-native';
import { RaisedCard, useUITheme } from '@mysuite/ui';
import { WorkoutRouteMap } from './WorkoutRouteMap';
import { formatDistance, formatElevation } from '../../utils/formatting';
import { UnitSystem } from '../../utils/units';

interface WorkoutStatsCardProps {
    historyItem: any;
    unitSystem: UnitSystem;
}

export function WorkoutStatsCard({ historyItem, unitSystem }: WorkoutStatsCardProps) {
    const theme = useUITheme();

    if (!historyItem || !(historyItem.healthkitUuid || historyItem.metricsSource === 'gps')) {
        return null;
    }

    return (
        <View style={{ marginBottom: 20 }}>
            <Text className="font-semibold text-light dark:text-dark mb-3 text-lg">
                {historyItem.metricsSource === 'gps' ? 'GPS Stats' : 'Apple Watch Stats'}
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                {historyItem.avgHeartRate != null && (
                    <RaisedCard className="p-3" style={{ minWidth: '30%', flexGrow: 1 }}>
                        <Text className="text-[12px] text-light-muted dark:text-dark-muted font-medium mb-0.5">Avg Heart Rate</Text>
                        <Text className="text-lg font-bold text-light dark:text-dark">{Math.round(historyItem.avgHeartRate)} bpm</Text>
                    </RaisedCard>
                )}
                {historyItem.maxHeartRate != null && (
                    <RaisedCard className="p-3" style={{ minWidth: '30%', flexGrow: 1 }}>
                        <Text className="text-[12px] text-light-muted dark:text-dark-muted font-medium mb-0.5">Max Heart Rate</Text>
                        <Text className="text-lg font-bold text-light dark:text-dark">{Math.round(historyItem.maxHeartRate)} bpm</Text>
                    </RaisedCard>
                )}
                {historyItem.calories != null && (
                    <RaisedCard className="p-3" style={{ minWidth: '30%', flexGrow: 1 }}>
                        <Text className="text-[12px] text-light-muted dark:text-dark-muted font-medium mb-0.5">Calories</Text>
                        <Text className="text-lg font-bold text-light dark:text-dark">{Math.round(historyItem.calories)} kcal</Text>
                    </RaisedCard>
                )}
                {historyItem.distance != null && (
                    <RaisedCard className="p-3" style={{ minWidth: '30%', flexGrow: 1 }}>
                        <Text className="text-[12px] text-light-muted dark:text-dark-muted font-medium mb-0.5">Distance</Text>
                        <Text className="text-lg font-bold text-light dark:text-dark">{formatDistance(historyItem.distance, unitSystem)}</Text>
                    </RaisedCard>
                )}
                {historyItem.elevationGain != null && (
                    <RaisedCard className="p-3" style={{ minWidth: '30%', flexGrow: 1 }}>
                        <Text className="text-[12px] text-light-muted dark:text-dark-muted font-medium mb-0.5">Elevation Gain</Text>
                        <Text className="text-lg font-bold text-light dark:text-dark">{formatElevation(historyItem.elevationGain, unitSystem)}</Text>
                    </RaisedCard>
                )}
            </View>
            {historyItem.route && historyItem.route.length >= 2 && (
                <View style={{ marginTop: 16 }}>
                    <WorkoutRouteMap route={historyItem.route} color={theme.primary as string} />
                </View>
            )}
        </View>
    );
}
