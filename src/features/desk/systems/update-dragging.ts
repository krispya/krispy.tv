import { Not, type World } from 'koota';
import {
  Dragging,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  KinematicBody,
  Pointer,
  Position,
  Time,
  Velocity,
} from '../traits/index.js';
import { DRAG_LIFT_MAX_M } from '../utils/height.js';
import { dampedLerp } from '../utils/math.js';
import { screenPointToDeskMetersForWorld } from '../utils/camera.js';

const LIFT_DAMPING = 0.18;

export function updateDragging(world: World) {
  const pointer = world.get(Pointer);
  const time = world.get(Time);

  if (!pointer || !time) return;
  const deskPoint = screenPointToDeskMetersForWorld(world, pointer.x, pointer.y);

  world
    .query(Position, Velocity, Dragging, KinematicBody, Not(IsFocused), Not(ItemFocusMotion))
    .updateEach(([position, velocity, dragging, physics], entity) => {
      entity.remove(IsResting);
      dragging.liftProgress = dampedLerp(dragging.liftProgress, 1, LIFT_DAMPING, time.delta);

      const oldX = position.x;
      const oldY = position.y;

      position.x = deskPoint.x - dragging.offset.x;
      position.y = deskPoint.y - dragging.offset.y;
      position.z = DRAG_LIFT_MAX_M * dragging.liftProgress;

      const invDelta = time.delta > 0 ? 1 / time.delta : 0;
      const targetVX = (position.x - oldX) * invDelta;
      const targetVY = (position.y - oldY) * invDelta;

      const nextVX = dampedLerp(velocity.x, targetVX, physics.throwDamping, time.delta);
      const nextVY = dampedLerp(velocity.y, targetVY, physics.throwDamping, time.delta);
      const speed = Math.hypot(nextVX, nextVY);
      const maxThrowSpeed = physics.maxThrowSpeed;
      const speedScale = speed > maxThrowSpeed ? maxThrowSpeed / speed : 1;

      velocity.x = nextVX * speedScale;
      velocity.y = nextVY * speedScale;
      velocity.z = 0;
    });
}
