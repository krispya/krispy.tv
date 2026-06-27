import type { World } from 'koota';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { Polaroid, Position, Ref } from '../traits/index.js';
import { lerp } from '../utils/math.js';
import { getItemFocusProgress } from '../utils/item-focus.js';

const FOCUSED_SHADOW_OPACITY_MULTIPLIER = 0;

export function syncPolaroidToDOM(world: World) {
  world.query(Polaroid, Position, Ref).updateEach(([_polaroid, position, ref], entity) => {
    const focusProgress = getItemFocusProgress(entity);
    const heightM = getHeightAbovePlaneM(position.z);
    const shadow = toShadowStyle(heightM);
    const shadowOpacity = lerp(
      shadow.opacity,
      shadow.opacity * FOCUSED_SHADOW_OPACITY_MULTIPLIER,
      focusProgress
    );

    ref.style.setProperty('--shadow-offset-x', `${shadow.offsetX}px`);
    ref.style.setProperty('--shadow-offset-y', `${shadow.offsetY}px`);
    ref.style.setProperty('--shadow-scale-x', shadow.scaleX.toString());
    ref.style.setProperty('--shadow-scale-y', shadow.scaleY.toString());
    ref.style.setProperty('--shadow-opacity', shadowOpacity.toString());
  });
}
