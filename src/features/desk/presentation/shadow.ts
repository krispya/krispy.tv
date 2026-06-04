import { toLift01 } from '../utils/height.js';

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

export function toShadowStyle(heightM: number): DeskShadowStyle {
  const lift = toLift01(heightM);

  return {
    offsetX: SHADOW_REST_OFFSET_X + lift * SHADOW_LIFT_OFFSET_X,
    offsetY: SHADOW_REST_OFFSET_Y + lift * SHADOW_LIFT_OFFSET_Y,
    blur: SHADOW_REST_BLUR + lift * SHADOW_LIFT_BLUR,
    scaleX: 1 + lift * SHADOW_LIFT_SCALE_X,
    scaleY: 1 + lift * SHADOW_LIFT_SCALE_Y,
    opacity: 0.4 + lift * 0.1,
  };
}
