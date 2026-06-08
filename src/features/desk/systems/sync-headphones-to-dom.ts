import type { World } from 'koota';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { toTranslateZPx } from '../presentation/lift.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { Headphones, Position, Ref, Rotation, StackIndex } from '../traits/index.js';
import { metersToCssPixels } from '../utils/physics-units.js';

export function syncHeadphonesToDOM(world: World) {
  world
    .query(Headphones, Position, Rotation, Ref, StackIndex)
    .updateEach(([_headphones, position, rotation, ref, stackIndex], entity) => {
      const heightM = getHeightAbovePlaneM(position.z);
      const shadow = toShadowStyle(heightM);

      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.zIndex = stackIndex.value.toString();
      ref.style.setProperty('--headphones-z', `${toTranslateZPx(heightM, entity)}px`);
      ref.style.setProperty('--headphones-rotate-z', `${rotation.z}deg`);
      ref.style.setProperty('--shadow-offset-x', `${shadow.offsetX}px`);
      ref.style.setProperty('--shadow-offset-y', `${shadow.offsetY}px`);
      ref.style.setProperty('--shadow-scale-x', shadow.scaleX.toString());
      ref.style.setProperty('--shadow-scale-y', shadow.scaleY.toString());
      ref.style.setProperty('--shadow-opacity', shadow.opacity.toString());
    });
}
