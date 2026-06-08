import { Not, type World } from 'koota';
import {
  AngularVelocity,
  BoundingBox,
  Desk,
  IsEnteringDesk,
  IsOpen,
  KinematicBody,
  Position,
  Velocity,
} from '../traits/index.js';
import {
  applyBarrierBounceSpin,
  getBounceSpinBias,
  reflectVelocityOnBarrier,
} from '../utils/barrier-bounce.js';
import { getVisibleDeskRectForWorld } from '../utils/camera.js';
import { getViewportRange } from '../utils/math.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';

export function bounceWithinVisibleDesk(world: World) {
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!desk) return;

  const visibleRect = getVisibleDeskRectForWorld(world);
  if (visibleRect.width <= 0 || visibleRect.height <= 0) return;

  world
    .query(
      Position,
      Velocity,
      AngularVelocity,
      BoundingBox,
      KinematicBody,
      Not(IsEnteringDesk),
      Not(IsOpen)
    )
    .updateEach(([position, velocity, angularVelocity, box]) => {
      const width = cssPixelsToMeters(box.width);
      const height = cssPixelsToMeters(box.height);
      if (width <= 0 || height <= 0) return;

      const rangeX = getViewportRange(
        width,
        cssPixelsToMeters(visibleRect.width),
        cssPixelsToMeters(desk.wallGutter)
      );
      const rangeY = getViewportRange(
        height,
        cssPixelsToMeters(visibleRect.height),
        cssPixelsToMeters(desk.wallGutter)
      );
      const offsetX = cssPixelsToMeters(visibleRect.x);
      const offsetY = cssPixelsToMeters(visibleRect.y);
      const minX = offsetX + rangeX.min;
      const maxX = offsetX + rangeX.max;
      const minY = offsetY + rangeY.min;
      const maxY = offsetY + rangeY.max;

      if (position.x < minX) {
        const normal = { x: 1, y: 0 };
        position.x = minX;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      } else if (position.x > maxX) {
        const normal = { x: -1, y: 0 };
        position.x = maxX;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      }

      if (position.y < minY) {
        const normal = { x: 0, y: 1 };
        position.y = minY;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      } else if (position.y > maxY) {
        const normal = { x: 0, y: -1 };
        position.y = maxY;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      }
    });
}
