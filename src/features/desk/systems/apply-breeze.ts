import { Not, type World } from 'koota';
import { AngularVelocity, Dragging, Paper, Position, StackIndex, Time, Velocity } from '../traits.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED, metersToCssPixels } from '../utils/physics-units.js';

const AIR_ACCELERATION = metersToCssPixels(0.08);
const AIRBORNE_HEIGHT = metersToCssPixels(0.06);
const FALL_TERMINAL_SPEED = metersToCssPixels(0.22);
const VERTICAL_DRAG =
  metersToCssPixels(GRAVITY_METERS_PER_SECOND_SQUARED) / (FALL_TERMINAL_SPEED * FALL_TERMINAL_SPEED);
const FLUTTER_LIFT = metersToCssPixels(0.1);
const MAX_TORQUE = 120;
const ANGULAR_DAMPING = 0.91;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function applyBreeze(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const seconds = time.last / 1000;

  world
    .query(Position, Velocity, AngularVelocity, Paper, StackIndex, Not(Dragging))
    .updateEach(([position, velocity, angularVelocity, paper, stackIndex], entity) => {
      const supportZ = metersToCssPixels(stackIndex.value * paper.thickness);
      const lift = clamp01((position.z - supportZ) / AIRBORNE_HEIGHT);
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
      const flutter = clamp01(fallSpeed / FALL_TERMINAL_SPEED) * lift;
      const liftNoise = Math.sin(seconds * 4.1 + seed * 2.3);
      const torqueX = Math.sin(seconds * 3.1 + seed * 1.7);
      const torqueY = Math.cos(seconds * 2.7 + seed * 2.1);
      const torqueZ = Math.sin(seconds * 2.1 + seed * 2.7);

      velocity.x += gustX * AIR_ACCELERATION * lift * time.delta;
      velocity.y += gustY * AIR_ACCELERATION * lift * time.delta;
      velocity.z += (verticalDrag * lift + liftNoise * FLUTTER_LIFT * flutter) * time.delta;
      angularVelocity.x += torqueX * MAX_TORQUE * flutter * time.delta;
      angularVelocity.y += torqueY * MAX_TORQUE * flutter * time.delta;
      angularVelocity.z += torqueZ * MAX_TORQUE * flutter * time.delta;
    });
}
