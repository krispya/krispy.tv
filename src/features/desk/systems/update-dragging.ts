import type { World } from 'koota';
import {
  Dragging,
  IsResting,
  KinematicBody,
  Pointer,
  Position,
  Time,
  Velocity,
} from '../traits/index.js';
import { dampedLerp } from '../utils/math.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getRestingHeight } from '../utils/resting-height.js';

const DRAG_LIFT = 0.02;
const LIFT_DAMPING = 0.18;

export function updateDragging(world: World) {
  const pointer = world.get(Pointer);
  const time = world.get(Time);

  if (!pointer || !time) return;

  world
    .query(Position, Velocity, Dragging, KinematicBody)
    .updateEach(([position, velocity, dragging, physics], entity) => {
      entity.remove(IsResting);
      dragging.liftProgress = dampedLerp(dragging.liftProgress, 1, LIFT_DAMPING, time.delta);

      const restingHeight = getRestingHeight(entity);
      const dragLift = metersToCssPixels(DRAG_LIFT * dragging.liftProgress);
      const oldX = position.x;
      const oldY = position.y;

      position.x = pointer.x - dragging.offset.x;
      position.y = pointer.y - dragging.offset.y;
      position.z = restingHeight + dragLift;

      const invDelta = time.delta > 0 ? 1 / time.delta : 0;
      const targetVX = (position.x - oldX) * invDelta;
      const targetVY = (position.y - oldY) * invDelta;

      const nextVX = dampedLerp(velocity.x, targetVX, physics.throwDamping, time.delta);
      const nextVY = dampedLerp(velocity.y, targetVY, physics.throwDamping, time.delta);
      const speed = Math.hypot(nextVX, nextVY);
      const maxThrowSpeed = metersToCssPixels(physics.maxThrowSpeed);
      const speedScale = speed > maxThrowSpeed ? maxThrowSpeed / speed : 1;

      velocity.x = nextVX * speedScale;
      velocity.y = nextVY * speedScale;
      velocity.z = 0;
    });
}
