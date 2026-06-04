import { Not, type World } from 'koota';
import { Dragging, IsResting, KinematicBody, Time, Velocity } from '../traits/index.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED } from '../utils/physics-units.js';

export function applyGravity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  // Only apply gravity to physical entities
  world.query(Velocity, KinematicBody, Not(Dragging), Not(IsResting)).updateEach(([velocity]) => {
    velocity.z -= GRAVITY_METERS_PER_SECOND_SQUARED * time.delta;
  });
}
