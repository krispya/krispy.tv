/** Meters. Max Z while dragging. */
export const DRAG_LIFT_MAX_M = 0.07;

/** Meters. Heights this close to the desk plane should read as landed. */
export const DESK_PLANE_CONTACT_EPSILON_M = 0.001;

/** Simulation: `Position.z` is height above the desk plane (0 = resting). */
export function getHeightAbovePlaneM(positionZ: number) {
  return Math.max(0, positionZ - DESK_PLANE_CONTACT_EPSILON_M);
}

export function toLift01(heightM: number) {
  return Math.min(getHeightAbovePlaneM(heightM) / DRAG_LIFT_MAX_M, 1);
}
