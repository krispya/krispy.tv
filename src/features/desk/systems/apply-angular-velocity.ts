import { Not, type World } from 'koota';
import { AngularVelocity, IsControlled, IsResting, Rotation, Time } from '../traits/index.js';

export function applyAngularVelocity(world: World) {
  const time = world.get(Time);
  if (!time) return;

  world
    .query(Rotation, AngularVelocity, Not(IsControlled), Not(IsResting))
    .updateEach(([rotation, angularVelocity]) => {
      rotation.x += angularVelocity.x * time.delta;
      rotation.y += angularVelocity.y * time.delta;
      rotation.z += angularVelocity.z * time.delta;
    });
}
