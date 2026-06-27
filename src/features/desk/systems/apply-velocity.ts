import { Not, type World } from 'koota';
import {
  IsControlled,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  Position,
  Time,
  Velocity,
} from '../traits/index.js';

export function applyVelocity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(
      Position,
      Velocity,
      Not(IsControlled),
      Not(IsFocused),
      Not(IsResting),
      Not(ItemFocusMotion)
    )
    .updateEach(([position, velocity]) => {
      position.x += velocity.x * time.delta;
      position.y += velocity.y * time.delta;
      position.z += velocity.z * time.delta;
    });
}
