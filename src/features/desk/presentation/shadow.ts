import type { CSSProperties } from 'react';
import { toLift01 } from '../utils/height.js';

const SHADOW_REST_OFFSET_X = 2;
const SHADOW_REST_OFFSET_Y = 3;
const SHADOW_LIFT_OFFSET_X = 48;
const SHADOW_LIFT_OFFSET_Y = 56;
const SHADOW_LIFT_SCALE_X = 0.1;
const SHADOW_LIFT_SCALE_Y = 0.065;
export const SHADOW_BOIL_FRAME_COUNT = 3;
export const SHADOW_BOIL_CYCLE_SECONDS = 0.36;

const SHADOW_BOIL_TRANSFORMS = [
  'translate(-0.6px, 0.25px) rotate(-0.18deg) scale(1.006, 0.996)',
  'translate(0.45px, -0.35px) rotate(0.16deg) scale(0.997, 1.005)',
  'translate(0.15px, 0.45px) rotate(-0.08deg) scale(1.002, 0.999)',
] as const;

const SHADOW_BOIL_CLIP_PATHS = [
  'polygon(0.2% 0%, 99.7% 0.4%, 100% 99.2%, 0% 100%)',
  'polygon(0% 0.5%, 100% 0%, 99.6% 100%, 0.4% 99.5%)',
  'polygon(0.3% 0.2%, 99.9% 0.1%, 99.8% 99.7%, 0.1% 99.8%)',
] as const;

export type DeskShadowStyle = {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
};

export function toShadowStyle(heightM: number): DeskShadowStyle {
  const lift = toLift01(heightM);

  return {
    offsetX: SHADOW_REST_OFFSET_X + lift * SHADOW_LIFT_OFFSET_X,
    offsetY: SHADOW_REST_OFFSET_Y + lift * SHADOW_LIFT_OFFSET_Y,
    scaleX: 1 + lift * SHADOW_LIFT_SCALE_X,
    scaleY: 1 + lift * SHADOW_LIFT_SCALE_Y,
    opacity: 0.4 + lift * 0.1,
  };
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getShadowBoilPhaseOffset(id: string): number {
  const startFrame = hashString(id) % SHADOW_BOIL_FRAME_COUNT;
  const slotDuration = SHADOW_BOIL_CYCLE_SECONDS / SHADOW_BOIL_FRAME_COUNT;
  const desync = ((hashString(`${id}:shadow-boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}

export function getShadowBoilFrameStyle(frameIndex: number, clipPath = true): CSSProperties {
  const variant = frameIndex % SHADOW_BOIL_FRAME_COUNT;

  return {
    transform: SHADOW_BOIL_TRANSFORMS[variant],
    ...(clipPath && { clipPath: SHADOW_BOIL_CLIP_PATHS[variant] }),
  };
}
