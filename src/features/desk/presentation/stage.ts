/** Pixels. Shared 3D perspective distance for all desk items. */
export const STAGE_PERSPECTIVE_PX = 600;

export const STAGE_PERSPECTIVE_ENABLED = true;

/**
 * Degrees. Backward tilt of the desk plane around the X axis. Higher values read
 * as a lower camera looking across the desk instead of straight down.
 * Note: drag math and shadows assume a flat plane, so large tilts will desync them.
 */
export const STAGE_TILT_DEG = 6;

/**
 * Vertical position of the vanishing point. Smaller percentages raise it, which
 * reinforces the low-camera look. `'center'` keeps it centered.
 */
export const STAGE_PERSPECTIVE_ORIGIN_Y = 'center';

export function getStagePerspective(enabled = STAGE_PERSPECTIVE_ENABLED) {
  return enabled ? `${STAGE_PERSPECTIVE_PX}px` : 'none';
}

export function getStagePerspectiveOrigin() {
  return `center ${STAGE_PERSPECTIVE_ORIGIN_Y}`;
}

export function getStageTiltTransform(tiltDeg = STAGE_TILT_DEG) {
  return tiltDeg ? `rotateX(${tiltDeg}deg)` : 'none';
}

export function getInverseStageTiltTransform(tiltDeg = STAGE_TILT_DEG) {
  return tiltDeg ? `rotateX(${-tiltDeg}deg)` : 'none';
}
