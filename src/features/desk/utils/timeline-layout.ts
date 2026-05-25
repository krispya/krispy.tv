import { metersToCssPixels } from './physics-units.js';
import { getProjectedSize } from './transform.js';

export const TIMELINE_GAP = 24;
export const TIMELINE_LIFT_Z = metersToCssPixels(0.025);

export function getTimelineVisualWidth(width: number) {
  return getProjectedSize(width, TIMELINE_LIFT_Z);
}
