import { Not, type World } from 'koota';
import { Dragging, PaperPhysics, Time, Velocity } from '../traits/index.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED, metersToCssPixels } from '../utils/physics-units.js';

export function applyGravity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const gravity = metersToCssPixels(GRAVITY_METERS_PER_SECOND_SQUARED);

  // Only apply gravity to physical entities
  world.query(Velocity, PaperPhysics, Not(Dragging)).updateEach(([velocity]) => {
    velocity.z -= gravity * time.delta;
  });
}
