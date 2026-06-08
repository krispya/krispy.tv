import { Not, type World } from 'koota';
import {
  AngularVelocity,
  IsControlled,
  IsResting,
  Paper,
  Position,
  Time,
  Velocity,
} from '../traits/index.js';
import { clamp01 } from '../utils/math.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED } from '../utils/physics-units.js';

const AIR_ACCELERATION = 0.08;
const AIRBORNE_HEIGHT_M = 0.06;
const FALL_TERMINAL_SPEED_M = 0.22;
const VERTICAL_DRAG =
  GRAVITY_METERS_PER_SECOND_SQUARED / (FALL_TERMINAL_SPEED_M * FALL_TERMINAL_SPEED_M);
const FLUTTER_LIFT_M = 0.1;
const MAX_TORQUE = 120;
const ANGULAR_DAMPING = 0.91;

export function applyBreeze(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const seconds = time.last / 1000;

  world
    .query(Position, Velocity, AngularVelocity, Paper, Not(IsControlled), Not(IsResting))
    .updateEach(([position, velocity, angularVelocity], entity) => {
      const lift = clamp01(position.z / AIRBORNE_HEIGHT_M);
      const angularDamping = Math.pow(ANGULAR_DAMPING, time.delta * 60);

      angularVelocity.x *= angularDamping;
      angularVelocity.y *= angularDamping;
      angularVelocity.z *= angularDamping;

      if (lift <= 0) return;

      const seed = entity.id() * 0.37;
      const gustX = Math.sin(seconds * 1.7 + seed);
      const gustY = Math.cos(seconds * 1.25 + seed * 1.9);
      const verticalDrag = -velocity.z * Math.abs(velocity.z) * VERTICAL_DRAG;
      const fallSpeed = Math.max(0, -velocity.z);
      const flutter = clamp01(fallSpeed / FALL_TERMINAL_SPEED_M) * lift;
      const liftNoise = Math.sin(seconds * 4.1 + seed * 2.3);
      const torqueX = Math.sin(seconds * 3.1 + seed * 1.7);
      const torqueY = Math.cos(seconds * 2.7 + seed * 2.1);
      const torqueZ = Math.sin(seconds * 2.1 + seed * 2.7);

      velocity.x += gustX * AIR_ACCELERATION * lift * time.delta;
      velocity.y += gustY * AIR_ACCELERATION * lift * time.delta;
      velocity.z += (verticalDrag * lift + liftNoise * FLUTTER_LIFT_M * flutter) * time.delta;
      angularVelocity.x += torqueX * MAX_TORQUE * flutter * time.delta;
      angularVelocity.y += torqueY * MAX_TORQUE * flutter * time.delta;
      angularVelocity.z += torqueZ * MAX_TORQUE * flutter * time.delta;
    });
}
