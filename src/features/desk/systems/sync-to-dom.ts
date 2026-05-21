import type { World } from 'koota';
import { Dragging, Paper, Position, Ref, Rotation, StackIndex } from '../traits/index.js';

const DRAGGING_STACK_BOOST = 1000;
const MAX_SHADOW_HEIGHT = 96;

function getShadow(z: number) {
  const height = Math.min(Math.max(z, 0), MAX_SHADOW_HEIGHT);
  const lift = height / MAX_SHADOW_HEIGHT;
  const offsetY = 2 + lift * 26;
  const blur = 4 + lift * 48;
  const spread = lift * 4;
  const opacity = 0.08 + lift * 0.26;

  return `0 ${offsetY}px ${blur}px ${spread}px rgba(42,38,30,${opacity})`;
}

export function syncToDOM(world: World) {
  world
    .query(Paper, Position, Rotation, Ref, StackIndex)
    .updateEach(([_item, position, rotation, ref, stackIndex], entity) => {
      const cssZIndex = entity.has(Dragging)
        ? stackIndex.value + DRAGGING_STACK_BOOST
        : stackIndex.value;

      ref.style.transform = `translate(${position.x}px, ${position.y}px) perspective(1200px) translateZ(${position.z}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`;
      ref.style.zIndex = cssZIndex.toString();
      ref.style.boxShadow = getShadow(position.z);
    });
}
