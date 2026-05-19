import { Not, type World } from 'koota';
import { AngularVelocity, Dragging, Paper, Position, StackIndex, Velocity } from '../traits.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const CONTACT_EPSILON = 0.5;

export function resolvePaperSupports(world: World) {
  world
    .query(Position, Velocity, AngularVelocity, Paper, StackIndex, Not(Dragging))
    .updateEach(([position, velocity, angularVelocity, paper, stackIndex]) => {
      const supportZ = metersToCssPixels(stackIndex.value * paper.thickness);

      if (position.z > supportZ + CONTACT_EPSILON) return;

      position.z = supportZ;
      if (velocity.z < 0) velocity.z = 0;
      angularVelocity.x = 0;
      angularVelocity.y = 0;
      angularVelocity.z = 0;
    });
}
