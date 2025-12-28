import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useUITheme } from '@mysuite/ui';

export default function RoutineDetailsScreen() {
    const params = useLocalSearchParams();
    
    // Parse the routine data from params
    const routine = useMemo(() => {
        try {
            if (typeof params.routine === 'string') {
                return JSON.parse(params.routine);
            }
            return null;
        } catch {
            return null;
        }
    }, [params.routine]);

    if (!routine) {
        return (
            <View className="flex-1 bg-light dark:bg-dark p-4 justify-center items-center">
                <Text className="text-lg text-light dark:text-dark">Routine not found</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader 
                title={routine.name || "Routine Details"} 
                withBackButton={true} 
            />
            
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {routine.sequence?.map((day: any, idx: number) => (
                    <View key={idx} className="mb-4 bg-light-lighter dark:bg-border-dark p-4 rounded-xl">
                        <Text className="text-lg font-bold text-light dark:text-dark mb-2">
                            Day {idx + 1}
                        </Text>
                        
                        {day.type === 'rest' ? (
                            <Text className="text-light-muted dark:text-dark-muted italic">Rest Day</Text>
                        ) : (
                            <View>
                                <Text className="text-base font-semibold text-primary dark:text-primary-dark mb-1">
                                    {day.workout?.name || "Untitled Workout"}
                                </Text>
                                <Text className="text-sm text-light-muted dark:text-dark-muted">
                                    {day.workout?.exercises?.length || 0} Exercises
                                </Text>
                            </View>
                        )}
                    </View>
                ))}
                
                {(!routine.sequence || routine.sequence.length === 0) && (
                    <Text className="text-center text-light-muted dark:text-dark-muted mt-8">
                        No days scheduled for this routine.
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}
