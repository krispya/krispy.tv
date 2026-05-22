import { type World } from 'koota';
import { Desk, IsEnteringDesk, Paper, Position, Ref, Viewport } from '../traits/index.js';
import { getViewportRange } from '../utils/math.js';

export function activateWallBarrier(world: World) {
  const viewport = world.get(Viewport);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!viewport || !desk || viewport.height <= 0) return;

  world.query(IsEnteringDesk, Paper, Position, Ref).updateEach(([_paper, position, ref], entity) => {
    const height = ref.offsetHeight;
    if (height <= 0) return;

    const rangeY = getViewportRange(height, viewport.height, desk.wallGutter);
    if (position.y <= rangeY.max) entity.remove(IsEnteringDesk);
  });
}
