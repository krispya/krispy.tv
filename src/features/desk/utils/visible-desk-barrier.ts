import type { VisibleDeskRect } from './camera.js';
import { cssPixelsToMeters } from './physics-units.js';

export type DeskBarrierRange = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export function getDeskBarrierOverflow(size: number, overflowRatio: number) {
  return size * overflowRatio;
}

export function getVisibleDeskBarrierRange(
  visibleRect: VisibleDeskRect,
  box: { width: number; height: number },
  overflowRatio: number
): DeskBarrierRange | undefined {
  if (visibleRect.width <= 0 || visibleRect.height <= 0 || box.width <= 0 || box.height <= 0) {
    return undefined;
  }

  const rangeX = getAxisRange(visibleRect.x, visibleRect.width, box.width, overflowRatio);
  const rangeY = getAxisRange(visibleRect.y, visibleRect.height, box.height, overflowRatio);

  return {
    minX: cssPixelsToMeters(rangeX.min),
    maxX: cssPixelsToMeters(rangeX.max),
    minY: cssPixelsToMeters(rangeY.min),
    maxY: cssPixelsToMeters(rangeY.max),
  };
}

function getAxisRange(origin: number, viewportSize: number, itemSize: number, overflowRatio: number) {
  const overflow = getDeskBarrierOverflow(itemSize, overflowRatio);
  const halfSize = itemSize / 2;
  const min = origin + halfSize - overflow;
  const max = origin + viewportSize - halfSize + overflow;

  if (min <= max) return { min, max };

  const midpoint = origin + viewportSize / 2;
  return { min: midpoint, max: midpoint };
}
