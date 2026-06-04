/** Meters. Max Z while dragging. */
export const DRAG_LIFT_MAX_M = 0.07;

/** Simulation: `Position.z` is height above the desk plane (0 = resting). */
export function getHeightAbovePlaneM(positionZ: number) {
  return Math.max(0, positionZ);
}

export function toLift01(heightM: number) {
  return Math.min(getHeightAbovePlaneM(heightM) / DRAG_LIFT_MAX_M, 1);
}
