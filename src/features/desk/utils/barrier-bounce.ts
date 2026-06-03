import { dot, perpendicular, type Vector2 } from './math.js';

type Velocity2 = { x: number; y: number };

/** How much of the barrier-parallel velocity becomes angular spin on bounce. */
export const BARRIER_BOUNCE_SPIN_FACTOR = 0.1;
/** How much of the barrier-normal (impact) velocity becomes spin on bounce. */
export const BARRIER_BOUNCE_NORMAL_SPIN_FACTOR = 0.06;

/** Returns a spin sign biased toward continuing existing rotation, or random if at rest. */
export function barrierBounceSpinSign(angVelZ: number) {
  return angVelZ !== 0 ? Math.sign(angVelZ) : Math.random() < 0.5 ? 1 : -1;
}

/**
 * Unit vector pointing from the barrier surface toward the body (separation / push-out direction).
 * Reflect when the body is moving into the barrier: dot(velocity, separationNormal) < 0.
 */
export function reflectVelocityOnBarrier(
  velocity: Velocity2,
  separationNormal: Vector2,
  bounce: number,
  friction: number
) {
  const normalVelocity = dot(velocity, separationNormal);
  if (normalVelocity >= 0) return false;

  const tangent = perpendicular(separationNormal);
  const tangentVelocity = dot(velocity, tangent);
  const impactSpeed = Math.abs(normalVelocity);

  velocity.x = separationNormal.x * impactSpeed * bounce + tangent.x * tangentVelocity * friction;
  velocity.y = separationNormal.y * impactSpeed * bounce + tangent.y * tangentVelocity * friction;

  return true;
}

export function applyBarrierBounceSpin(
  angularVelocity: { z: number },
  separationNormal: Vector2,
  velocity: Velocity2,
  spinBias: 1 | -1
) {
  const impactSpeed = Math.abs(dot(velocity, separationNormal));

  applyBounceSpin(angularVelocity, separationNormal, velocity, impactSpeed, spinBias);
}

export function getBounceSpinBias(separationNormal: Vector2): 1 | -1 {
  if (separationNormal.x !== 0) return separationNormal.x > 0 ? 1 : -1;
  return separationNormal.y > 0 ? -1 : 1;
}

export function invertSpinBias(spinBias: 1 | -1): 1 | -1 {
  return spinBias === 1 ? -1 : 1;
}

export function applyBounceSpin(
  angularVelocity: { z: number },
  separationNormal: Vector2,
  velocity: Velocity2,
  impactSpeed: number,
  spinBias: 1 | -1
) {
  const tangent = perpendicular(separationNormal);
  const parallel = dot(velocity, tangent);

  angularVelocity.z +=
    spinBias *
    (parallel * BARRIER_BOUNCE_SPIN_FACTOR +
      barrierBounceSpinSign(angularVelocity.z) * impactSpeed * BARRIER_BOUNCE_NORMAL_SPIN_FACTOR);
}
