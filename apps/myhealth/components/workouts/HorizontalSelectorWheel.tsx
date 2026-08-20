import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Animated as RNAnimated, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUITheme } from '@mysuite/ui';
import { useSetPagerScrollLock } from '../exercises/ExerciseCard';

type TickSize = 'lg' | 'md' | 'sm';

interface HorizontalSelectorWheelProps {
    value: number;
    onValueChange: (val: number) => void;
    values: number[];
    itemWidth: number;
    unit?: string;
    // Width the wheel centers itself within. Defaults to the full screen
    // width (e.g. the weight wheel). Pass a smaller value to fit two wheels
    // side by side, e.g. for unilateral (L/R) reps.
    containerWidth?: number;
    // When a tick's value equals this, it renders blue/light-blue instead of
    // primary/gray (see GOAL_BLUE/GOAL_LIGHT_BLUE) - marks the progressive-
    // overload suggestion directly on the ruler. `goalColor` is used only for
    // the current-value label's text color.
    goalValue?: number;
    goalColor?: string;
    // Overrides how each numeric value is rendered in the current-value
    // label below the ruler - e.g. forcing an explicit "+"/"-" sign for
    // wheels whose values are relative to a baseline (bodyweight ±
    // assistance/added load) rather than absolute.
    formatValue?: (val: number) => string;
    // Every Nth tick (by position in `values`) renders taller, ruler-style.
    // Ignored if `getTickSize` is provided.
    majorTickEvery?: number;
    // Classifies each tick's height by its actual value (e.g. big at every
    // 10, medium at every 5, small otherwise for a weight wheel) instead of
    // the plain index-based majorTickEvery. Takes precedence when provided.
    getTickSize?: (val: number) => TickSize;
    isHapticsEnabled?: boolean;
    // Ticks whose value is a multiple of this get a number label below them.
    labelIncrement?: number;
    // Suppresses the wheel's own built-in current-value label under the
    // ruler - use together with valueLabelRef to render that live value
    // somewhere else instead (e.g. a header row next to the section title).
    hideValueLabel?: boolean;
    valueLabelRef?: React.RefObject<CurrentValueLabelHandle | null>;
}

// +16 over the ruler's own footprint reserves room for the increment-of-5
// value labels below each tick - without it, the horizontal ScrollView
// clips them since they'd render below its own frame height.
const WHEEL_HEIGHT = 72;
const TICK_BOTTOM_INSET = 20;
const TICK_LABEL_HEIGHT = 16;

const TICK_DIMENSIONS: Record<TickSize, { width: number; height: number }> = {
    lg: { width: 4, height: 36 },
    md: { width: 3.5, height: 21 },
    sm: { width: 3, height: 14 },
};

// Fixed (not theme-derived) - the goal tick is always this literal blue/
// light-blue regardless of app theme, so it reads as a distinct marker from
// the primary-color fill.
const GOAL_BLUE = '#2563EB';
const GOAL_LIGHT_BLUE = '#93C5FD';

const FADE_MIN_OPACITY = 0.12;
// Full opacity is held flat out to this fraction of the fade distance before
// any falloff starts, so only the outer quarters on each side actually fade.
const FADE_PLATEAU = 0.5;
// Sample points from center (0) to edge (1), as a fraction of the fade
// distance - denser near the edge. Animated.interpolate is piecewise-linear
// between points, so more points (rather than just [0, 1]) is how you
// approximate a curved falloff instead of a straight-line fade.
const FADE_FRACTIONS = [0, FADE_PLATEAU, 0.65, 0.8, 1];

// Opacity for a tick at fraction `f` (0 = center, 1 = edge): flat at full
// opacity through the plateau, then an exponential (not linear) falloff -
// decays fast right after the plateau and levels off toward the edge.
function fadeOpacityAt(f: number): number {
    if (f <= FADE_PLATEAU) return 1;
    return Math.pow(FADE_MIN_OPACITY, (f - FADE_PLATEAU) / (1 - FADE_PLATEAU));
}

function getFadeOpacityRange(centerX: number, fadeDistance: number) {
    const half = FADE_FRACTIONS.map((f) => ({
        offset: f * fadeDistance,
        opacity: fadeOpacityAt(f),
    }));
    const negative = half.slice(1).reverse().map((p) => ({ offset: -p.offset, opacity: p.opacity }));
    const points = [...negative, ...half];
    return {
        inputRange: points.map((p) => centerX + p.offset),
        outputRange: points.map((p) => p.opacity),
    };
}

export interface CurrentValueLabelHandle {
    setValue: (val: number) => void;
}

export interface CurrentValueLabelProps {
    unit?: string;
    formatValue: (val: number) => string;
    goalValue?: number;
    goalColor?: string;
    initialValue: number;
    // Smaller, un-centered rendering for reuse in a label row outside the
    // wheel (see HorizontalSelectorWheel's hideValueLabel/valueLabelRef).
    // Defaults to the original large centered-under-the-ruler look.
    compact?: boolean;
}

// Live-updating "current value" readout, normally shown under the ruler.
// Isolated into its own component, updated imperatively via a ref (see
// setValue) from the parent's scroll listener, so its per-frame state
// updates while dragging only re-render this small label, not the ~200-item
// tick strip above it. Exported so a caller can render its own instance
// elsewhere (e.g. in a header row) and hand its ref to HorizontalSelectorWheel
// via valueLabelRef instead of using the wheel's built-in placement.
export const CurrentValueLabel = React.forwardRef<CurrentValueLabelHandle, CurrentValueLabelProps>(
    function CurrentValueLabel({ unit, formatValue, goalValue, goalColor, initialValue, compact = false }, ref) {
        const [displayValue, setDisplayValue] = React.useState(initialValue);

        React.useImperativeHandle(ref, () => ({
            setValue: (val: number) => setDisplayValue((prev) => (prev === val ? prev : val)),
        }), []);

        const isGoal = goalValue !== undefined && goalColor && displayValue === goalValue;
        const goalStyle = isGoal ? { color: goalColor } : undefined;

        return (
            <View className={compact ? "items-center flex-row" : "items-center justify-center flex-row mt-1"}>
                <Text className={`font-black text-light dark:text-dark ${compact ? 'text-xl' : 'text-2xl'}`} style={goalStyle}>
                    {formatValue(displayValue)}
                </Text>
                {unit ? (
                    <Text className="font-black text-xs ml-0.5 text-light dark:text-dark" style={goalStyle}>
                        {unit}
                    </Text>
                ) : null}
            </View>
        );
    }
);

interface TickMarkProps {
    size: TickSize;
    slotWidth: number;
    color: string;
    opacity: RNAnimated.AnimatedInterpolation<number>;
}

// A single ruler mark, absolutely positioned at a fixed bottom instead of
// flex-end so every tick's bottom edge lands on the exact same pixel
// regardless of its height (lg/md/sm).
function TickMark({ size, slotWidth, color, opacity }: TickMarkProps) {
    const { width, height } = TICK_DIMENSIONS[size];
    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                bottom: TICK_BOTTOM_INSET,
                left: (slotWidth - width) / 2,
                width,
                height,
                borderRadius: 1,
                backgroundColor: color,
                opacity,
            }}
        />
    );
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
    majorTickEvery = 5,
    getTickSize,
    isHapticsEnabled = true,
    labelIncrement = 5,
    hideValueLabel = false,
    valueLabelRef,
}: HorizontalSelectorWheelProps) {
    const { width: windowWidth } = useWindowDimensions();
    const width = containerWidth ?? windowWidth;
    const theme = useUITheme();
    const { lock: lockSetPager, unlock: unlockSetPager } = useSetPagerScrollLock();
    // Padded either side so the first and last real values can still scroll
    // to the centered (selected) position.
    const inlineData = React.useMemo(() => [null, ...values, null], [values]);
    // Native-driven so the fill overlay's translateX (below) tracks the
    // actual native scroll with zero lag - a JS-driven transform goes
    // through the bridge each frame and visibly trails a frame behind.
    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    // Drives the filled-tick overlay below - a mirror strip shifted the
    // opposite direction of scroll, so it stays pixel-locked to the same
    // content as the scrolling ticks underneath.
    const overlayTranslateX = React.useMemo(() => RNAnimated.multiply(scrollX, -1), [scrollX]);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const internalLabelRef = React.useRef<CurrentValueLabelHandle>(null);
    // Routes value updates to a caller-supplied label (see hideValueLabel)
    // instead of the wheel's own, when one is provided.
    const labelRef = valueLabelRef ?? internalLabelRef;
    const [localSelectedValue, setLocalSelectedValue] = React.useState(value);

    // Per-tick metadata, shared by the interactive strip and the filled-color
    // overlay so the two stay visually identical. `null` marks a padding slot.
    // `getTickSize` (classifies by actual value, e.g. big at every 10) takes
    // precedence when provided; otherwise falls back to the index-based
    // majorTickEvery (every Nth tick renders taller).
    const tickMeta = React.useMemo(
        () => inlineData.map((item, i) => {
            if (item === null) return null;
            const positionInValues = i - 1; // account for the leading pad slot
            const tickSize: TickSize = getTickSize
                ? getTickSize(item)
                : (positionInValues % majorTickEvery === 0 ? 'lg' : 'sm');
            return { item, tickSize, isGoal: goalValue !== undefined && item === goalValue };
        }),
        [inlineData, goalValue, getTickSize, majorTickEvery]
    );

    // Each tick fades out toward either edge of the visible window based on
    // its distance from the centered (triangle) position - native-driven off
    // the same scrollX used for scrolling, so it's live during drag at zero
    // extra cost. (Unlike color, opacity IS supported by the native driver.)
    // Built once per layout and shared by both strips rather than
    // re-interpolated per tick per render.
    const tickOpacities = React.useMemo(
        () => inlineData.map((_, i) => scrollX.interpolate({
            ...getFadeOpacityRange(i * itemWidth, width / 2),
            extrapolate: 'clamp',
        })),
        [inlineData, itemWidth, width, scrollX]
    );

    const getScrollOffset = React.useCallback((val: number) => {
        if (values.length === 0) return 0;
        const closest = values.reduce((prev, curr) =>
            Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
        );
        // +1 for the leading padding slot in inlineData.
        return (values.indexOf(closest) + 1) * itemWidth;
    }, [values, itemWidth]);

    // Nearest real (non-padding) value to a raw scroll offset, or null.
    const valueAtOffset = React.useCallback((offset: number) => {
        const idx = Math.round(offset / itemWidth);
        if (idx < 0 || idx >= inlineData.length) return null;
        return inlineData[idx];
    }, [inlineData, itemWidth]);

    const updateLabelForOffset = React.useCallback((offset: number) => {
        const nearest = valueAtOffset(offset);
        if (nearest !== null) {
            labelRef.current?.setValue(nearest);
        }
    }, [valueAtOffset]);

    // Tracks the last value a tick-crossing haptic fired for, so rapid scroll
    // events landing on the same tick don't re-buzz, and so a programmatic
    // resync (switching sets/exercises via syncToValue) doesn't itself count
    // as a "crossing" the next time the user actually scrolls.
    const lastHapticValueRef = React.useRef<number | null>(null);

    // Jumps the strip, the fill overlay (scrollX) and the label to `val` in
    // one step - used both for the initial layout and whenever the parent
    // pushes down a new value.
    const syncToValue = React.useCallback((val: number) => {
        const offset = getScrollOffset(val);
        scrollX.setValue(offset);
        updateLabelForOffset(offset);
        lastHapticValueRef.current = val;
        scrollViewRef.current?.scrollTo({ x: offset, animated: false });
    }, [getScrollOffset, scrollX, updateLabelForOffset]);

    React.useEffect(() => {
        if (value !== localSelectedValue) {
            setLocalSelectedValue(value);
            syncToValue(value);
        }
    }, [value, localSelectedValue, syncToValue]);

    // Native-driven for smooth scrolling/overlay tracking, but with a
    // `listener` callback - RN's built-in mechanism for also getting a
    // JS-side callback on every scroll event even though the value itself is
    // native-driven. (A plain `scrollX.addListener` on a native-driven value
    // only mirrors back to JS on a throttled basis, which stalls the label
    // during drag; and composing two separate Animated.event calls doesn't
    // work either - in this RN version Animated.event returns an object that
    // isn't a plain callable function.)
    const onScrollWithLabel = React.useMemo(() => RNAnimated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: true,
            listener: (event: any) => {
                const offset = event.nativeEvent.contentOffset.x;
                updateLabelForOffset(offset);
                const nearest = valueAtOffset(offset);
                if (nearest !== null && nearest !== lastHapticValueRef.current) {
                    lastHapticValueRef.current = nearest;
                    if (isHapticsEnabled) {
                        Haptics.selectionAsync();
                    }
                }
            },
        }
    ), [scrollX, updateLabelForOffset, valueAtOffset, isHapticsEnabled]);

    const commitValue = React.useCallback((val: number) => {
        setLocalSelectedValue(val);
        onValueChange(val);
    }, [onValueChange]);

    const handleScrollEnd = React.useCallback((event: any) => {
        const newVal = valueAtOffset(event.nativeEvent.contentOffset.x);
        if (newVal !== null) {
            commitValue(newVal);
        }
    }, [valueAtOffset, commitValue]);

    return (
        <View>
            <View style={{ height: WHEEL_HEIGHT, width, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                {/* Selection indicator - a triangle centered above the ruler,
                    pointing down at whichever tick is currently centered. */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: width / 2 - 7,
                        top: 2,
                        width: 0,
                        height: 0,
                        borderLeftWidth: 7,
                        borderRightWidth: 7,
                        borderTopWidth: 9,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderTopColor: theme.primary,
                    }}
                />
                <RNAnimated.ScrollView
                    ref={scrollViewRef as any}
                    horizontal
                    // Disable the outer set-swipe pager for the duration of any
                    // touch on this wheel. Same-axis nested horizontal
                    // ScrollViews negotiate gestures unreliably in RN — without
                    // this, the outer pager can intermittently steal part of a
                    // drag, causing the wheel to snap to the wrong value.
                    onTouchStart={lockSetPager}
                    onTouchEnd={unlockSetPager}
                    onTouchCancel={unlockSetPager}
                    // Keep scrollX (the fill overlay) and the label in sync with
                    // the initial scroll position, not left defaulting to 0.
                    onLayout={() => syncToValue(value)}
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
                    contentContainerStyle={{ paddingHorizontal: (width - itemWidth) / 2 }}
                >
                    {tickMeta.map((meta, i) => {
                        if (meta === null) {
                            return <View key={`pad-${i}`} style={{ width: itemWidth, height: WHEEL_HEIGHT }} />;
                        }
                        return (
                            <TouchableOpacity
                                key={`tick-${i}`}
                                style={{ width: itemWidth, height: WHEEL_HEIGHT }}
                                onPress={() => {
                                    scrollViewRef.current?.scrollTo({ x: i * itemWidth, animated: true });
                                    commitValue(meta.item);
                                }}
                            >
                                {/* Unfilled color only - the overlay below paints
                                    the filled (primary/goal-blue) version on top
                                    wherever the ruler has scrolled past. See the
                                    overlay's comment for why coloring is split
                                    this way instead of animating each tick. */}
                                <TickMark
                                    size={meta.tickSize}
                                    slotWidth={itemWidth}
                                    color={meta.isGoal ? GOAL_LIGHT_BLUE : (theme.textMuted ?? theme.text)}
                                    opacity={tickOpacities[i]}
                                />
                                {/* Value labels every 5 units, below the ruler -
                                    only on this (interactive) strip, not the
                                    filled overlay mirror, so they're not drawn
                                    twice. */}
                                {meta.item % labelIncrement === 0 && (
                                    <RNAnimated.Text
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: itemWidth,
                                            height: TICK_LABEL_HEIGHT,
                                            textAlign: 'center',
                                            fontSize: 10,
                                            fontWeight: '700',
                                            color: theme.textMuted ?? theme.text,
                                            opacity: tickOpacities[i],
                                        }}
                                    >
                                        {meta.item}
                                    </RNAnimated.Text>
                                )}
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
                        height: WHEEL_HEIGHT,
                        overflow: 'hidden',
                    }}
                >
                    <RNAnimated.View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            height: WHEEL_HEIGHT,
                            paddingHorizontal: (width - itemWidth) / 2,
                            transform: [{ translateX: overlayTranslateX }],
                        }}
                    >
                        {tickMeta.map((meta, i) => {
                            if (meta === null) {
                                return <View key={`fill-pad-${i}`} style={{ width: itemWidth, height: WHEEL_HEIGHT }} />;
                            }
                            return (
                                <View key={`fill-${i}`} style={{ width: itemWidth, height: WHEEL_HEIGHT }}>
                                    <TickMark
                                        size={meta.tickSize}
                                        slotWidth={itemWidth}
                                        color={meta.isGoal ? GOAL_BLUE : theme.primary}
                                        opacity={tickOpacities[i]}
                                    />
                                </View>
                            );
                        })}
                    </RNAnimated.View>
                </View>
            </View>
            {!hideValueLabel && (
                <CurrentValueLabel
                    ref={internalLabelRef}
                    unit={unit}
                    formatValue={formatValue}
                    goalValue={goalValue}
                    goalColor={goalColor}
                    initialValue={value}
                />
            )}
        </View>
    );
}

// Memoized so it skips re-render when the parent card re-renders for unrelated
// reasons (timer ticks, exercise swipe). Only re-renders when value/config
// changes — requires a stable onValueChange from the caller.
export const HorizontalSelectorWheel = React.memo(HorizontalSelectorWheelBase);
