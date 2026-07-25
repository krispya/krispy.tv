import { Not, type World } from 'koota';
import { IsOpen, IsPreloading, SketchMotion, SketchOf, Time } from '../traits/index.js';
import { stepSheetMotion } from '../utils/sheet-motion.js';

export function updateSketchMotion(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const dt = time.delta;

  world.query(SketchOf('*'), SketchMotion, Not(IsPreloading)).updateEach(([motion], entity) => {
    const paper = entity.targetFor(SketchOf);
    const isOpen = paper?.has(IsOpen) ?? false;

    if (stepSheetMotion(motion, isOpen, dt) === 'closed') {
      entity.destroy();
    }
  });
}
