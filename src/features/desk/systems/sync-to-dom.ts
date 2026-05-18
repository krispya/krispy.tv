import type { World } from 'koota';
import { DeskItem, Dragging, Position, Ref, Rotation, Scale, StackIndex } from '../traits.js';

const DRAGGING_STACK_BOOST = 1000;

export function syncToDOM(world: World) {
  world
    .query(DeskItem, Position, Rotation, Scale, Ref, StackIndex)
    .updateEach(([_item, position, rotation, scale, ref, stackIndex], entity) => {
      const cssZIndex = entity.has(Dragging)
        ? stackIndex.value + DRAGGING_STACK_BOOST
        : stackIndex.value;

      ref.style.transform = `translate(${position.x}px, ${position.y}px) perspective(1200px) translateZ(${position.z}px) scale3d(${scale.x}, ${scale.y}, ${scale.z}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`;
      ref.style.zIndex = cssZIndex.toString();
    });
}
