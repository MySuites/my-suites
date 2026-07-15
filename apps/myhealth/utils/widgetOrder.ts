export const WIDGET_ORDER_STORAGE_KEY = 'home_widget_order';

export const DEFAULT_WIDGET_ORDER = [
  'weeklyCompletion',
  'strengthRank',
  'bodyWeight',
  'volumeTrend',
  'totalWorkouts',
  'muscleHeatmap',
] as const;

export type WidgetId = typeof DEFAULT_WIDGET_ORDER[number];

// Column span, in grid units (1 = half width, 2 = full width). Height is
// intrinsic to each card's own content, not forced to a square — these cards
// weren't built as fixed-frame widgets, so a forced square box either clips
// them or leaves dead space.
export const WIDGET_COLS: Record<WidgetId, 1 | 2> = {
  weeklyCompletion: 2,
  strengthRank: 2,
  bodyWeight: 1,
  volumeTrend: 1,
  totalWorkouts: 1,
  muscleHeatmap: 2,
};

export interface MasonryPlacement {
  id: WidgetId;
  col: number;
  cols: number;
  y: number;
  height: number;
}

// Pinterest/masonry-style packing: each item drops into whichever column (or
// contiguous column span) currently has the least content, so short and tall
// cards can sit side by side without stealing space from later widgets.
export function packMasonry(
  order: WidgetId[],
  columns: number,
  getCols: (id: WidgetId) => number,
  getHeight: (id: WidgetId) => number,
  gap: number,
): MasonryPlacement[] {
  const columnBottom = new Array(columns).fill(0);
  const placements: MasonryPlacement[] = [];

  order.forEach((id) => {
    const cols = Math.min(getCols(id), columns);
    const height = getHeight(id);

    let bestCol = 0;
    let bestY = Infinity;
    for (let c = 0; c <= columns - cols; c++) {
      const segMax = Math.max(...columnBottom.slice(c, c + cols));
      if (segMax < bestY) {
        bestY = segMax;
        bestCol = c;
      }
    }

    placements.push({ id, col: bestCol, cols, y: bestY, height });

    for (let c = bestCol; c < bestCol + cols; c++) {
      columnBottom[c] = bestY + height + gap;
    }
  });

  return placements;
}
