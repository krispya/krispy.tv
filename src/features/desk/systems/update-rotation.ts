import { Not, type World } from 'koota';
import {
  AngularVelocity,
  Dragging,
  IsControlled,
  IsResting,
  KinematicBody,
  Position,
  Rotation,
  Time,
  Velocity,
} from '../traits/index.js';
import { clamp, dampedLerp } from '../utils/math.js';
const PICKUP_STRAIGHTNESS = 0.82;
const STRAIGHTEN_DAMPING = 0.28;
const LANDING_EPSILON_M = 0.001;
const LANDING_FLATTEN_DAMPING = 0.2;

export function updateRotation(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Rotation, AngularVelocity, Dragging)
    .updateEach(([rotation, angularVelocity, dragging]) => {
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
    });

  world
    .query(
      Velocity,
      Position,
      Rotation,
      AngularVelocity,
      KinematicBody,
      Not(IsControlled),
      Not(IsResting)
    )
    .updateEach(([_velocity, position, rotation]) => {
      if (position.z <= LANDING_EPSILON_M) {
        rotation.x = dampedLerp(rotation.x, 0, LANDING_FLATTEN_DAMPING, time.delta);
        rotation.y = dampedLerp(rotation.y, 0, LANDING_FLATTEN_DAMPING, time.delta);
      }

      rotation.x = clamp(rotation.x, -14, 14);
      rotation.y = clamp(rotation.y, -14, 14);
      rotation.z = clamp(rotation.z, -38, 38);
    });
}
