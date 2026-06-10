/** Pixels. Shared 3D perspective distance for all desk items. */
export const STAGE_PERSPECTIVE_PX = 600;

/**
 * Pixels. Local perspective applied per item. Intermediate stage transforms
 * flatten the shared stage perspective, so each item needs its own for
 * rotateX/rotateY to read as 3D.
 */
export const ITEM_PERSPECTIVE_PX = 600;

/**
 * 0–1. How strongly an item's projection skews toward the stage vanishing
 * point based on its screen position. 1 matches a true shared perspective,
 * 0 renders every item head-on regardless of position.
 */
export const ITEM_OBLIQUE_STRENGTH = 0.45;

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

/** Screen-space point of the stage's vanishing point. */
export function getStagePerspectiveOriginScreenPoint(viewport: { width: number; height: number }) {
  const yFraction =
    STAGE_PERSPECTIVE_ORIGIN_Y === 'center' ? 0.5 : parseFloat(STAGE_PERSPECTIVE_ORIGIN_Y) / 100;

  return { x: viewport.width / 2, y: viewport.height * yFraction };
}

export function getStageTiltTransform(tiltDeg = STAGE_TILT_DEG) {
  return tiltDeg ? `rotateX(${tiltDeg}deg)` : 'none';
}

export function getInverseStageTiltTransform(tiltDeg = STAGE_TILT_DEG) {
  return tiltDeg ? `rotateX(${-tiltDeg}deg)` : 'none';
}
