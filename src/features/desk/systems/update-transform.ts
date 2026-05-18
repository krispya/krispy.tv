import type { World } from 'koota';
import { Dragging, Position, Rotation, Scale, Velocity } from '../traits.js';

export function updateTransform(world: World) {
  world
    .query(Velocity, Position, Rotation, Scale)
    .updateEach(([velocity, position, rotation, scale], entity) => {
      const isDragging = entity.has(Dragging);
      const speedSq = velocity.x * velocity.x + velocity.y * velocity.y;
      const shouldSnapNeutral = !isDragging && speedSq < 25;

      position.z = isDragging ? 60 : 0;
      rotation.x = shouldSnapNeutral ? 0 : Math.max(-14, Math.min(14, -velocity.y * 0.012));
      rotation.y = shouldSnapNeutral ? 0 : Math.max(-14, Math.min(14, velocity.x * 0.012));

      const size = isDragging ? 1.035 : 1;
      scale.x = size;
      scale.y = size;
      scale.z = size;
    });
}
