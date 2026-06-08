import type { World } from 'koota';
import { BoundingBox, Desk, IsEnteringDesk, KinematicBody, Position } from '../traits/index.js';
import { getVisibleDeskRectForWorld } from '../utils/camera.js';
import { getViewportRange } from '../utils/math.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';

export function activateVisibleDeskBarrier(world: World) {
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!desk) return;

  const visibleRect = getVisibleDeskRectForWorld(world);
  if (visibleRect.height <= 0) return;

  world
    .query(IsEnteringDesk, Position, BoundingBox, KinematicBody)
    .updateEach(([position, box], entity) => {
      const height = cssPixelsToMeters(box.height);
      if (height <= 0) return;

      const rangeY = getViewportRange(
        height,
        cssPixelsToMeters(visibleRect.height),
        cssPixelsToMeters(desk.wallGutter)
      );

      if (position.y <= cssPixelsToMeters(visibleRect.y) + rangeY.max) {
        entity.remove(IsEnteringDesk);
      }
    });
}
