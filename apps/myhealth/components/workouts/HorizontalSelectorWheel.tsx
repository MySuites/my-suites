import React from 'react';
import { View, TouchableOpacity, useWindowDimensions, Animated as RNAnimated } from 'react-native';
import { useSetPagerScrollLock } from '../exercises/SetPagerScrollLock';

interface HorizontalSelectorWheelProps {
    value: number;
    onValueChange: (val: number) => void;
    values: number[];
    itemWidth: number;
    unit?: string;
    // Width the wheel centers itself within. Defaults to the full screen
    // width (the original single-wheel behavior, e.g. the weight wheel).
    // Pass a smaller value to fit two wheels side by side, e.g. for
    // unilateral (L/R) reps.
    containerWidth?: number;
    // When the item at a given slot equals this value, its text renders in
    // goalColor instead of the default — marks the progressive-overload
    // suggestion directly on the wheel (rather than a separate tappable
    // badge), visible even while scrolling past it as a neighbor.
    goalValue?: number;
    goalColor?: string;
    // Overrides how each numeric value is rendered - e.g. forcing an
    // explicit "+"/"-" sign for wheels where the values are relative to a
    // baseline (bodyweight ± assistance/added load) rather than absolute.
    // Defaults to plain number-to-string.
    formatValue?: (val: number) => string;
}

function HorizontalSelectorWheelBase({
    value,
    onValueChange,
    values,
    itemWidth,
    unit = 'lb',
    containerWidth,
    goalValue,
    goalColor,
    formatValue = (v) => String(v),
}: HorizontalSelectorWheelProps) {
    const { width: windowWidth } = useWindowDimensions();
    const width = containerWidth ?? windowWidth;
    const { lock: lockSetPager, unlock: unlockSetPager } = useSetPagerScrollLock();
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
                // Disable the outer set-swipe pager for the duration of any
                // touch on this wheel. Same-axis nested horizontal
                // ScrollViews negotiate gestures unreliably in RN — without
                // this, the outer pager can intermittently steal part of a
                // drag, causing the wheel to snap to the wrong value.
                onTouchStart={lockSetPager}
                onTouchEnd={unlockSetPager}
                onTouchCancel={unlockSetPager}
                onLayout={() => {
                    const offset = getScrollOffset(value);
                    // Keep scrollX in sync with the initial scroll position so the
                    // selected (centered) item interpolates to full opacity/scale
                    // — otherwise it renders faded because scrollX is still 0.
                    scrollX.setValue(offset);
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
                            {item !== null && (() => {
                                const isGoal = goalValue !== undefined && goalColor && item === goalValue;
                                return (
                                    <RNAnimated.View
                                        style={{
                                            opacity,
                                            transform: [{ scale }],
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <RNAnimated.Text
                                            className="font-black text-4xl text-light dark:text-dark"
                                            style={isGoal ? { color: goalColor } : undefined}
                                        >
                                            {formatValue(item)}
                                        </RNAnimated.Text>
                                        {unit && (
                                            <RNAnimated.Text
                                                className="font-black text-xs ml-0.5 text-light dark:text-dark"
                                                style={isGoal ? { color: goalColor } : undefined}
                                            >
                                                {unit}
                                            </RNAnimated.Text>
                                        )}
                                    </RNAnimated.View>
                                );
                            })()}
                        </TouchableOpacity>
                    );
                })}
            </RNAnimated.ScrollView>
        </View>
    );
}

// Memoized so it skips re-render when the parent card re-renders for unrelated
// reasons (timer ticks, exercise swipe). Only re-renders when value/config
// changes — requires a stable onValueChange from the caller.
export const HorizontalSelectorWheel = React.memo(HorizontalSelectorWheelBase);
