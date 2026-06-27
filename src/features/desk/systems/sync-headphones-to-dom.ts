import type { World } from 'koota';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { Headphones, Position, Ref } from '../traits/index.js';

export function syncHeadphonesToDOM(world: World) {
  world.query(Headphones, Position, Ref).updateEach(([_headphones, position, ref]) => {
    const heightM = getHeightAbovePlaneM(position.z);
    const shadow = toShadowStyle(heightM);

    ref.style.setProperty('--shadow-offset-x', `${shadow.offsetX}px`);
    ref.style.setProperty('--shadow-offset-y', `${shadow.offsetY}px`);
    ref.style.setProperty('--shadow-scale-x', shadow.scaleX.toString());
    ref.style.setProperty('--shadow-scale-y', shadow.scaleY.toString());
    ref.style.setProperty('--shadow-opacity', shadow.opacity.toString());
  });
}
