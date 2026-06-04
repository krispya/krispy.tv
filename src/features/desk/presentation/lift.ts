import type { Entity } from 'koota';
import { KinematicBody } from '../traits/index.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getHeightAbovePlaneM, toLift01 } from '../utils/height.js';

/**
 * Multiplier for perspective `translateZ`. Shared stage perspective foreshortens
 * Z more than 2D shadow offsets read, so keep this > 1 to match shadow separation.
 */
export const TRANSLATE_LIFT_SCALE = 4;

/** Extra mesh scale at full lift (0.1 = 10% larger), eased with height via `toLift01`. */
export const MESH_LIFT_SCALE_MAX = 0.1;

function getBodyDepthMeters(entity: Entity) {
  return entity.get(KinematicBody)?.depth ?? 0;
}

/** CSS px offset for the item mesh resting on the desk (half thickness). */
export function getSupportZPx(entity: Entity) {
  return metersToCssPixels(getBodyDepthMeters(entity) / 2);
}

export function toVisualLiftM(heightM: number) {
  return getHeightAbovePlaneM(heightM) * TRANSLATE_LIFT_SCALE;
}

/** Smooth scale with height so landing eases to 1 (no threshold pop). */
export function toMeshLiftScale(heightM: number) {
  return 1 + toLift01(heightM) * MESH_LIFT_SCALE_MAX;
}

export function toTranslateZPx(heightM: number, entity: Entity) {
  const supportPx = getSupportZPx(entity);
  const liftPx = metersToCssPixels(toVisualLiftM(heightM));
  return supportPx + liftPx;
}
