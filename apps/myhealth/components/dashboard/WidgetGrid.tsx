import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { WidgetId, WIDGET_COLS, MasonryPlacement, packMasonry } from '../../utils/widgetOrder';

const COLUMNS = 2;
const GAP = 12;

interface WidgetGridProps {
  order: WidgetId[];
  onReorder: (order: WidgetId[]) => void;
  isEditMode: boolean;
  onRequestEditMode: () => void;
  renderWidget: (id: WidgetId) => React.ReactNode;
  containerPadding?: number;
}

export function WidgetGrid({
  order,
  onReorder,
  isEditMode,
  onRequestEditMode,
  renderWidget,
  containerPadding = 16,
}: WidgetGridProps) {
  // Measured on the inner (already-padded) content view, so it reflects the
  // width actually available to children rather than the padded box's width.
  const [contentWidth, setContentWidth] = useState(0);
  const [heights, setHeights] = useState<Partial<Record<WidgetId, number>>>({});

  const handleContentLayout = (e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  };

  const cellSize = contentWidth > 0 ? (contentWidth - GAP * (COLUMNS - 1)) / COLUMNS : 0;

  const handleMeasured = useCallback((id: WidgetId, height: number) => {
    setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }));
  }, []);

  const allMeasured = cellSize > 0 && order.every((id) => heights[id] != null);

  const placements = useMemo(
    () =>
      allMeasured
        ? packMasonry(order, COLUMNS, (id) => WIDGET_COLS[id], (id) => heights[id]!, GAP)
        : [],
    [order, allMeasured, heights],
  );
  const placementById = useMemo(() => {
    const map: Partial<Record<WidgetId, MasonryPlacement>> = {};
    placements.forEach((p) => { map[p.id] = p; });
    return map;
  }, [placements]);

  const gridHeight = placements.reduce((max, p) => Math.max(max, p.y + p.height), 0);

  return (
    <View style={{ paddingHorizontal: containerPadding }}>
      <View style={{ height: allMeasured ? gridHeight : undefined }} onLayout={handleContentLayout}>
        {cellSize > 0 && order.map((id) => {
          const cols = WIDGET_COLS[id];
          const width = cols === 2 ? cellSize * 2 + GAP : cellSize;

          return (
            <MeasureItem key={`measure-${id}`} id={id} width={width} onMeasured={handleMeasured}>
              {renderWidget(id)}
            </MeasureItem>
          );
        })}

        {allMeasured && order.map((id) => {
          const placement = placementById[id];
          if (!placement) return null;
          return (
            <WidgetTile
              key={id}
              id={id}
              placement={placement}
              order={order}
              cellSize={cellSize}
              heights={heights as Record<WidgetId, number>}
              isEditMode={isEditMode}
              onRequestEditMode={onRequestEditMode}
              onReorder={onReorder}
            >
              {renderWidget(id)}
            </WidgetTile>
          );
        })}
      </View>
    </View>
  );
}

// Renders a widget off-screen at its real target width purely to read its
// natural content height via onLayout. Stays mounted so height stays correct
// if the widget's own content later changes size (loading -> loaded, etc.).
function MeasureItem({
  id,
  width,
  onMeasured,
  children,
}: {
  id: WidgetId;
  width: number;
  onMeasured: (id: WidgetId, height: number) => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{ position: 'absolute', top: 0, left: -9999, width, opacity: 0 }}
      pointerEvents="none"
      onLayout={(e) => onMeasured(id, e.nativeEvent.layout.height)}
    >
      {children}
    </View>
  );
}

interface WidgetTileProps {
  id: WidgetId;
  placement: MasonryPlacement;
  order: WidgetId[];
  cellSize: number;
  heights: Record<WidgetId, number>;
  isEditMode: boolean;
  onRequestEditMode: () => void;
  onReorder: (order: WidgetId[]) => void;
  children: React.ReactNode;
}

function WidgetTile({
  id,
  placement,
  order,
  cellSize,
  heights,
  isEditMode,
  onRequestEditMode,
  onReorder,
  children,
}: WidgetTileProps) {
  const cellUnit = cellSize + GAP;
  const targetX = placement.col * cellUnit;
  const targetY = placement.y;
  const width = placement.cols * cellSize + (placement.cols - 1) * GAP;
  const height = placement.height;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const isDragging = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Gesture callbacks run on the UI thread; keep the latest order reachable
  // from the JS-thread drop handler without re-creating the gesture per render.
  const orderRef = useRef(order);
  orderRef.current = order;
  const heightsRef = useRef(heights);
  heightsRef.current = heights;

  React.useEffect(() => {
    if (isDragging.value === 0) {
      x.value = withTiming(targetX, { duration: 250 });
      y.value = withTiming(targetY, { duration: 250 });
    }
  }, [targetX, targetY]);

  React.useEffect(() => {
    if (isEditMode) {
      const delay = Math.random() * 80;
      rotation.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 120 + delay }),
          withTiming(1, { duration: 240 + delay * 2 }),
          withTiming(0, { duration: 120 + delay }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 100 });
    }
  }, [isEditMode]);

  const commitDrop = (dropX: number, dropY: number) => {
    const col = Math.min(COLUMNS - 1, Math.max(0, Math.round(dropX / cellUnit)));

    const withoutSelf = orderRef.current.filter((wId) => wId !== id);
    const otherPlacements = packMasonry(
      withoutSelf,
      COLUMNS,
      (wId) => WIDGET_COLS[wId],
      (wId) => heightsRef.current[wId],
      GAP,
    );

    let insertAt = withoutSelf.length;
    let bestDist = Infinity;
    otherPlacements.forEach((p) => {
      const cx = p.col + p.cols / 2;
      const cy = p.y + p.height / 2;
      const dist = Math.hypot(cx - (col + 0.5), cy - dropY);
      if (dist < bestDist) {
        bestDist = dist;
        insertAt = withoutSelf.indexOf(p.id);
      }
    });

    const newOrder = [...withoutSelf];
    newOrder.splice(insertAt, 0, id);
    onReorder(newOrder);
  };

  const gesture = Gesture.Pan()
    .activateAfterLongPress(isEditMode ? 30 : 350)
    .onStart(() => {
      isDragging.value = 1;
      runOnJS(onRequestEditMode)();
    })
    .onUpdate((e) => {
      x.value = targetX + e.translationX;
      y.value = targetY + e.translationY;
    })
    .onEnd(() => {
      const dropX = x.value;
      const dropY = y.value;
      runOnJS(commitDrop)(dropX, dropY);
    })
    .onFinalize(() => {
      isDragging.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    width,
    height,
    transform: [
      { rotateZ: `${rotation.value}deg` },
      { scale: isDragging.value ? 1.05 : 1 },
    ],
    zIndex: isDragging.value ? 10 : 1,
    opacity: isDragging.value ? 0.9 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <View style={{ flex: 1 }} pointerEvents={isEditMode ? 'none' : 'auto'}>
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

