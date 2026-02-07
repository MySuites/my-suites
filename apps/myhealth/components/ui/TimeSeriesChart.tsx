import React from 'react';
import { View, Dimensions, Text, TouchableWithoutFeedback } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export type DateRange = 'Day' | 'Week' | 'Month' | '3Month' | '6Month' | 'Year' | 'All';
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';

interface TimeSeriesChartProps {
  data: { value: number; label?: string; date: string; spineIndex?: number }[];
  color?: string;
  textColor?: string;
  maxPoints?: number;
  selectedRange?: DateRange;
  aggregation?: AggregationType;
  onPointSelect?: (item: { value: number; date: string } | null) => void;
  height?: number;
}

export function TimeSeriesChart({ 
  data, 
  color = '#3b82f6', 
  textColor = '#9ca3af', 
  maxPoints, 
  selectedRange, 
  aggregation,
  onPointSelect,
  height = 150
}: TimeSeriesChartProps) {
  
  // Pre-process data if aggregation is requested
  const processedData = React.useMemo(() => {
      if (!aggregation || !selectedRange || !data || data.length === 0) {
          return data;
      }

      // 1. Define Spine / Buckets based on Range
      const now = new Date();
      let startDate = new Date();
      let bucketUnit: 'hour' | 'day' | 'week' | 'month' = 'day';
      let bucketCount = maxPoints || 12;

      // Reset start date logic (mirroring previous logic from consumers)
      const todayY = now.getFullYear();
      const todayM = now.getMonth();
      const todayD = now.getDate();
      
      // Calculate Start Date & Unit
      if (selectedRange === 'Day') {
          startDate = new Date(todayY, todayM, todayD); // Today 00:00
          bucketUnit = 'hour';
          bucketCount = 24; // Implicit 24h spine? Or user passed maxPoints=8? 
          // If maxPoints is set, we might stick to that, but for aggregation we need to know what "bucket" means.
          // Let's assume strict time-based bucketing if aggregation is on.
      } else if (selectedRange === 'Week') {
          startDate = new Date(todayY, todayM, todayD - 6);
          startDate.setHours(0,0,0,0);
          bucketUnit = 'day';
          bucketCount = 7;
      } else if (selectedRange === 'Month') {
          startDate = new Date(todayY, todayM, todayD - 30);
          startDate.setHours(0,0,0,0);
          bucketUnit = 'day';
          bucketCount = 31;
      } else if (selectedRange === '3Month') {
          startDate = new Date(todayY, todayM, todayD - (12 * 7)); // Approx
          startDate.setHours(0,0,0,0);
          bucketUnit = 'week';
          bucketCount = 13;
      } else if (selectedRange === '6Month') {
          startDate = new Date(todayY, todayM, todayD - (25 * 7));
          startDate.setHours(0,0,0,0);
          bucketUnit = 'week';
          bucketCount = 26;
      } else if (selectedRange === 'Year') {
          startDate = new Date(todayY, todayM - 11, 1);
          startDate.setHours(0,0,0,0);
          bucketUnit = 'month';
          bucketCount = 12;
      } else if (selectedRange === 'All') {
          // All time? fallback
          return data;
      }

      // 2. Create Buckets
      const buckets: { values: { val: number, date: string }[], spineIndex: number, date: string }[] = [];
      // Initialize if we want empty buckets? 
      // TimeSeriesChart core logic handles sparse data via interpolation if maxPoints is set.
      // But for aggregation, we typically want to output properly indexed points.
      
      // We can just iterate data and assign to buckets? Or iterate 0..bucketCount?
      // Iterating data is faster if sparse.
      // Iterating buckets ensures full spine if we want 0s. 
      // Let's iterate data and map to spineIndex.
      
      const startProps = { y: startDate.getFullYear(), m: startDate.getMonth(), d: startDate.getDate(), time: startDate.getTime() };
      
      data.forEach(item => {
          const d = new Date(item.date);
          if (d < startDate) return;

          let index = -1;
          if (bucketUnit === 'hour') {
              // Only if same day
             if (d.getDate() === startProps.d && d.getMonth() === startProps.m && d.getFullYear() === startProps.y) {
                 index = d.getHours(); // 0-23. If maxPoints is 8 (every 3h), we might need to map 0-23 -> 0-7? 
                 // If we strictly follow spineIndex being 0..maxPoints-1
                 if (maxPoints && maxPoints < 24) {
                     // e.g. 8 points -> 24/8 = 3h window
                     const window = 24 / maxPoints;
                     index = Math.floor(d.getHours() / window);
                 }
             }
          } else if (bucketUnit === 'day') {
              const diffTime = d.getTime() - startDate.getTime();
              index = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          } else if (bucketUnit === 'week') {
              const diffTime = d.getTime() - startDate.getTime();
              index = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
          } else if (bucketUnit === 'month') {
              index = (d.getFullYear() - startProps.y) * 12 + (d.getMonth() - startProps.m);
          }

          if (index >= 0 && (maxPoints ? index < maxPoints : true)) { // Allow open ended if no maxPoints?
             // Find or create bucket
             let b = buckets.find(b => b.spineIndex === index);
             if (!b) {
                 b = { values: [], spineIndex: index, date: item.date }; // Initial date
                 buckets.push(b);
             }
             b.values.push({ val: item.value, date: item.date });
             // Update date to latest in bucket?
             if (new Date(item.date) > new Date(b.date)) b.date = item.date;
          }
      });

      // 3. Aggregate
      return buckets.map(b => {
          const values = b.values.map(v => v.val);
          let resultValue = 0;
          
          if (aggregation === 'sum') {
              resultValue = values.reduce((a, c) => a + c, 0);
          } else if (aggregation === 'avg') {
              resultValue = values.reduce((a, c) => a + c, 0) / values.length;
          } else if (aggregation === 'min') {
              resultValue = Math.min(...values);
          } else if (aggregation === 'max') {
              resultValue = Math.max(...values);
          } else if (aggregation === 'first') {
              // Sort by date inside bucket logic if needed, but assuming data order usually, 
              // or find earliest date in b.values
              const sorted = b.values.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
              resultValue = sorted[0].val;
          } else if (aggregation === 'last') {
              const sorted = b.values.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
              resultValue = sorted[sorted.length - 1].val;
          }

          // Generate Label?
          // We can leave label empty and let fixedLabels handle it? 
          // Or generate simple label.
          return {
              value: resultValue,
              date: b.date,
              spineIndex: b.spineIndex,
              label: '', // Let chart handle X-axis if fixedLabels used, else empty
          };
      }).sort((a, b) => (a.spineIndex || 0) - (b.spineIndex || 0));

  }, [data, aggregation, selectedRange, maxPoints]);

  if (!processedData || processedData.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
         <Text style={{ color: textColor, fontSize: 12, fontStyle: 'italic' }}>
            No data for {selectedRange === 'Day' ? 'today' : selectedRange === '6Month' ? 'this period' : selectedRange === 'Week' ? 'this week' : selectedRange === 'Month' ? 'this month' : 'this year'}
         </Text>
      </View>
    );
  }

  // Ensure chronological order
  const sortedData = [...processedData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const screenWidth = Dimensions.get('window').width;
  const paddingHorizontal = 70; // Card mx-4 (32) + p-4 (32)
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
      'Day': { count: 8, unit: 'hour' as const }, // Every 3h approx? 24h / 8 = 3h
      'Week': { count: 7, unit: 'date' as const },
      'Month': { count: 31, unit: 'date' as const },
      '3Month': { count: 13, unit: 'week' as const }, // 13 weeks ~ 3 months
      '6Month': { count: 26, unit: 'week' as const },
      'Year': { count: 12, unit: 'month' as const },
      'All': { count: maxPoints, unit: 'month' as const }, // Fallback
    };
    
    const { count, unit } = config[selectedRange] || { count: maxPoints, unit: 'date' };
    
    if (selectedRange === 'Week') {
        // 7 specific days for Week view
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            fixedLabels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
        }
    } else if (selectedRange === 'Day') {
        // 8 points for 24 hours -> every 3 hours
        // 0h, 3h, 6h ... 21h, 24h(now)
        // Or relative to now? Usually linear.
        // Let's assume standard 00:00, 04:00, 08:00... or relative to "Now" - 24h?
        // User said "Day" range. "Day" usually means Today 00:00 - 23:59.
        // If it means "Last 24 Hours", then relative.
        // Let's go with "Today" 00-24h for simplicity/common UX, or rely on passed data.
        // If distinct points, let's just use 4-hour intervals for labels: 0, 4, 8, 12, 16, 20
        [0, 4, 8, 12, 16, 20].forEach(h => {
             const d = new Date();
             d.setHours(h, 0, 0, 0);
             fixedLabels.push(d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
        });
    } else {
        // Standard distribution for others
        [0, 0.25, 0.5, 0.75, 1].forEach(percent => {
            const d = new Date(now);
            const unitsAgo = Math.round((count - 1) * (1 - percent));
            if (unit === 'date') d.setDate(d.getDate() - unitsAgo);
            else if (unit === 'week') d.setDate(d.getDate() - unitsAgo * 7);
            else if (unit === 'month') d.setMonth(d.getMonth() - unitsAgo);
            else if (unit === 'hour') d.setHours(d.getHours() - unitsAgo * 3); // 3h steps roughly
            
            if (unit === 'hour') {
                fixedLabels.push(d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
            } else {
                fixedLabels.push(d.toLocaleDateString(undefined, unit === 'month' ? { month: 'short' } : { month: 'short', day: 'numeric' }));
            }
        });
    }

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
    <TouchableWithoutFeedback onPress={() => onPointSelect?.(null)}>
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
                    {(selectedRange === 'Week' 
                        ? [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1] // 7 Vertical Lines for Week
                        : [0.25, 0.5, 0.75] // Default 4 sections for others
                    ).map(p => (
                    <React.Fragment key={p}>
                        <View style={{ position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: textColor }} />
                        {/* Only default horizontal lines? Or keep them same? Keep default horizontal grid */}
                        {selectedRange !== 'Week' && (
                             <View style={{ position: 'absolute', top: `${p * 100}%`, left: 0, right: 0, height: 1, backgroundColor: textColor }} />
                        )}
                    </React.Fragment>
                    ))}
                    {selectedRange === 'Week' && (
                        // Draw standard horizontal grid for Week separately to avoid dupes/mess if we want 4 horizontal lines
                        [0.25, 0.5, 0.75].map(p => (
                             <View key={`h-${p}`} style={{ position: 'absolute', top: `${p * 100}%`, left: 0, right: 0, height: 1, backgroundColor: textColor }} />
                        ))
                    )}
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
                height={height}
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
         <View style={{ width: yAxisWidth, height: height + 25, marginLeft: 8 }}>
            {[...yAxisLabelTexts].reverse().map((label, idx) => (
                <View 
                    key={idx} 
                    style={{ 
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${(idx / targetSections) * 100}%` as any,
                        marginTop: -6, // Centering text roughly
                        justifyContent: 'center', 
                        alignItems: 'flex-end',
                        transform: [{ translateY: -4 }] 
                    }}
                >
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
              {fixedLabels.map((label, idx) => {
                  // align strategy: first left, last right, others center?
                  // with 7 items justify-between handles spacing, but alignment needs care
                  const isFirst = idx === 0;
                  const isLast = idx === fixedLabels.length - 1;
                  return (
                    <View key={idx} style={{ 
                        width: 40, 
                        alignItems: isFirst ? 'flex-start' : isLast ? 'flex-end' : 'center' 
                    }}>
                        <Text className="text-[10px]" style={{ color: textColor }}>{label}</Text>
                    </View>
                  );
              })}
          </View>
      )}
    </View>
    </TouchableWithoutFeedback>
  );
}
