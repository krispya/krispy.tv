import { Not, type World } from 'koota';
import {
  AngularVelocity,
  IsControlled,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  KinematicBody,
  Time,
  Velocity,
} from '../traits/index.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED } from '../utils/physics-units.js';
import { dampedLerp } from '../utils/math.js';

/** Gentle air drag on spin while a body is in motion. */
const ANGULAR_AIR_DAMPING = 0.03;

export function dampVelocity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(AngularVelocity, Not(IsControlled), Not(IsFocused), Not(IsResting), Not(ItemFocusMotion))
    .updateEach(([angularVelocity]) => {
      angularVelocity.z = dampedLerp(angularVelocity.z, 0, ANGULAR_AIR_DAMPING, time.delta);
    });

  world
    .query(
      Velocity,
      KinematicBody,
      Not(IsControlled),
      Not(IsFocused),
      Not(IsResting),
      Not(ItemFocusMotion)
    )
    .updateEach(([velocity, physics]) => {
      const speed = Math.hypot(velocity.x, velocity.y);
      const stopSpeed = physics.stopSpeed;

      if (speed <= stopSpeed) {
        velocity.x = 0;
        velocity.y = 0;
        return;
      }

      const friction = physics.friction * GRAVITY_METERS_PER_SECOND_SQUARED;
      const nextSpeed = Math.max(0, speed - friction * time.delta);
      const scale = nextSpeed / speed;

      velocity.x *= scale;
      velocity.y *= scale;
    });
}
