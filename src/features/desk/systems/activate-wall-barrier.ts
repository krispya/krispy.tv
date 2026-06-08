import { type World } from 'koota';
import {
  BoundingBox,
  Camera,
  Desk,
  IsEnteringDesk,
  KinematicBody,
  Position,
  Viewport,
} from '../traits/index.js';
import { getViewportRange } from '../utils/math.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';
import { getVisibleDeskRect } from '../utils/camera.js';

export function activateWallBarrier(world: World) {
  const viewport = world.get(Viewport);
  const camera = world.get(Camera);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!desk) return;

  const visibleRect = getVisibleDeskRect(viewport, camera);
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
      if (position.y <= cssPixelsToMeters(visibleRect.y) + rangeY.max) entity.remove(IsEnteringDesk);
    });
}
