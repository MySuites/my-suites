import React from 'react';
import { View, TouchableOpacity, useWindowDimensions, Animated as RNAnimated } from 'react-native';

interface HorizontalSelectorWheelProps {
    value: number;
    onValueChange: (val: number) => void;
    values: number[];
    itemWidth: number;
    unit?: string;
}

export function HorizontalSelectorWheel({
    value,
    onValueChange,
    values,
    itemWidth,
    unit = 'lb'
}: HorizontalSelectorWheelProps) {
    const { width } = useWindowDimensions();
    const inlineData = React.useMemo(() => [null, ...values, null], [values]);
    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    const scrollViewRef = React.useRef<any>(null);
    const [localSelectedValue, setLocalSelectedValue] = React.useState(value);

    const getScrollOffset = React.useCallback((val: number) => {
        const closest = values.reduce((prev, curr) =>
            Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
        );
        const idx = inlineData.indexOf(closest);
        return idx !== -1 ? idx * itemWidth : 0;
    }, [values, inlineData, itemWidth]);

    React.useEffect(() => {
        if (value !== localSelectedValue) {
            setLocalSelectedValue(value);
            const offset = getScrollOffset(value);
            scrollX.setValue(offset);
            scrollViewRef.current?.scrollTo({ x: offset, animated: false });
        }
    }, [value, localSelectedValue, getScrollOffset, scrollX]);

    const handleScrollEnd = React.useCallback((event: any) => {
        const offset = event.nativeEvent.contentOffset.x;
        const idx = Math.round(offset / itemWidth);
        if (idx >= 0 && idx < inlineData.length) {
            const newVal = inlineData[idx];
            if (newVal !== null) {
                setLocalSelectedValue(newVal);
                onValueChange(newVal);
            }
        }
    }, [inlineData, itemWidth, onValueChange]);

    return (
        <View style={{ height: 56, width: width, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
            <View 
                className="absolute border-l border-r border-primary/20 bg-primary/5"
                style={{ 
                    width: itemWidth, 
                    left: (width - itemWidth) / 2, 
                    top: 0, 
                    bottom: 0, 
                    borderRadius: 12 
                }} 
                pointerEvents="none" 
            />
            <RNAnimated.ScrollView
                ref={scrollViewRef}
                horizontal
                onLayout={() => {
                    const offset = getScrollOffset(value);
                    scrollViewRef.current?.scrollTo({ x: offset, animated: false });
                }}
                showsHorizontalScrollIndicator={false}
                snapToInterval={itemWidth}
                snapToAlignment="center"
                decelerationRate="fast"
                onScroll={RNAnimated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingHorizontal: (width - itemWidth) / 2
                }}
            >
                {inlineData.map((item, i) => {
                    const itemX = i * itemWidth;
                    const scale = scrollX.interpolate({
                        inputRange: [itemX - itemWidth, itemX, itemX + itemWidth],
                        outputRange: [0.5, 1.0, 0.5],
                        extrapolate: 'clamp',
                    });
                    const opacity = scrollX.interpolate({
                        inputRange: [itemX - itemWidth, itemX, itemX + itemWidth],
                        outputRange: [0.25, 1.0, 0.25],
                        extrapolate: 'clamp',
                    });

                    return (
                        <TouchableOpacity 
                            key={`inline-item-${i}`}
                            style={{ width: itemWidth, height: 56 }} 
                            className="items-center justify-center flex-row"
                            disabled={item === null}
                            onPress={() => {
                                if (item !== null) {
                                    const idx = inlineData.indexOf(item);
                                    scrollViewRef.current?.scrollTo({ x: idx * itemWidth, animated: true });
                                    setLocalSelectedValue(item);
                                    onValueChange(item);
                                }
                            }}
                        >
                            {item !== null && (
                                <RNAnimated.View 
                                    style={{ 
                                        opacity, 
                                        transform: [{ scale }],
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <RNAnimated.Text className="font-black text-4xl text-light dark:text-dark">
                                        {item}
                                    </RNAnimated.Text>
                                    {unit && (
                                        <RNAnimated.Text className="font-black text-xs ml-0.5 text-light dark:text-dark">
                                            {unit}
                                        </RNAnimated.Text>
                                    )}
                                </RNAnimated.View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </RNAnimated.ScrollView>
        </View>
    );
}
