import { Not, type World } from 'koota';
import {
  AngularVelocity,
  Dragging,
  IsResting,
  KinematicBody,
  Position,
  Rotation,
  Velocity,
} from '../traits/index.js';

const CONTACT_EPSILON_M = 0.001;
const ROTATION_REST_EPSILON = 0.01;
const ANGULAR_REST_SPEED = 0.001;

export function resolveRestingBody(world: World) {
  world
    .query(
      Position,
      Rotation,
      Velocity,
      AngularVelocity,
      KinematicBody,
      Not(Dragging),
      Not(IsResting)
    )
    .updateEach(([position, rotation, velocity, angularVelocity, body], entity) => {
      if (position.z > CONTACT_EPSILON_M) return;

      position.z = 0;
      if (velocity.z < 0) velocity.z = 0;
      angularVelocity.x = 0;
      angularVelocity.y = 0;
      angularVelocity.z = 0;

      const stopSpeed = body.stopSpeed;
      const isStill = Math.hypot(velocity.x, velocity.y) <= stopSpeed && velocity.z <= 0;
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
