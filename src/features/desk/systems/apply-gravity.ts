import { Not, type World } from 'koota';
import {
  IsControlled,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  KinematicBody,
  Time,
  Velocity,
} from '../traits/index.js';
import { GRAVITY_METERS_PER_SECOND_SQUARED } from '../utils/physics-units.js';

export function applyGravity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  // Only apply gravity to physical entities
  world
    .query(
      Velocity,
      KinematicBody,
      Not(IsControlled),
      Not(IsFocused),
      Not(IsResting),
      Not(ItemFocusMotion)
    )
    .updateEach(([velocity]) => {
      velocity.z -= GRAVITY_METERS_PER_SECOND_SQUARED * time.delta;
    });
}
