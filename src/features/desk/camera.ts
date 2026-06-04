/** Pixels. Shared 3D camera distance for all desk items. */
export const DESK_PERSPECTIVE_PX = 600;

export const DESK_PERSPECTIVE_ENABLED = true;

/**
 * Degrees. Backward tilt of the desk plane around the X axis. Higher values read
 * as a lower camera looking across the desk instead of straight down.
 * Note: drag math and shadows assume a flat plane, so large tilts will desync them.
 */
export const DESK_TILT_DEG = 6;

/**
 * Vertical position of the vanishing point. Smaller percentages raise it, which
 * reinforces the low-camera look. `'center'` keeps it centered.
 */
export const DESK_PERSPECTIVE_ORIGIN_Y = 'center';

export function getDeskPerspectiveValue(enabled = DESK_PERSPECTIVE_ENABLED) {
  return enabled ? `${DESK_PERSPECTIVE_PX}px` : 'none';
}

export function getDeskPerspectiveOrigin() {
  return `center ${DESK_PERSPECTIVE_ORIGIN_Y}`;
}

export function getDeskTiltTransform(tiltDeg = DESK_TILT_DEG) {
  return tiltDeg ? `rotateX(${tiltDeg}deg)` : 'none';
}

/** Extra scale beyond geometric cover so the desk plane clears viewport edges with perspective. */
export const DESK_FILL_OVERSCAN = 1.12;

/** Scale applied only to the desk background (not items) to cover the viewport when tilted. */
export function getDeskFillScale(tiltDeg = DESK_TILT_DEG, overscan = DESK_FILL_OVERSCAN) {
  if (!tiltDeg) return overscan;
  const rad = (tiltDeg * Math.PI) / 180;
  return (1 / Math.cos(rad)) * overscan;
}

export function getDeskFillTransform(tiltDeg = DESK_TILT_DEG) {
  const scale = getDeskFillScale(tiltDeg);
  return scale === 1 ? 'none' : `scale(${scale})`;
}
