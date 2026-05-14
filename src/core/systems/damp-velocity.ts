import { Not, type World } from 'koota';
import { Dragging, Time, Velocity } from '../traits.js';
import { dampedLerp } from '../utils/damped-lerp.js';

const VELOCITY_DAMPING = 1 - Math.pow(0.0001, 1 / 60);

export function dampVelocity(world: World) {
  const time = world.get(Time);

  if (!time) return;

  world.query(Velocity, Not(Dragging)).updateEach(([velocity]) => {
    velocity.x = dampedLerp(velocity.x, 0, VELOCITY_DAMPING, time.delta);
    velocity.y = dampedLerp(velocity.y, 0, VELOCITY_DAMPING, time.delta);
  });
}
