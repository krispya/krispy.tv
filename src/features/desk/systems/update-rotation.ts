import { Not, type World } from 'koota';
import {
  AngularVelocity,
  Dragging,
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
import { getHeightAbovePlaneM } from '../utils/height.js';
import { clamp, clamp01, dampedLerp, stepSpring } from '../utils/math.js';
const PICKUP_STRAIGHTNESS = 0.82;
const STRAIGHTEN_DAMPING = 0.28;
const LANDING_FLATTEN_DAMPING = 0.2;
/** Meters. Below this height a descending item starts settling its tilt. */
const SETTLE_TILT_HEIGHT_M = 0.05;
/** Degrees of swing per m²/s of torque (grab offset × velocity). */
const DRAG_SWING_DEGREES_PER_TORQUE = 700;
/** Degrees. */
const DRAG_SWING_MAX = 28;
/** Degrees of tilt per m/s of drag velocity. */
const DRAG_TILT_DEGREES_PER_SPEED = 22;
/** Degrees of tilt per m/s² of drag acceleration (inertial lag). */
const DRAG_TILT_DEGREES_PER_ACCEL = 4.5;
/** Meters per second squared. Keeps flick spikes from slamming the tilt. */
const DRAG_ACCEL_MAX = 14;
/** Degrees. */
const DRAG_TILT_MAX = 26;
/** Tilt spring: slightly underdamped so jerks overshoot and settle. */
const DRAG_TILT_STIFFNESS = 200;
const DRAG_TILT_SPRING_DAMPING = 14;
/** Degrees per second of release spin per m²/s of torque. */
const RELEASE_SPIN_DEGREES_PER_TORQUE = 2800;
/** Degrees per second. */
const RELEASE_SPIN_MAX = 220;

export function updateRotation(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Rotation, AngularVelocity, Velocity, Dragging, Not(IsFocused), Not(ItemFocusMotion))
    .updateEach(([rotation, angularVelocity, velocity, dragging]) => {
      const pickupRotationScale = 1 - PICKUP_STRAIGHTNESS;

      // Torque about the grab point: lateral velocity swings the item like a
      // pendulum pivoting where it was picked up. Settles straight when still.
      const torque = dragging.offset.x * velocity.y - dragging.offset.y * velocity.x;
      const swing = clamp(torque * DRAG_SWING_DEGREES_PER_TORQUE, -DRAG_SWING_MAX, DRAG_SWING_MAX);

      // Inertial tilt: acceleration tips the item against the motion change
      // (a jerk makes it lag behind), velocity adds a steady lean. A spring
      // carries the tilt so it overshoots and settles instead of snapping.
      const invDelta = time.delta > 0 ? 1 / time.delta : 0;
      const accelX = clamp(
        (velocity.x - dragging.lastVelocity.x) * invDelta,
        -DRAG_ACCEL_MAX,
        DRAG_ACCEL_MAX
      );
      const accelY = clamp(
        (velocity.y - dragging.lastVelocity.y) * invDelta,
        -DRAG_ACCEL_MAX,
        DRAG_ACCEL_MAX
      );
      dragging.lastVelocity.x = velocity.x;
      dragging.lastVelocity.y = velocity.y;

      const tiltTargetX = clamp(
        -velocity.y * DRAG_TILT_DEGREES_PER_SPEED - accelY * DRAG_TILT_DEGREES_PER_ACCEL,
        -DRAG_TILT_MAX,
        DRAG_TILT_MAX
      );
      const tiltTargetY = clamp(
        velocity.x * DRAG_TILT_DEGREES_PER_SPEED + accelX * DRAG_TILT_DEGREES_PER_ACCEL,
        -DRAG_TILT_MAX,
        DRAG_TILT_MAX
      );

      const sprungX = stepSpring(
        dragging.tilt.x,
        dragging.tiltVelocity.x,
        tiltTargetX,
        DRAG_TILT_STIFFNESS,
        DRAG_TILT_SPRING_DAMPING,
        time.delta
      );
      const sprungY = stepSpring(
        dragging.tilt.y,
        dragging.tiltVelocity.y,
        tiltTargetY,
        DRAG_TILT_STIFFNESS,
        DRAG_TILT_SPRING_DAMPING,
        time.delta
      );
      const baseX = rotation.x - dragging.tilt.x;
      const baseY = rotation.y - dragging.tilt.y;
      dragging.tilt.x = sprungX.value;
      dragging.tiltVelocity.x = sprungX.velocity;
      dragging.tilt.y = sprungY.value;
      dragging.tiltVelocity.y = sprungY.velocity;

      angularVelocity.x = 0;
      angularVelocity.y = 0;
      // Persists past release so off-center tosses leave with spin.
      angularVelocity.z = clamp(
        torque * RELEASE_SPIN_DEGREES_PER_TORQUE,
        -RELEASE_SPIN_MAX,
        RELEASE_SPIN_MAX
      );

      rotation.x =
        dampedLerp(baseX, dragging.rotation.x * pickupRotationScale, STRAIGHTEN_DAMPING, time.delta) +
        dragging.tilt.x;
      rotation.y =
        dampedLerp(baseY, dragging.rotation.y * pickupRotationScale, STRAIGHTEN_DAMPING, time.delta) +
        dragging.tilt.y;
      rotation.z = dampedLerp(
        rotation.z,
        dragging.rotation.z * pickupRotationScale + swing,
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
      Not(IsFocused),
      Not(IsResting),
      Not(ItemFocusMotion)
    )
    .updateEach(([velocity, position, rotation, angularVelocity]) => {
      // Settle the tilt progressively as a descending item nears the desk so
      // it touches down flat, instead of ironing out the tilt after landing.
      const height = getHeightAbovePlaneM(position.z);
      const settle = velocity.z <= 0 ? 1 - clamp01(height / SETTLE_TILT_HEIGHT_M) : 0;

      if (settle > 0) {
        const damping = LANDING_FLATTEN_DAMPING * settle;
        rotation.x = dampedLerp(rotation.x, 0, damping, time.delta);
        rotation.y = dampedLerp(rotation.y, 0, damping, time.delta);
        // Bleed off tumble (e.g. breeze flutter) so it can't re-tilt the
        // item against the settle.
        angularVelocity.x = dampedLerp(angularVelocity.x, 0, damping, time.delta);
        angularVelocity.y = dampedLerp(angularVelocity.y, 0, damping, time.delta);
      }

      rotation.x = clamp(rotation.x, -DRAG_TILT_MAX, DRAG_TILT_MAX);
      rotation.y = clamp(rotation.y, -DRAG_TILT_MAX, DRAG_TILT_MAX);
      rotation.z = clamp(rotation.z, -38, 38);
    });
}
