import { Not, type World } from 'koota';
import {
  AngularVelocity,
  IsControlled,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  KinematicBody,
  Position,
  Rotation,
  Time,
  Velocity,
} from '../traits/index.js';
import { DESK_PLANE_CONTACT_EPSILON_M } from '../utils/height.js';

const ROTATION_REST_EPSILON = 0.01;
/** Degrees per second below which spin snaps to zero. */
const ANGULAR_REST_SPEED = 0.5;
/**
 * Degrees per second squared. Kinetic friction torque on a flat item
 * decelerates spin at a constant rate, like linear sliding friction.
 */
const SURFACE_SPIN_FRICTION = 900;

export function resolveRestingBody(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(
      Position,
      Rotation,
      Velocity,
      AngularVelocity,
      KinematicBody,
      Not(IsControlled),
      Not(IsFocused),
      Not(IsResting),
      Not(ItemFocusMotion)
    )
    .updateEach(([position, rotation, velocity, angularVelocity, body], entity) => {
      if (position.z > DESK_PLANE_CONTACT_EPSILON_M) return;

      position.z = 0;
      if (velocity.z < 0) velocity.z = 0;
      angularVelocity.x = 0;
      angularVelocity.y = 0;

      const stopSpeed = body.stopSpeed;
      const isStill = Math.hypot(velocity.x, velocity.y) <= stopSpeed && velocity.z <= 0;

      // Constant friction deceleration bleeds spin off quickly on contact,
      // and a stopped slide pins the item so it can't keep rotating in place.
      const spinSpeed = Math.abs(angularVelocity.z);
      const nextSpinSpeed = isStill ? 0 : Math.max(0, spinSpeed - SURFACE_SPIN_FRICTION * time.delta);
      angularVelocity.z =
        nextSpinSpeed <= ANGULAR_REST_SPEED ? 0 : Math.sign(angularVelocity.z) * nextSpinSpeed;
      const isFlat =
        Math.abs(rotation.x) <= ROTATION_REST_EPSILON &&
        Math.abs(rotation.y) <= ROTATION_REST_EPSILON;
      const isNotSpinning =
        Math.abs(angularVelocity.x) <= ANGULAR_REST_SPEED &&
        Math.abs(angularVelocity.y) <= ANGULAR_REST_SPEED &&
        Math.abs(angularVelocity.z) <= ANGULAR_REST_SPEED;

      if (!isStill || !isFlat || !isNotSpinning) return;

      velocity.x = 0;
      velocity.y = 0;
      entity.add(IsResting);
    });
}
