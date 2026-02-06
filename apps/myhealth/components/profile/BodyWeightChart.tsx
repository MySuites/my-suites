import React from 'react';
import { View, Text } from 'react-native';
import { TimeSeriesChart, DateRange } from '../ui/TimeSeriesChart';

interface BodyWeightChartProps {
  data: { value: number; label: string; date: string; spineIndex?: number }[];
  color?: string;
  textColor?: string;
  maxPoints?: number;
  selectedRange?: DateRange;
  onPointSelect?: (item: { value: number; date: string } | null) => void;
}

export function BodyWeightChart({ data, color = '#3b82f6', textColor = '#9ca3af', maxPoints, selectedRange, onPointSelect }: BodyWeightChartProps) {
    if (!data || data.length === 0) {
        return (
          <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
             <Text style={{ color: textColor, fontSize: 12, fontStyle: 'italic' }}>No data for this range</Text>
          </View>
        );
      }

  return (
    <TimeSeriesChart
        data={data}
        color={color}
        textColor={textColor}
        maxPoints={maxPoints}
        selectedRange={selectedRange}
        onPointSelect={onPointSelect}
        height={150}
    />
  );
}
