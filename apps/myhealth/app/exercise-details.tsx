import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { useUITheme } from '@mycsuite/ui';
import { IconSymbol } from '../components/ui/icon-symbol';


export default function ExerciseDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();

    
    const exercise = useMemo(() => {
        try {
            if (typeof params.exercise === 'string') {
                return JSON.parse(params.exercise);
            }
            return null;
        } catch (e) {
            console.error("Failed to parse exercise param", e);
            return null;
        }
    }, [params.exercise]);

    if (!exercise) {
        return (
            <ThemedView className="flex-1 justify-center items-center">
                <ThemedText>Exercise not found.</ThemedText>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <ThemedText type="link">Go Back</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }



    return (
        <ThemedView className="flex-1">
             <ThemedView className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <View className="flex-row items-center gap-1">
                        <IconSymbol name="chevron.left" size={20} color={theme.primary} />
                        <ThemedText type="link">Back</ThemedText>
                    </View>
                </TouchableOpacity>
                <ThemedText type="subtitle">Details</ThemedText>
                <View className="w-16" />
            </ThemedView>

            <ScrollView className="flex-1 p-4">
                <View className="mb-6">
                    <ThemedText type="title" className="mb-2">{exercise.name || 'Unknown Name'}</ThemedText>
                    <ThemedText className="text-gray-500 dark:text-gray-400 text-lg">
                        {exercise.category || 'Uncategorized'}
                    </ThemedText>
                </View>

                <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-6">
                    <ThemedText type="defaultSemiBold" className="mb-3">Properties</ThemedText>
                    <View className="flex-row flex-wrap gap-2">
                        {Array.isArray(exercise.properties) && exercise.properties.length > 0 ? (
                            exercise.properties.map((prop: string, index: number) => (
                                <View key={index} className="bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-full">
                                    <ThemedText className="text-sm">{String(prop)}</ThemedText>
                                </View>
                            ))
                        ) : (
                            <ThemedText className="text-gray-500 italic">No specific properties</ThemedText>
                        )}
                        {!exercise.properties && exercise.rawType && (
                             <View className="bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-full">
                                <ThemedText className="text-sm">{String(exercise.rawType)}</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-6">
                    <ThemedText type="defaultSemiBold" className="mb-2">Instructions</ThemedText>
                    <ThemedText className="text-gray-500 dark:text-gray-400 leading-6">
                        No instructions available for this exercise yet.
                    </ThemedText>
                </View>

            </ScrollView>


        </ThemedView>
    );
}
