import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface VerticalSelectorWheelProps {
    value: number;
    onValueChange: (val: number) => void;
    values: number[];
    itemHeight: number;
    width: number;
    // Number of rows visible in the wheel's viewport (must be odd so one row
    // centers exactly). Defaults to 3.
    visibleItems?: number;
    // When the item at a given slot equals this value, its text renders in
    // goalColor instead of the default — marks the progressive-overload
    // suggestion directly on the wheel, same treatment as
    // HorizontalSelectorWheel's weight/reps wheels.
    goalValue?: number;
    goalColor?: string;
    // Custom row content, e.g. a unit suffix or decimal formatting. Defaults
    // to the plain scale/opacity-faded number rendering below.
    renderItem?: (item: number, isSelected: boolean) => React.ReactNode;
    isHapticsEnabled?: boolean;
}

function VerticalSelectorWheelBase({
    value,
    onValueChange,
    values,
    itemHeight,
    width,
    visibleItems = 3,
    goalValue,
    goalColor,
    renderItem,
    isHapticsEnabled = true,
}: VerticalSelectorWheelProps) {
    const padCount = Math.floor(visibleItems / 2);
    const padding = React.useMemo(() => Array(padCount).fill(null), [padCount]);
    const inlineData = React.useMemo(() => [...padding, ...values, ...padding], [padding, values]);
    const scrollRef = React.useRef<ScrollView>(null);
    const [localSelectedValue, setLocalSelectedValue] = React.useState(value);

    // Synchronize prop value change to state and scroll position
    React.useEffect(() => {
        setLocalSelectedValue(value);
        const idx = values.indexOf(value);
        if (idx !== -1 && scrollRef.current) {
            scrollRef.current.scrollTo({ y: idx * itemHeight, animated: false });
        }
    }, [value, values, itemHeight]);

    const handleScroll = React.useCallback((event: any) => {
        const offset = event.nativeEvent.contentOffset.y;
        const idx = Math.round(offset / itemHeight);
        if (idx >= 0 && idx < values.length) {
            const newVal = values[idx];
            if (newVal !== localSelectedValue) {
                setLocalSelectedValue(newVal);
                if (isHapticsEnabled) {
                    Haptics.selectionAsync();
                }
            }
        }
    }, [values, itemHeight, localSelectedValue, isHapticsEnabled]);

    const handleScrollEnd = React.useCallback((event: any) => {
        const offset = event.nativeEvent.contentOffset.y;
        const idx = Math.round(offset / itemHeight);
        if (idx >= 0 && idx < values.length) {
            const newVal = values[idx];
            onValueChange(newVal);
        }
    }, [values, itemHeight, onValueChange]);

    return (
        <View style={{ height: itemHeight * visibleItems, width: width }} className="items-center">
            <ScrollView
                ref={scrollRef}
                onLayout={() => {
                    const idx = values.indexOf(value);
                    if (idx !== -1 && scrollRef.current) {
                        scrollRef.current.scrollTo({ y: idx * itemHeight, animated: false });
                    }
                }}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                onScroll={handleScroll}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
            >
                {inlineData.map((item, i) => (
                    <TouchableOpacity 
                        key={`inline-v-${i}`}
                        style={{ height: itemHeight, width: width }} 
                        className="items-center justify-center"
                        disabled={item === null}
                        onPress={() => {
                            if (item !== null) {
                                const idx = values.indexOf(item);
                                scrollRef.current?.scrollTo({ y: idx * itemHeight, animated: true });
                                setLocalSelectedValue(item);
                                onValueChange(item);
                            }
                        }}
                    >
                        {item !== null && (
                            renderItem ? renderItem(item, item === localSelectedValue) : (
                                <Text
                                    className="font-black text-light dark:text-dark"
                                    style={{
                                        fontSize: item === localSelectedValue ? 36 : 16,
                                        opacity: item === localSelectedValue ? 1.0 : 0.1,
                                        transform: [{ scale: item === localSelectedValue ? 1.0 : 0.9 }],
                                        ...(goalValue !== undefined && goalColor && item === goalValue ? { color: goalColor } : null),
                                    }}
                                >
                                    {item}
                                </Text>
                            )
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

// Memoized so it skips re-render on unrelated parent re-renders (timer ticks,
// exercise swipe). Requires a stable onValueChange from the caller.
export const VerticalSelectorWheel = React.memo(VerticalSelectorWheelBase);
