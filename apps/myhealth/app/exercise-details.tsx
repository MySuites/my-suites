import React, { useMemo, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Text, Dimensions, useColorScheme } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '../components/ui/ThemedText';
import { useUITheme } from '@mycsuite/ui';
import { fetchExerciseStats } from '../hooks/useWorkoutManager';
import { useAuth } from '@mycsuite/auth';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ExerciseDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useUITheme();
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    const [chartData, setChartData] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState<'weight' | 'reps' | 'duration' | 'distance'>('weight');

    const exercise = useMemo(() => {
        try {
            if (typeof params.exercise === 'string') {
                return JSON.parse(params.exercise);
            }
            return null;
        } catch {
            return null;
        }
    }, [params.exercise]);

    const availableMetrics = useMemo(() => {
        if (!exercise || (!exercise.properties && !exercise.rawType)) return [];
        const props = exercise.properties || (Array.isArray(exercise.rawType) ? exercise.rawType : [exercise.rawType]);
        const metrics: ('weight' | 'reps' | 'duration' | 'distance')[] = [];
        if (Array.isArray(props)) {
            props.forEach((p: string) => {
                const lower = String(p).toLowerCase();
                if ((lower.includes('weight') && !lower.includes('bodyweight')) || lower.includes('weighted')) metrics.push('weight');
                if (lower.includes('reps')) metrics.push('reps');
                if (lower.includes('duration') || lower.includes('time')) metrics.push('duration');
                if (lower.includes('distance')) metrics.push('distance');
            });
        }
        return Array.from(new Set(metrics));
    }, [exercise]);

    useEffect(() => {
        if (availableMetrics.length > 0 && !availableMetrics.includes(selectedMetric)) {
             setSelectedMetric(availableMetrics[0]);
        }
    }, [availableMetrics, selectedMetric]);

    useEffect(() => {
        let isMounted = true;
        async function loadStats() {
            if (exercise?.id && user && availableMetrics.length > 0 && availableMetrics.includes(selectedMetric)) {
                try {
                    const { data } = await fetchExerciseStats(user, exercise.id, selectedMetric);
                    if (isMounted && data) {
                        setChartData(data);
                        setLoadingChart(false);
                    }
                } catch (e) {
                    console.error("Fetch error", e);
                }
            } else {
                if (isMounted) setLoadingChart(false);
            }
        }
        loadStats();
        return () => { isMounted = false; };
    }, [exercise, user, selectedMetric, availableMetrics]);

    if (!exercise) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ThemedText>Exercise not found.</ThemedText>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20, padding: 10 }}>
                    <ThemedText type="link">Go Back</ThemedText>
                </Pressable>
            </View>
        );
    }

    // Colors from tailwind.config.js
    const colors = {
        light: {
            primary: '#FF6F61',
            background: '#FFF5F5',
            surface: '#EAD4D4',
            text: '#2D1F1F',
            border: '#EAD4D4'
        },
        dark: {
            primary: '#FF8A80',
            background: '#2D1F1F',
            surface: '#3E2C2C',
            text: '#FFF5F5',
            border: '#3E2C2C'
        }
    };

    const currentColors = isDark ? colors.dark : colors.light;
    
    // Derived UI colors
    const cardBackground = currentColors.surface;
    const toggleBackground = isDark ? '#261b1b' : '#dbcaca'; // Slightly darker/lighter than surface for contrast
    const activeToggleBg = currentColors.background; 
    const activeToggleText = currentColors.text;

    return (
        <View style={{ flex: 1, backgroundColor: currentColors.background }}>
             {/* Header */}
             <View style={{ 
                 flexDirection: 'row', 
                 alignItems: 'center', 
                 justifyContent: 'space-between', 
                 paddingHorizontal: 16,
                 paddingVertical: 12,
                 borderBottomWidth: 1, 
                 borderBottomColor: currentColors.surface
             }}>
                <Pressable onPress={() => router.back()} style={{ padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol name="chevron.left" size={20} color={currentColors.primary} />
                    <ThemedText type="link" style={{ color: currentColors.primary }}>Back</ThemedText>
                </Pressable>
                <ThemedText type="subtitle" style={{ color: currentColors.text }}>Details</ThemedText>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
                <View style={{ marginBottom: 24 }}>
                    <ThemedText type="title" style={{ marginBottom: 4, color: currentColors.text }}>{exercise.name || 'Unknown Name'}</ThemedText>
                    <ThemedText style={{ fontSize: 18, color: currentColors.text, opacity: 0.7 }}>
                        {exercise.category || 'Uncategorized'}
                    </ThemedText>
                </View>

                {/* Performance Chart */}
                {availableMetrics.length > 0 && (
                    <View style={{ 
                        backgroundColor: cardBackground,
                        borderRadius: 16, 
                        padding: 16, 
                        marginBottom: 24,
                        overflow: 'hidden'
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <ThemedText type="defaultSemiBold" style={{ color: currentColors.text }}>Performance</ThemedText>
                            {availableMetrics.length > 1 && (
                                <View style={{ 
                                    flexDirection: 'row', 
                                    backgroundColor: toggleBackground, 
                                    borderRadius: 8, 
                                    padding: 4 
                                }}>
                                    {availableMetrics.map((m) => (
                                        <Pressable 
                                            key={m}
                                            onPress={() => setSelectedMetric(m)}
                                            style={{ 
                                                paddingHorizontal: 12, 
                                                paddingVertical: 6, 
                                                borderRadius: 6,
                                                backgroundColor: selectedMetric === m ? activeToggleBg : 'transparent',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: selectedMetric === m ? 0.1 : 0,
                                                shadowRadius: 1,
                                                elevation: selectedMetric === m ? 1 : 0
                                            }}
                                        >
                                            <Text style={{ 
                                                fontSize: 12, 
                                                textTransform: 'capitalize', 
                                                fontWeight: selectedMetric === m ? '600' : '400',
                                                color: selectedMetric === m ? activeToggleText : currentColors.text,
                                                opacity: selectedMetric === m ? 1 : 0.6
                                            }}>
                                                {m}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                        
                        {loadingChart ? (
                            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={currentColors.primary} />
                            </View>
                        ) : (
                            <View style={{ marginLeft: -20, overflow: 'hidden' }}>
                                <LineChart
                                    data={chartData.length > 0 ? chartData : [{ value: 0, label: '', hideDataPoint: true }]}
                                    height={220}
                                    color1={currentColors.primary}
                                    dataPointsColor1={currentColors.primary}
                                    startFillColor1={currentColors.primary}
                                    startOpacity={0.8}
                                    endOpacity={0.1}
                                    initialSpacing={20}
                                    noOfSections={4}
                                    yAxisTextStyle={{ color: currentColors.text, fontSize: 10 }}
                                    xAxisLabelTextStyle={{ color: currentColors.text, fontSize: 10 }}
                                    thickness={3}
                                    hideRules
                                    yAxisColor="transparent"
                                    xAxisColor="transparent"
                                    width={Dimensions.get('window').width - 60} 
                                    adjustToWidth={false}
                                    isAnimated
                                    animationDuration={1000}
                                    curveType={0} 
                                    curved
                                    dataPointsHeight={8}
                                    dataPointsWidth={8}
                                    textFontSize={10}
                                    textColor={currentColors.text}
                                    maxValue={chartData.length === 0 ? 100 : undefined} 
                                    hideDataPoints={chartData.length === 0}
                                />
                            </View>
                        )}
                        {!loadingChart && chartData.length === 0 && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                                <ThemedText style={{ color: currentColors.text, opacity: 0.5 }}>No data yet</ThemedText>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ 
                    backgroundColor: cardBackground,
                    borderRadius: 16, 
                    padding: 16, 
                    marginBottom: 24 
                }}>
                    <ThemedText type="defaultSemiBold" style={{ marginBottom: 12, color: currentColors.text }}>Properties</ThemedText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {Array.isArray(exercise.properties) && exercise.properties.length > 0 ? (
                            exercise.properties.map((prop: string, index: number) => (
                                <View key={index} style={{ 
                                    backgroundColor: toggleBackground, 
                                    paddingHorizontal: 12, 
                                    paddingVertical: 6, 
                                    borderRadius: 16 
                                }}>
                                    <ThemedText style={{ fontSize: 13, color: currentColors.text }}>{String(prop)}</ThemedText>
                                </View>
                            ))
                        ) : (
                            <ThemedText style={{ fontStyle: 'italic', color: currentColors.text, opacity: 0.6 }}>No specific properties</ThemedText>
                        )}
                         {!exercise.properties && exercise.rawType && (
                             <View style={{ 
                                backgroundColor: toggleBackground,
                                paddingHorizontal: 12, 
                                paddingVertical: 6, 
                                borderRadius: 16 
                            }}>
                                <ThemedText style={{ fontSize: 13, color: currentColors.text }}>{String(exercise.rawType)}</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                 <View style={{ 
                    backgroundColor: cardBackground,
                    borderRadius: 16, 
                    padding: 16, 
                    marginBottom: 120 
                }}>
                    <ThemedText type="defaultSemiBold" style={{ marginBottom: 12, color: currentColors.text }}>Instructions</ThemedText>
                    <ThemedText style={{ color: currentColors.text, opacity: 0.6, lineHeight: 24 }}>
                        No instructions available for this exercise yet.
                    </ThemedText>
                </View>

            </ScrollView>
        </View>
    );
}
