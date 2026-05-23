import type { World } from 'koota';
import { Dragging, Paper, Position, Ref, Rotation, StackIndex } from '../traits/index.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const DRAGGING_STACK_BOOST = 1000;
const MAX_SHADOW_HEIGHT = 96;

function getShadow(z: number) {
  const height = Math.min(Math.max(z, 0), MAX_SHADOW_HEIGHT);
  const lift = height / MAX_SHADOW_HEIGHT;
  const offsetY = 1 + lift * 40;
  const blur = 2 + lift * 72;
  const spread = lift * 8;
  const opacity = 0.04 + lift * 0.44;

  return `0 ${offsetY}px ${blur}px ${spread}px rgba(42,38,30,${opacity})`;
}

export function syncToDOM(world: World) {
  world
    .query(Paper, Position, Rotation, Ref, StackIndex)
    .updateEach(([paper, position, rotation, ref, stackIndex], entity) => {
      const cssZIndex = entity.has(Dragging)
        ? stackIndex.value + DRAGGING_STACK_BOOST
        : stackIndex.value;

      const supportZ = metersToCssPixels(stackIndex.value * paper.thickness);
      const liftZ = Math.max(0, position.z - supportZ);

      ref.style.transform = `translate(${position.x}px, ${position.y}px) perspective(1200px) translateZ(${position.z}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`;
      ref.style.zIndex = cssZIndex.toString();
      ref.style.boxShadow = getShadow(liftZ);
    });
}
