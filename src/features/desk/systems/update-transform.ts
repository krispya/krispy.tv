import type { World } from 'koota';
import {
  AngularVelocity,
  Dragging,
  Paper,
  Position,
  Rotation,
  StackIndex,
  Time,
  Velocity,
} from '../traits.js';
import { dampedLerp } from '../utils/damped-lerp.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const DRAG_LIFT = 0.06;
const PICKUP_STRAIGHTNESS = 0.82;
const STRAIGHTEN_DAMPING = 0.28;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function updateTransform(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Velocity, Position, Rotation, Paper, StackIndex, AngularVelocity)
    .updateEach(([velocity, position, rotation, paper, stackIndex, angularVelocity], entity) => {
      const dragging = entity.get(Dragging);
      const restingHeight = stackIndex.value * paper.thickness;

      if (dragging) {
        const pickupRotationScale = 1 - PICKUP_STRAIGHTNESS;

        position.z = metersToCssPixels(restingHeight + DRAG_LIFT);
        velocity.z = 0;
        angularVelocity.x = 0;
        angularVelocity.y = 0;
        angularVelocity.z = 0;
        rotation.x = dampedLerp(
          rotation.x,
          dragging.rotation.x * pickupRotationScale,
          STRAIGHTEN_DAMPING,
          time.delta
        );
        rotation.y = dampedLerp(
          rotation.y,
          dragging.rotation.y * pickupRotationScale,
          STRAIGHTEN_DAMPING,
          time.delta
        );
        rotation.z = dampedLerp(
          rotation.z,
          dragging.rotation.z * pickupRotationScale,
          STRAIGHTEN_DAMPING,
          time.delta
        );
        return;
      }

      rotation.x = clamp(rotation.x, -14, 14);
      rotation.y = clamp(rotation.y, -14, 14);
      rotation.z = clamp(rotation.z, -38, 38);
    });
}
