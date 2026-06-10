import type { World } from 'koota';
import { Camera, Viewport } from '../traits/index.js';
import { screenPointToDeskPoint } from '../utils/camera.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import {
  getStagePerspectiveOriginScreenPoint,
  ITEM_OBLIQUE_STRENGTH,
  STAGE_PERSPECTIVE_ENABLED,
  STAGE_PERSPECTIVE_PX,
} from './stage.js';

const DEG_TO_RAD = Math.PI / 180;

/** Desk-local px distance of the per-item perspective camera. */
export function getItemPerspectiveDeskPx(world: World) {
  const camera = world.get(Camera);
  const zoom = Math.max(0.001, camera?.zoom ?? 1);

  return STAGE_PERSPECTIVE_PX / zoom;
}

/**
 * Pixels of `translateZ` (inside the item perspective) that make an element
 * appear scaled by `scale`: apparent size = d / (d - z).
 */
export function toPerspectiveGrowthZPx(world: World, scale: number) {
  if (scale <= 1) return 0;

  return getItemPerspectiveDeskPx(world) * (1 - 1 / scale);
}

/**
 * Per-item stand-in for the shared stage perspective. Intermediate stage
 * transforms flatten descendant 3D, so each item carries a local
 * `perspective`. Pointing every item's perspective-origin at the stage's
 * vanishing point (expressed in item-local coordinates) reproduces the
 * oblique projection a single shared perspective would give: items away
 * from the stage center reveal their sides toward the viewer.
 */
export function setItemPerspectiveVars(
  world: World,
  ref: HTMLElement,
  /** Meters. Item center on the desk plane. */
  position: { x: number; y: number },
  /** Degrees. Item z rotation, applied by a parent of the perspective wrapper. */
  rotationZ: number
) {
  if (!STAGE_PERSPECTIVE_ENABLED) {
    ref.style.setProperty('--item-perspective', 'none');
    return;
  }

  const viewport = world.get(Viewport);
  const camera = world.get(Camera);
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) return;

  const zoom = Math.max(0.001, camera?.zoom ?? 1);
  const originScreen = getStagePerspectiveOriginScreenPoint(viewport);
  const originDesk = screenPointToDeskPoint(originScreen.x, originScreen.y, viewport, camera);
  const dx = (originDesk.x - metersToCssPixels(position.x)) * ITEM_OBLIQUE_STRENGTH;
  const dy = (originDesk.y - metersToCssPixels(position.y)) * ITEM_OBLIQUE_STRENGTH;

  // The perspective wrapper lives inside the item's rotateZ, so counter-rotate
  // the offset into the wrapper's local frame.
  const rad = -rotationZ * DEG_TO_RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Desk-local px are scaled by camera zoom on screen, so the perspective
  // distance scales inversely to match the stage's screen-space depth.
  ref.style.setProperty('--item-perspective', `${(STAGE_PERSPECTIVE_PX / zoom).toFixed(1)}px`);
  ref.style.setProperty('--item-persp-x', `${localX.toFixed(1)}px`);
  ref.style.setProperty('--item-persp-y', `${localY.toFixed(1)}px`);
}
