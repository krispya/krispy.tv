import { Not, type World } from 'koota';
import {
  AngularVelocity,
  Dragging,
  IsResting,
  KinematicBody,
  Position,
  Rotation,
  Time,
  Velocity,
} from '../traits/index.js';
import { clamp, dampedLerp } from '../utils/math.js';
import { getRestingHeight } from '../utils/resting-height.js';

const PICKUP_STRAIGHTNESS = 0.82;
const STRAIGHTEN_DAMPING = 0.28;
const LANDING_EPSILON = 0.5;
const LANDING_FLATTEN_DAMPING = 0.2;

export function updateRotation(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Velocity, Position, Rotation, AngularVelocity, KinematicBody, Not(IsResting))
    .updateEach(([_velocity, position, rotation, angularVelocity], entity) => {
      const dragging = entity.get(Dragging);

      if (dragging) {
        const pickupRotationScale = 1 - PICKUP_STRAIGHTNESS;

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

      const supportZ = getRestingHeight(entity);
      if (position.z <= supportZ + LANDING_EPSILON) {
        rotation.x = dampedLerp(rotation.x, 0, LANDING_FLATTEN_DAMPING, time.delta);
        rotation.y = dampedLerp(rotation.y, 0, LANDING_FLATTEN_DAMPING, time.delta);
      }

      rotation.x = clamp(rotation.x, -14, 14);
      rotation.y = clamp(rotation.y, -14, 14);
      rotation.z = clamp(rotation.z, -38, 38);
    });
}
