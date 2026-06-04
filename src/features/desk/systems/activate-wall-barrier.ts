import { type World } from 'koota';
import {
  BoundingBox,
  Desk,
  IsEnteringDesk,
  KinematicBody,
  Position,
  Viewport,
} from '../traits/index.js';
import { getViewportRange } from '../utils/math.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';

export function activateWallBarrier(world: World) {
  const viewport = world.get(Viewport);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!viewport || !desk || viewport.height <= 0) return;

  world
    .query(IsEnteringDesk, Position, BoundingBox, KinematicBody)
    .updateEach(([position, box], entity) => {
      const height = cssPixelsToMeters(box.height);
      if (height <= 0) return;

      const rangeY = getViewportRange(
        height,
        cssPixelsToMeters(viewport.height),
        cssPixelsToMeters(desk.wallGutter)
      );
      if (position.y <= rangeY.max) entity.remove(IsEnteringDesk);
    });
}
