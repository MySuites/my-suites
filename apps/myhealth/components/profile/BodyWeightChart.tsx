import React from 'react';
import { View, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

type DateRange = 'Week' | 'Month' | '6Month' | 'Year';

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

  // Ensure chronological order
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const screenWidth = Dimensions.get('window').width;
  const paddingHorizontal = 64; // Card mx-4 (32) + p-4 (32)
  const yAxisWidth = 30; // Dedicated space for custom Y-axis labels
  const availableChartWidth = screenWidth - paddingHorizontal - yAxisWidth;
  
  // We want the chart to fill the available width exactly
  let computedWidth = availableChartWidth;

  let spacing = 40;
  let initialSpacing = 0;
  
  // Prepare Normalized Data
  let normalizedData: any[] = [];

  if (maxPoints && sortedData.length > 0) {
    const pointsCount = maxPoints;
    // Strict uniform spacing
    spacing = availableChartWidth / (pointsCount - 1);
    initialSpacing = 0; // Starts at 0
    
    // Create dense array
    for (let i = 0; i < pointsCount; i++) {
        const realPoint = sortedData.find(d => (d.spineIndex ?? -1) === i);
        if (realPoint) {
            normalizedData.push({ ...realPoint, isInterpolated: false });
        } else {
            // Interpolate
            // Find Prev
            let prevPoint = null;
            let nextPoint = null;
            
            // Search backwards
            for (let j = i - 1; j >= 0; j--) {
                const found = sortedData.find(d => (d.spineIndex ?? -1) === j);
                if (found) { prevPoint = found; break; }
            }
             // Search forwards
            for (let k = i + 1; k < pointsCount; k++) {
                const found = sortedData.find(d => (d.spineIndex ?? -1) === k);
                if (found) { nextPoint = found; break; }
            }
            
            let interpolatedValue = 0;
            if (prevPoint && nextPoint) {
                const totalDist = (nextPoint.spineIndex ?? 0) - (prevPoint.spineIndex ?? 0);
                const currDist = i - (prevPoint.spineIndex ?? 0);
                const valDiff = nextPoint.value - prevPoint.value;
                interpolatedValue = prevPoint.value + (valDiff * (currDist / totalDist));
            } else if (prevPoint) {
                interpolatedValue = prevPoint.value; // Clamp forward
            } else if (nextPoint) {
                interpolatedValue = nextPoint.value; // Clamp backward
            }
            
            normalizedData.push({
                value: interpolatedValue,
                date: '', // No date for gaps
                label: '',
                isInterpolated: true,
                hideDataPoint: true,
                dataPointText: '',
            });
        }
    }
  } else {
    // Large dataset or no maxPoints fallback
    normalizedData = sortedData.map(d => ({ ...d, isInterpolated: false }));
    
    if (sortedData.length > 1 && sortedData.length <= 32) {
         // Auto-fit logic for small non-fixed datasets? 
         // For now, adhere to existing logic or just use uniform default if not maxPoints
         const pointsCount = sortedData.length;
         spacing = availableChartWidth / (pointsCount - 1);
    } else {
         spacing = 10;
         initialSpacing = 10;
        //  computedWidth is auto-calc handled by Gifted Charts or we set it?
        // Reuse old logic for scrolling:
         const contentWidth = (sortedData.length - 1) * spacing;
         const calculatedInitialSpacing = availableChartWidth - contentWidth;
         initialSpacing = Math.max(10, calculatedInitialSpacing);
         computedWidth = Math.max(availableChartWidth, contentWidth + initialSpacing + 10);
    }
  }

  // Generate Fixed Labels if in Fixed Mode
  const fixedLabels: string[] = [];
  if (maxPoints && selectedRange) {
    const now = new Date();
    const config = {
      Week: { count: 7, unit: 'date' as const },
      Month: { count: 31, unit: 'date' as const },
      '6Month': { count: 26, unit: 'week' as const },
      Year: { count: 12, unit: 'month' as const },
    };
    
    const { count, unit } = config[selectedRange as keyof typeof config];
    [0, 0.25, 0.5, 0.75, 1].forEach(percent => {
      const d = new Date(now);
      const unitsAgo = Math.round((count - 1) * (1 - percent));
      if (unit === 'date') d.setDate(d.getDate() - unitsAgo);
      else if (unit === 'week') d.setDate(d.getDate() - unitsAgo * 7);
      else if (unit === 'month') d.setMonth(d.getMonth() - unitsAgo);
      
      fixedLabels.push(d.toLocaleDateString(undefined, unit === 'month' ? { month: 'short' } : { month: 'short', day: 'numeric' }));
    });
  }

  // Calculate Y-Axis bounds centered on average (Use REAL values only)
  const realValues = sortedData.map(d => d.value);
  const minData = Math.min(...realValues);
  const maxData = Math.max(...realValues);
  const avg = realValues.length > 0 ? realValues.reduce((a, b) => a + b, 0) / realValues.length : 0;
  
  const targetSections = 4;
  let stepValue = 10;
  let minAxis = 0;

  // Search for the smallest stepValue (10, 20, 30...) that fits the data centered on avg
  if (realValues.length > 0) {
      for (let s = 10; s <= 1000; s += 10) {
        const range = s * targetSections;
        const start = Math.max(0, Math.floor((avg - range / 2) / 10) * 10);
        if (minData >= start && maxData <= start + range) {
          stepValue = s;
          minAxis = start;
          break;
        }
      }
  }

  const yAxisLabelTexts = Array.from({ length: targetSections + 1 }, (_, i) => (minAxis + i * stepValue).toString());

  // Format for gifted-charts - SUBTRACT minAxis to ensure perfect alignment
  const chartData = normalizedData.map(item => ({
    value: item.value - minAxis,
    label: item.label,
    realValue: item.value,
    date: item.date,
    isInterpolated: item.isInterpolated,
    hideDataPoint: item.isInterpolated,
    dataPointText: '', 
    // No custom spacing needed for maxPoints mode as we rely on global spacing
  }));

  return (
    <View style={{ paddingTop: 10, paddingBottom: 16 }}>
      
      <View style={{ flexDirection: 'row' }}>
         {/* Main Chart Area */}
         <View style={{ width: availableChartWidth }}>
            {/* Grid Overlay for Fixed Timeline */}
            {maxPoints && (
                <View 
                    pointerEvents="none"
                    style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderWidth: 1,
                    borderColor: textColor,
                    opacity: 0.08,
                    }}
                >
                    {/* Cross-hair Style Grid */}
                    {[0.25, 0.5, 0.75].map(p => (
                    <React.Fragment key={p}>
                        <View style={{ position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: textColor }} />
                        <View style={{ position: 'absolute', top: `${p * 100}%`, left: 0, right: 0, height: 1, backgroundColor: textColor }} />
                    </React.Fragment>
                    ))}
                </View>
            )}

            <LineChart
                data={chartData}
                color={color}
                thickness={3}
                startFillColor={color}
                endFillColor={color}
                startOpacity={0.2}
                endOpacity={0.0}
                areaChart
                yAxisThickness={0}
                xAxisThickness={0}
                hideYAxisText
                xAxisLabelTextStyle={{ color: maxPoints ? 'transparent' : textColor, fontSize: 10, width: 40 }}
                yAxisLabelContainerStyle={{ width: 0 }} // Effectively hide internal Y container
                {...({ containerToDataUpperPadding: 0 } as any)} // Force-remove internal top offset
                hideRules
                hideDataPoints={false}
                dataPointsColor={color}
                dataPointsRadius={6}
                width={computedWidth}
                height={150}
                spacing={spacing}
                initialSpacing={initialSpacing}
                endSpacing={0}
                curved={false}
                scrollToEnd={!maxPoints}
                disableScroll={!!maxPoints}
                yAxisLabelWidth={0} // Disable internal Y-axis width reservation
                maxValue={stepValue * targetSections}
                noOfSections={targetSections}
                yAxisOffset={0}
                onPress={(item: any) => {
                  if (!item.isInterpolated) {
                     onPointSelect?.({ value: item.realValue, date: item.date });
                  }
                }}
                onBackgroundPress={() => {
                  onPointSelect?.(null);
                }}
                focusEnabled
                showStripOnFocus
                pointerConfig={{
                pointerStripUptoDataPoint: true,
                pointerStripColor: textColor,
                pointerStripWidth: 1,
                strokeDashArray: [2, 4],
                pointerColor: color,
                radius: 0, 
                activatePointersOnLongPress: false,
                autoAdjustPointerLabelPosition: true,
                pointerVibrateOnPress: true,
                pointerOnPress: true,
                persistPointer: false,
                onPointerChange: (items: any) => {
                    if (items && items.length > 0 && items[0].realValue !== undefined && !items[0].isInterpolated) {
                       onPointSelect?.({ value: items[0].realValue, date: items[0].date });
                    } else if (!items || items.length === 0 || (items[0] && items[0].isInterpolated)) {
                       // Do not clear selection if just passing over a gap? 
                       // Or clear it? Better to clear or keep last valid?
                       // User expects touch on gap to do nothing or clear.
                       onPointSelect?.(null);
                    }
                },
                }}
            />
         </View>

         {/* Custom Y-Axis Labels */}
         <View style={{ width: yAxisWidth, height: 151,  justifyContent: 'space-between', marginLeft: 8 }}>
            {[...yAxisLabelTexts].reverse().map((label, idx) => (
                <View key={idx} style={{ height: 20, justifyContent: 'center', alignItems: 'flex-end', marginTop: idx === 0 ? -10 : 0, marginBottom: idx === yAxisLabelTexts.length - 1 ? -10 : 0 }}>
                    <Text style={{ color: textColor, fontSize: 10 }}>{label}</Text>
                </View>
            ))}
         </View>
      </View>

      {/* Custom X-Axis Labels for Fixed Timeline */}
      {maxPoints && fixedLabels.length > 0 && (
          <View 
            style={{ 
                width: availableChartWidth, 
                paddingLeft: 0, 
                paddingRight: 0 
            }} 
            className="flex-row justify-between mt-2"
          >
              {fixedLabels.map((label, idx) => (
                  <View key={idx} style={{ width: 40, alignItems: idx === 0 ? 'flex-start' : idx === 4 ? 'flex-end' : 'center' }}>
                    <Text className="text-[10px]" style={{ color: textColor }}>{label}</Text>
                  </View>
              ))}
          </View>
      )}
    </View>
  );
}
