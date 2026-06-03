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
import { metersToCssPixels } from '../utils/physics-units.js';
import { getRestingHeight } from '../utils/resting-height.js';

const CONTACT_EPSILON = 0.5;
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
      const supportZ = getRestingHeight(entity);

      if (position.z > supportZ + CONTACT_EPSILON) return;

      position.z = supportZ;
      if (velocity.z < 0) velocity.z = 0;
      angularVelocity.x = 0;
      angularVelocity.y = 0;
      angularVelocity.z = 0;

      const stopSpeed = metersToCssPixels(body.stopSpeed);
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
