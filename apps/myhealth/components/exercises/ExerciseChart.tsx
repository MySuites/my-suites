import React from 'react';
import { View, Text, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface ExerciseChartProps {
    data: any[];
    loading: boolean;
    selectedMetric: 'weight' | 'reps' | 'duration' | 'distance';
    onSelectMetric: (metric: 'weight' | 'reps' | 'duration' | 'distance') => void;
    availableMetrics: ('weight' | 'reps' | 'duration' | 'distance')[];
    themeColors: any;
    cardBackground: string;
    toggleBackground: string;
    activeToggleBg: string;
    activeToggleText: string;
}

export const ExerciseChart = ({
    data,
    loading,
    selectedMetric,
    onSelectMetric,
    availableMetrics,
    themeColors,
    cardBackground,
    toggleBackground,
    activeToggleBg,
    activeToggleText
}: ExerciseChartProps) => {
    
    if (availableMetrics.length === 0) return null;

    return (
        <View style={{ 
            backgroundColor: cardBackground,
            borderRadius: 16, 
            padding: 16, 
            marginBottom: 24,
            overflow: 'hidden'
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
                {availableMetrics.length > 0 && (
                    <View style={{ 
                        flexDirection: 'row', 
                        backgroundColor: toggleBackground, 
                        borderRadius: 8, 
                        padding: 4 
                    }}>
                        {availableMetrics.map((m) => (
                            <Pressable 
                                key={m}
                                onPress={() => onSelectMetric(m)}
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
                                    color: selectedMetric === m ? activeToggleText : themeColors.text,
                                    opacity: selectedMetric === m ? 1 : 0.6
                                }}>
                                    {m}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
            
            {loading ? (
                <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={themeColors.primary} />
                </View>
            ) : (
                <View style={{ marginLeft: -20, overflow: 'hidden' }}>
                    <LineChart
                        data={data.length > 0 ? data : [{ value: 0, label: '', hideDataPoint: true }]}
                        height={220}
                        color1={themeColors.primary}
                        dataPointsColor1={themeColors.primary}
                        startFillColor1={themeColors.primary}
                        startOpacity={0.8}
                        endOpacity={0.1}
                        initialSpacing={20}
                        noOfSections={4}
                        yAxisTextStyle={{ color: themeColors.text, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: themeColors.text, fontSize: 10 }}
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
                        textColor={themeColors.text}
                        maxValue={data.length === 0 ? 100 : undefined} 
                        hideDataPoints={data.length === 0}
                    />
                </View>
            )}
            {!loading && data.length === 0 && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: themeColors.text, opacity: 0.5 }}>No data yet</Text>
                </View>
            )}
        </View>
    );
};
