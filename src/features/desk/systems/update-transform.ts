import type { World } from 'koota';
import { Dragging, Paper, Position, Rotation, StackIndex, Velocity } from '../traits.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const DRAG_LIFT = 0.02;

export function updateTransform(world: World) {
  world
    .query(Velocity, Position, Rotation, Paper, StackIndex)
    .updateEach(([velocity, position, rotation, paper, stackIndex], entity) => {
      const isDragging = entity.has(Dragging);
      const speedSq = velocity.x * velocity.x + velocity.y * velocity.y;
      const shouldSnapNeutral = !isDragging && speedSq < 25;
      const restingHeight = stackIndex.value * paper.thickness;

      if (isDragging) {
        position.z = metersToCssPixels(restingHeight + DRAG_LIFT);
        velocity.z = 0;
      }

      rotation.x = shouldSnapNeutral ? 0 : Math.max(-14, Math.min(14, -velocity.y * 0.012));
      rotation.y = shouldSnapNeutral ? 0 : Math.max(-14, Math.min(14, velocity.x * 0.012));
    });
}
