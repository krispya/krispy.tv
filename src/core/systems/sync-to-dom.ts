import type { World } from 'koota';
import { DeskItem, Dragging, Position, Ref, Rotation, Scale, ZIndex } from '../traits.js';

export function syncToDOM(world: World) {
  world
    .query(DeskItem, Position, Rotation, Scale, Ref, ZIndex)
    .updateEach(([_item, position, rotation, scale, ref, zIndex], entity) => {
      if (!ref) return;

      const finalZIndex = entity.has(Dragging) ? zIndex.value + 1000 : zIndex.value;

      ref.style.transform = `translate(${position.x}px, ${position.y}px) perspective(1200px) translateZ(${position.z}px) scale3d(${scale.x}, ${scale.y}, ${scale.z}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`;
      ref.style.zIndex = finalZIndex.toString();
    });
}
