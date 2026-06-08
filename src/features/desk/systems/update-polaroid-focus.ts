import type { World } from 'koota';
import {
  IsControlled,
  IsOpen,
  PolaroidFocusMotion,
  Position,
  Rotation,
  Time,
} from '../traits/index.js';
import { clamp01, stepSpring } from '../utils/math.js';

const POSITION_STIFFNESS = 120;
const POSITION_DAMPING = 20;
const CLOSE_POSITION_STIFFNESS = 150;
const CLOSE_POSITION_DAMPING = 26;
const ROTATION_STIFFNESS = 130;
const ROTATION_DAMPING = 21;
const PROGRESS_STIFFNESS = 110;
const PROGRESS_DAMPING = 20;
const MAX_SPRING_DELTA = 1 / 30;
const POSITION_REST_EPSILON_M = 0.0006;
const POSITION_VELOCITY_REST_EPSILON_M = 0.008;
const ROTATION_REST_EPSILON_DEG = 0.08;
const ROTATION_VELOCITY_REST_EPSILON_DEG = 1.4;
const PROGRESS_REST_EPSILON = 0.01;

export function updatePolaroidFocus(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const delta = Math.min(time.delta, MAX_SPRING_DELTA);

  world
    .query(Position, Rotation, PolaroidFocusMotion)
    .updateEach(([position, rotation, motion], entity) => {
      const positionStiffness =
        motion.phase === 'closing' ? CLOSE_POSITION_STIFFNESS : POSITION_STIFFNESS;
      const positionDamping = motion.phase === 'closing' ? CLOSE_POSITION_DAMPING : POSITION_DAMPING;
      const progressTarget = motion.phase === 'closing' ? 0 : 1;

      stepPositionAxis(position, motion.positionVelocity, 'x', motion.toPosition.x, {
        stiffness: positionStiffness,
        damping: positionDamping,
        delta,
      });
      stepPositionAxis(position, motion.positionVelocity, 'y', motion.toPosition.y, {
        stiffness: positionStiffness,
        damping: positionDamping,
        delta,
      });
      stepPositionAxis(position, motion.positionVelocity, 'z', motion.toPosition.z, {
        stiffness: positionStiffness,
        damping: positionDamping,
        delta,
      });

      stepRotationAxis(rotation, motion.rotationVelocity, 'x', motion.toRotation.x, delta);
      stepRotationAxis(rotation, motion.rotationVelocity, 'y', motion.toRotation.y, delta);
      stepRotationAxis(rotation, motion.rotationVelocity, 'z', motion.toRotation.z, delta);

      const nextProgress = stepSpring(
        motion.progress,
        motion.progressVelocity,
        progressTarget,
        PROGRESS_STIFFNESS,
        PROGRESS_DAMPING,
        delta
      );
      motion.progress = clamp01(nextProgress.value);
      motion.progressVelocity = nextProgress.velocity;

      if (!isFocusMotionResting(position, rotation, motion, progressTarget)) return;

      position.x = motion.toPosition.x;
      position.y = motion.toPosition.y;
      position.z = motion.toPosition.z;
      rotation.x = motion.toRotation.x;
      rotation.y = motion.toRotation.y;
      rotation.z = motion.toRotation.z;
      motion.progress = progressTarget;
      motion.progressVelocity = 0;
      motion.positionVelocity.x = 0;
      motion.positionVelocity.y = 0;
      motion.positionVelocity.z = 0;
      motion.rotationVelocity.x = 0;
      motion.rotationVelocity.y = 0;
      motion.rotationVelocity.z = 0;

      if (motion.phase === 'closing') {
        entity.remove(PolaroidFocusMotion, IsOpen, IsControlled);
      }
    });
}

type Axis = 'x' | 'y' | 'z';

type SpringStepConfig = {
  stiffness: number;
  damping: number;
  delta: number;
};

function stepPositionAxis(
  position: { x: number; y: number; z: number },
  velocity: { x: number; y: number; z: number },
  axis: Axis,
  target: number,
  config: SpringStepConfig
) {
  const next = stepSpring(
    position[axis],
    velocity[axis],
    target,
    config.stiffness,
    config.damping,
    config.delta
  );
  position[axis] = next.value;
  velocity[axis] = next.velocity;
}

function stepRotationAxis(
  rotation: { x: number; y: number; z: number },
  velocity: { x: number; y: number; z: number },
  axis: Axis,
  target: number,
  delta: number
) {
  const next = stepSpring(
    rotation[axis],
    velocity[axis],
    target,
    ROTATION_STIFFNESS,
    ROTATION_DAMPING,
    delta
  );
  rotation[axis] = next.value;
  velocity[axis] = next.velocity;
}

function isFocusMotionResting(
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number },
  motion: {
    progress: number;
    progressVelocity: number;
    positionVelocity: { x: number; y: number; z: number };
    rotationVelocity: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    toRotation: { x: number; y: number; z: number };
  },
  progressTarget: number
) {
  const positionDistance = Math.hypot(
    position.x - motion.toPosition.x,
    position.y - motion.toPosition.y,
    position.z - motion.toPosition.z
  );
  const positionSpeed = Math.hypot(
    motion.positionVelocity.x,
    motion.positionVelocity.y,
    motion.positionVelocity.z
  );
  const rotationDistance = Math.hypot(
    rotation.x - motion.toRotation.x,
    rotation.y - motion.toRotation.y,
    rotation.z - motion.toRotation.z
  );
  const rotationSpeed = Math.hypot(
    motion.rotationVelocity.x,
    motion.rotationVelocity.y,
    motion.rotationVelocity.z
  );

  return (
    positionDistance <= POSITION_REST_EPSILON_M &&
    positionSpeed <= POSITION_VELOCITY_REST_EPSILON_M &&
    rotationDistance <= ROTATION_REST_EPSILON_DEG &&
    rotationSpeed <= ROTATION_VELOCITY_REST_EPSILON_DEG &&
    Math.abs(motion.progress - progressTarget) <= PROGRESS_REST_EPSILON &&
    Math.abs(motion.progressVelocity) <= PROGRESS_REST_EPSILON
  );
}
