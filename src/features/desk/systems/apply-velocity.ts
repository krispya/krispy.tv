import { Not, type World } from 'koota';
import { Dragging, IsResting, Position, Time, Velocity } from '../traits/index.js';

export function applyVelocity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Position, Velocity, Not(Dragging), Not(IsResting))
    .updateEach(([position, velocity]) => {
      position.x += velocity.x * time.delta;
      position.y += velocity.y * time.delta;
      position.z += velocity.z * time.delta;
    });
}
