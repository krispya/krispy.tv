import { Not, type World } from 'koota';
import { Dragging, IsResting, KinematicBody, Time, Velocity } from '../traits/index.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED, metersToCssPixels } from '../utils/physics-units.js';

export function dampVelocity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Velocity, KinematicBody, Not(Dragging), Not(IsResting))
    .updateEach(([velocity, physics]) => {
      const speed = Math.hypot(velocity.x, velocity.y);
      const stopSpeed = metersToCssPixels(physics.stopSpeed);

      if (speed <= stopSpeed) {
        velocity.x = 0;
        velocity.y = 0;
        return;
      }

      const friction = metersToCssPixels(physics.friction * GRAVITY_METERS_PER_SECOND_SQUARED);
      const nextSpeed = Math.max(0, speed - friction * time.delta);
      const scale = nextSpeed / speed;

      velocity.x *= scale;
      velocity.y *= scale;
    });
}
