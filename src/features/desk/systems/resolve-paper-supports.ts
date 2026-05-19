import { Not, type World } from 'koota';
import { Dragging, Paper, Position, StackIndex, Velocity } from '../traits.js';
import { metersToCssPixels } from '../utils/physics-units.js';

export function resolvePaperSupports(world: World) {
  world
    .query(Position, Velocity, Paper, StackIndex, Not(Dragging))
    .updateEach(([position, velocity, paper, stackIndex]) => {
      const supportZ = metersToCssPixels(stackIndex.value * paper.thickness);

      if (position.z >= supportZ) return;

      position.z = supportZ;
      if (velocity.z < 0) velocity.z = 0;
    });
}
