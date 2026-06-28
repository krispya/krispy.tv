import type { World } from 'koota';
import { BoundingBox, Desk, IsEnteringDesk, KinematicBody, Position } from '../traits/index.js';
import { getVisibleDeskRectForWorld } from '../utils/camera.js';
import { getVisibleDeskBarrierRange } from '../utils/visible-desk-barrier.js';

export function activateVisibleDeskBarrier(world: World) {
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!desk) return;

  const visibleRect = getVisibleDeskRectForWorld(world);
  if (visibleRect.height <= 0) return;

  world
    .query(IsEnteringDesk, Position, BoundingBox, KinematicBody)
    .updateEach(([position, box], entity) => {
      const range = getVisibleDeskBarrierRange(visibleRect, box, desk.barrierOverflowRatio);
      if (!range) return;

      if (position.y <= range.maxY) {
        entity.remove(IsEnteringDesk);
      }
    });
}
