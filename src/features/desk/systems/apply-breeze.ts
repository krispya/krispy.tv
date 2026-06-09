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
import { getHeightAbovePlaneM } from '../utils/height.js';
import { clamp01 } from '../utils/math.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED } from '../utils/physics-units.js';

const AIR_ACCELERATION = 0.08;
const AIRBORNE_HEIGHT_M = 0.06;
const MAX_BREEZE_TIMESTEP = 1 / 30;
const FALL_TERMINAL_SPEED_M = 0.22;
const MIN_DESCENT_SPEED_M = 0.035;
const VERTICAL_DRAG =
  GRAVITY_METERS_PER_SECOND_SQUARED / (FALL_TERMINAL_SPEED_M * FALL_TERMINAL_SPEED_M);
const FLUTTER_LIFT_M = 0.1;
const MAX_TORQUE = 120;
const ANGULAR_DAMPING = 0.91;

export function applyBreeze(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const seconds = time.last / 1000;
  const delta = Math.min(time.delta, MAX_BREEZE_TIMESTEP);

  world
    .query(Position, Velocity, AngularVelocity, Paper, Not(IsControlled), Not(IsResting))
    .updateEach(([position, velocity, angularVelocity], entity) => {
      const lift = clamp01(getHeightAbovePlaneM(position.z) / AIRBORNE_HEIGHT_M);
      const angularDamping = Math.pow(ANGULAR_DAMPING, delta * 60);

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
      const flutterDelta = liftNoise * FLUTTER_LIFT_M * flutter * delta;
      const torqueX = Math.sin(seconds * 3.1 + seed * 1.7);
      const torqueY = Math.cos(seconds * 2.7 + seed * 2.1);
      const torqueZ = Math.sin(seconds * 2.1 + seed * 2.7);

      velocity.x += gustX * AIR_ACCELERATION * lift * delta;
      velocity.y += gustY * AIR_ACCELERATION * lift * delta;
      applyStableVerticalBreeze(velocity, verticalDrag * lift * delta, flutterDelta);
      angularVelocity.x += torqueX * MAX_TORQUE * flutter * delta;
      angularVelocity.y += torqueY * MAX_TORQUE * flutter * delta;
      angularVelocity.z += torqueZ * MAX_TORQUE * flutter * delta;
    });
}

function applyStableVerticalBreeze(velocity: { z: number }, dragDelta: number, flutterDelta: number) {
  if (velocity.z < -FALL_TERMINAL_SPEED_M && dragDelta > 0) {
    velocity.z = Math.min(velocity.z + dragDelta, -FALL_TERMINAL_SPEED_M);
  } else if (velocity.z > FALL_TERMINAL_SPEED_M && dragDelta < 0) {
    velocity.z = Math.max(velocity.z + dragDelta, FALL_TERMINAL_SPEED_M);
  }

  if (velocity.z < 0 && flutterDelta > 0) {
    velocity.z = Math.min(velocity.z + flutterDelta, -MIN_DESCENT_SPEED_M);
    return;
  }

  velocity.z += flutterDelta;
}
