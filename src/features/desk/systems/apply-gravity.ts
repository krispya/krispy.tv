import { Not, type World } from 'koota';
import { Dragging, Time, Velocity } from '../traits/index.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED, metersToCssPixels } from '../utils/physics-units.js';

export function applyGravity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const gravity = metersToCssPixels(GRAVITY_METERS_PER_SECOND_SQUARED);

  world.query(Velocity, Not(Dragging)).updateEach(([velocity]) => {
    velocity.z -= gravity * time.delta;
  });
}
