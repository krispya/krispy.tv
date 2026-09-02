import type { World } from 'koota';
import { MousePad, Position, Ref, Rotation } from '../traits/index.js';
import { metersToCssPixels } from '../utils/physics-units.js';

export function syncMousePadToDOM(world: World) {
  world
    .query(MousePad, Position, Rotation, Ref)
    .updateEach(([_mousePad, position, rotation, ref]) => {
      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.setProperty('--item-rotate-z', `${rotation.z}deg`);
    });
}
