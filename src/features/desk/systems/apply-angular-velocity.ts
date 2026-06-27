import { Not, type World } from 'koota';
import {
  AngularVelocity,
  IsControlled,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  Rotation,
  Time,
} from '../traits/index.js';

export function applyAngularVelocity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(
      Rotation,
      AngularVelocity,
      Not(IsControlled),
      Not(IsFocused),
      Not(IsResting),
      Not(ItemFocusMotion)
    )
    .updateEach(([rotation, angularVelocity]) => {
      rotation.x += angularVelocity.x * time.delta;
      rotation.y += angularVelocity.y * time.delta;
      rotation.z += angularVelocity.z * time.delta;
    });
}
