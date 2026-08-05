import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Animated as RNAnimated } from 'react-native';
import { useUITheme } from '@mysuite/ui';
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
    // When the item at a given slot equals this value, its tick renders blue/
    // light-blue instead of primary/gray (see GOAL_BLUE/GOAL_LIGHT_BLUE) —
    // marks the progressive-overload suggestion directly on the ruler.
    // `goalColor` is used only for the current-value label's text color.
    goalValue?: number;
    goalColor?: string;
    // Overrides how each numeric value is rendered in the current-value
    // label below the ruler - e.g. forcing an explicit "+"/"-" sign for
    // wheels where the values are relative to a baseline (bodyweight ±
    // assistance/added load) rather than absolute. Defaults to plain
    // number-to-string.
    formatValue?: (val: number) => string;
    // Every Nth tick (by position in `values`) renders taller, ruler-style.
    // Defaults to 5. Ignored if `getTickSize` is provided.
    majorTickEvery?: number;
    // Classifies each tick's height by its actual value (e.g. big at every
    // 10, medium at every 5, small otherwise for a weight wheel) instead of
    // the plain index-based majorTickEvery. Takes precedence when provided.
    getTickSize?: (val: number) => 'lg' | 'md' | 'sm';
}

const TICK_DIMENSIONS: Record<'lg' | 'md' | 'sm', { width: number; height: number }> = {
    lg: { width: 4, height: 28 },
    md: { width: 3.5, height: 21 },
    sm: { width: 3, height: 14 },
};

// Fixed (not theme-derived) - the goal tick is always this literal blue/
// light-blue regardless of app theme, so it reads as a distinct marker from
// the primary-color fill.
const GOAL_BLUE = '#2563EB';
const GOAL_LIGHT_BLUE = '#93C5FD';

export interface CurrentValueLabelHandle {
    setValue: (val: number) => void;
}

// Live-updating "current value" readout shown under the ruler. Isolated into
// its own component, updated imperatively via a ref (see setValue) from the
// parent's scroll listener, so its per-frame state updates while dragging
// only re-render this small label, not the ~200-item tick strip above it.
const CurrentValueLabel = React.forwardRef<CurrentValueLabelHandle, {
    unit?: string;
    formatValue: (val: number) => string;
    goalValue?: number;
    goalColor?: string;
    initialValue: number;
}>(function CurrentValueLabel({ unit, formatValue, goalValue, goalColor, initialValue }, ref) {
    const [displayValue, setDisplayValue] = React.useState(initialValue);

    React.useImperativeHandle(ref, () => ({
        setValue: (val: number) => setDisplayValue((prev) => (prev === val ? prev : val)),
    }), []);

    const isGoal = goalValue !== undefined && goalColor && displayValue === goalValue;

    return (
        <View className="items-center justify-center flex-row mt-3">
            <Text
                className="font-black text-2xl text-light dark:text-dark"
                style={isGoal ? { color: goalColor } : undefined}
            >
                {formatValue(displayValue)}
            </Text>
            {unit ? (
                <Text
                    className="font-black text-xs ml-0.5 text-light dark:text-dark"
                    style={isGoal ? { color: goalColor } : undefined}
                >
                    {unit}
                </Text>
            ) : null}
        </View>
    );
});

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
    majorTickEvery = 5,
    getTickSize,
}: HorizontalSelectorWheelProps) {
    const { width: windowWidth } = useWindowDimensions();
    const width = containerWidth ?? windowWidth;
    const theme = useUITheme();
    const { lock: lockSetPager, unlock: unlockSetPager } = useSetPagerScrollLock();
    const inlineData = React.useMemo(() => [null, ...values, null], [values]);
    // Native-driven so the fill overlay's translateX (below) tracks the
    // actual native scroll with zero lag - a JS-driven transform goes
    // through the bridge each frame and visibly trails a frame behind.
    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    // Drives the filled-tick overlay below - a mirror strip shifted the
    // opposite direction of scroll, so it stays pixel-locked to the same
    // content as the scrolling ticks underneath.
    const overlayTranslateX = React.useMemo(() => RNAnimated.multiply(scrollX, -1), [scrollX]);
    const scrollViewRef = React.useRef<any>(null);
    const labelRef = React.useRef<CurrentValueLabelHandle>(null);
    const [localSelectedValue, setLocalSelectedValue] = React.useState(value);

    // Shared per-tick metadata for both the interactive strip and the
    // filled-color overlay, so the two stay visually identical.
    const tickMeta = React.useMemo(
        () => inlineData.map((item, i) => {
            if (item === null) return null;
            const valueIndex = i - 1;
            const tickSize = getTickSize
                ? getTickSize(item)
                : (valueIndex % majorTickEvery === 0 ? 'lg' : 'sm');
            const isGoal = goalValue !== undefined && item === goalValue;
            return { item, tickSize, isGoal };
        }),
        [inlineData, getTickSize, majorTickEvery, goalValue]
    );

    const getScrollOffset = React.useCallback((val: number) => {
        const closest = values.reduce((prev, curr) =>
            Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
        );
        const idx = inlineData.indexOf(closest);
        return idx !== -1 ? idx * itemWidth : 0;
    }, [values, inlineData, itemWidth]);

    // Shared by the scroll listener and the two sync points below (onLayout,
    // and the value-prop-changed effect) so the label always reflects the
    // nearest real value to a given raw scroll offset.
    const updateLabelForOffset = React.useCallback((offset: number) => {
        const idx = Math.round(offset / itemWidth);
        if (idx >= 0 && idx < inlineData.length) {
            const nearest = inlineData[idx];
            if (nearest !== null) {
                labelRef.current?.setValue(nearest);
            }
        }
    }, [inlineData, itemWidth]);

    React.useEffect(() => {
        if (value !== localSelectedValue) {
            setLocalSelectedValue(value);
            const offset = getScrollOffset(value);
            scrollX.setValue(offset);
            updateLabelForOffset(offset);
            scrollViewRef.current?.scrollTo({ x: offset, animated: false });
        }
    }, [value, localSelectedValue, getScrollOffset, scrollX, updateLabelForOffset]);

    // Native-driven for smooth scrolling/overlay tracking, but with a
    // `listener` callback - RN's built-in mechanism for also getting a
    // JS-side callback on every scroll event even though the value itself is
    // native-driven. (A plain `scrollX.addListener` on a native-driven value
    // only mirrors back to JS on a best-effort/throttled basis, which is why
    // the label previously stalled during drag; composing two separate
    // Animated.event calls doesn't work either - in this RN version,
    // Animated.event returns an object that isn't a plain callable
    // function.) This keeps native-driven smoothness for the overlay and a
    // reliable per-event callback for the label from one handler.
    const onScrollWithLabel = React.useMemo(() => RNAnimated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: true,
            listener: (event: any) => {
                updateLabelForOffset(event.nativeEvent.contentOffset.x);
            },
        }
    ), [scrollX, updateLabelForOffset]);

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
        <View>
            <View style={{ height: 56, width: width, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                {/* Selection indicator - a triangle centered under the ruler,
                    pointing up at whichever tick is currently centered. */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: width / 2 - 6,
                        bottom: -8,
                        width: 0,
                        height: 0,
                        borderLeftWidth: 6,
                        borderRightWidth: 6,
                        borderBottomWidth: 8,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderBottomColor: theme.primary,
                    }}
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
                        // Keep scrollX (the fill overlay) and the label in
                        // sync with the initial scroll position, not left
                        // defaulting to 0.
                        scrollX.setValue(offset);
                        updateLabelForOffset(offset);
                        scrollViewRef.current?.scrollTo({ x: offset, animated: false });
                    }}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={itemWidth}
                    // "start" (the default), not "center" - centering is already
                    // done via contentContainerStyle's paddingHorizontal below,
                    // so the offset math (idx * itemWidth) lines up with where
                    // items actually render. Combining that with snapToAlignment
                    // "center" double-applies centering and snaps the selected
                    // tick about half a slot off from the highlight window.
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onScroll={onScrollWithLabel}
                    // onMomentumScrollEnd only - not onScrollEndDrag. With
                    // snapToInterval set, releasing a drag always kicks off a
                    // momentum/settle phase (even from ~zero velocity, to
                    // animate into the snap point), so onMomentumScrollEnd
                    // reliably fires. onScrollEndDrag fires the instant the
                    // finger lifts, before that settle finishes, so it reads
                    // a not-yet-snapped offset - committing from it raced
                    // with the real (correct) momentum-end commit and showed
                    // up as the value teleporting to a wrong tick mid-scroll.
                    onMomentumScrollEnd={handleScrollEnd}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                        paddingHorizontal: (width - itemWidth) / 2
                    }}
                >
                    {inlineData.map((item, i) => {
                        const meta = tickMeta[i];
                        if (item === null || !meta) {
                            return <View key={`pad-${i}`} style={{ width: itemWidth, height: 56 }} />;
                        }

                        const { width: tickWidth, height: tickHeight } = TICK_DIMENSIONS[meta.tickSize];
                        // Unfilled color only - the overlay below paints the
                        // filled (primary/goal-blue) version on top wherever
                        // the ruler has actually scrolled past. See the
                        // overlay's comment for why coloring is split this
                        // way instead of animating each tick's color.
                        const backgroundColor = meta.isGoal ? GOAL_LIGHT_BLUE : (theme.textMuted ?? theme.text);

                        return (
                            <TouchableOpacity
                                key={`tick-${i}`}
                                style={{ width: itemWidth, height: 56 }}
                                onPress={() => {
                                    const idx = inlineData.indexOf(item);
                                    scrollViewRef.current?.scrollTo({ x: idx * itemWidth, animated: true });
                                    setLocalSelectedValue(item);
                                    onValueChange(item);
                                }}
                            >
                                {/* Absolutely positioned at a fixed bottom instead
                                    of flex justify-end, so every tick's bottom
                                    edge lands on the exact same pixel regardless
                                    of its height (lg/md/sm). */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 4,
                                        left: (itemWidth - tickWidth) / 2,
                                        width: tickWidth,
                                        height: tickHeight,
                                        borderRadius: 1,
                                        backgroundColor,
                                    }}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </RNAnimated.ScrollView>
                {/* Filled-tick overlay - a mirror of the strip above, colored
                    primary/goal-blue, clipped to a static window from the
                    left edge up to the triangle's fixed x position (the
                    triangle never moves - only the content scrolls under it,
                    so this boundary is constant and needs no animation
                    itself). The mirror is kept in sync with the real scroll
                    purely via `overlayTranslateX`, one native-driven
                    transform for the whole layer - live during drag, and
                    cheap, unlike animating ~200 individual tick colors
                    (which either renders garbled intermediate colors on the
                    native driver, or floods the JS thread on the JS driver
                    with per-tick recomputes every scroll frame). */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        // Extended past the triangle's exact center (width/2)
                        // by half a tick slot - the selected tick itself is
                        // centered ON that boundary, so clipping at exactly
                        // width/2 sliced it in half instead of including the
                        // whole mark.
                        width: width / 2 + itemWidth / 2,
                        height: 56,
                        overflow: 'hidden',
                    }}
                >
                    <RNAnimated.View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            height: 56,
                            paddingHorizontal: (width - itemWidth) / 2,
                            transform: [{ translateX: overlayTranslateX }],
                        }}
                    >
                        {inlineData.map((item, i) => {
                            const meta = tickMeta[i];
                            if (item === null || !meta) {
                                return <View key={`fill-pad-${i}`} style={{ width: itemWidth, height: 56 }} />;
                            }
                            const { width: tickWidth, height: tickHeight } = TICK_DIMENSIONS[meta.tickSize];
                            const backgroundColor = meta.isGoal ? GOAL_BLUE : theme.primary;
                            return (
                                <View key={`fill-${i}`} style={{ width: itemWidth, height: 56 }}>
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 4,
                                            left: (itemWidth - tickWidth) / 2,
                                            width: tickWidth,
                                            height: tickHeight,
                                            borderRadius: 1,
                                            backgroundColor,
                                        }}
                                    />
                                </View>
                            );
                        })}
                    </RNAnimated.View>
                </View>
            </View>
            <CurrentValueLabel
                ref={labelRef}
                unit={unit}
                formatValue={formatValue}
                goalValue={goalValue}
                goalColor={goalColor}
                initialValue={value}
            />
        </View>
    );
}

// Memoized so it skips re-render when the parent card re-renders for unrelated
// reasons (timer ticks, exercise swipe). Only re-renders when value/config
// changes — requires a stable onValueChange from the caller.
export const HorizontalSelectorWheel = React.memo(HorizontalSelectorWheelBase);
