import type { Entity } from 'koota';
import { KinematicBody } from '../traits/index.js';
import { metersToCssPixels } from './physics-units.js';

/** Simulation: `Position` values are meters; Z is height above the desk plane (0 = resting). */
export const DRAG_LIFT_MAX_M = 0.07;

/**
 * Multiplier for perspective `translateZ`. Shared perspective (see `camera.ts`) foreshortens
 * Z more than 2D shadow offsets read, so keep this > 1 to match shadow separation.
 */
export const DESK_TRANSLATE_LIFT_SCALE = 4;

/** Height at which shadow lift styling reaches full strength (physics meters). */
export const MAX_SHADOW_LIFT_M = DRAG_LIFT_MAX_M;

/** Extra mesh scale at full lift (0.1 = 10% larger), eased with height via `toShadowLift01`. */
export const DESK_MESH_LIFT_SCALE_MAX = 0.1;

const SHADOW_REST_OFFSET_X = 2;
const SHADOW_REST_OFFSET_Y = 3;
const SHADOW_LIFT_OFFSET_X = 48;
const SHADOW_LIFT_OFFSET_Y = 56;
const SHADOW_REST_BLUR = 1;
const SHADOW_LIFT_BLUR = 2;
const SHADOW_LIFT_SCALE_X = 0.1;
const SHADOW_LIFT_SCALE_Y = 0.065;

export type DeskShadowStyle = {
  offsetX: number;
  offsetY: number;
  blur: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
};

export function getBodyDepthMeters(entity: Entity) {
  return entity.get(KinematicBody)?.depth ?? 0;
}

/** CSS px offset for the item mesh resting on the desk (half thickness). */
export function getSupportZPx(entity: Entity) {
  return metersToCssPixels(getBodyDepthMeters(entity) / 2);
}

export function getHeightAbovePlaneM(positionZ: number) {
  return Math.max(0, positionZ);
}

export function toShadowLift01(heightM: number) {
  return Math.min(getHeightAbovePlaneM(heightM) / MAX_SHADOW_LIFT_M, 1);
}

export function toShadowStyle(heightM: number): DeskShadowStyle {
  const lift = toShadowLift01(heightM);

  return {
    offsetX: SHADOW_REST_OFFSET_X + lift * SHADOW_LIFT_OFFSET_X,
    offsetY: SHADOW_REST_OFFSET_Y + lift * SHADOW_LIFT_OFFSET_Y,
    blur: SHADOW_REST_BLUR + lift * SHADOW_LIFT_BLUR,
    scaleX: 1 + lift * SHADOW_LIFT_SCALE_X,
    scaleY: 1 + lift * SHADOW_LIFT_SCALE_Y,
    opacity: 0.4 + lift * 0.1,
  };
}

export function toVisualLiftM(heightM: number) {
  return getHeightAbovePlaneM(heightM) * DESK_TRANSLATE_LIFT_SCALE;
}

/** Smooth scale with height so landing eases to 1 (no threshold pop). */
export function toMeshLiftScale(heightM: number) {
  return 1 + toShadowLift01(heightM) * DESK_MESH_LIFT_SCALE_MAX;
}

export function toTranslateZPx(heightM: number, entity: Entity) {
  const supportPx = getSupportZPx(entity);
  const liftPx = metersToCssPixels(toVisualLiftM(heightM));
  return supportPx + liftPx;
}
