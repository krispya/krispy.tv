import type { World } from 'koota';
import { Dragging, Pointer, Position, Time, Velocity } from '../traits.js';
import { dampedLerp } from '../utils/damped-lerp.js';

const VELOCITY_DAMPING = 0.5;

export function updateDragging(world: World) {
  const pointer = world.get(Pointer);
  const time = world.get(Time);

  if (!pointer || !time) return;

  world.query(Position, Velocity, Dragging).updateEach(([position, velocity, dragging]) => {
    const oldX = position.x;
    const oldY = position.y;

    position.x = pointer.x - dragging.offset.x;
    position.y = pointer.y - dragging.offset.y;

    const invDelta = time.delta > 0 ? 1 / time.delta : 0;
    const targetVX = (position.x - oldX) * invDelta;
    const targetVY = (position.y - oldY) * invDelta;

    velocity.x = dampedLerp(velocity.x, targetVX, VELOCITY_DAMPING, time.delta);
    velocity.y = dampedLerp(velocity.y, targetVY, VELOCITY_DAMPING, time.delta);
  });
}
