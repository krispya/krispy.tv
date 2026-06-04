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
  Viewport,
} from '../traits/index.js';
import {
  applyBarrierBounceSpin,
  getBounceSpinBias,
  reflectVelocityOnBarrier,
} from '../utils/barrier-bounce.js';
import { getViewportRange } from '../utils/math.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';

export function bounceWithinViewport(world: World) {
  const viewport = world.get(Viewport);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!viewport || !desk || viewport.width <= 0 || viewport.height <= 0) return;

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
        cssPixelsToMeters(viewport.width),
        cssPixelsToMeters(desk.wallGutter)
      );
      const rangeY = getViewportRange(
        height,
        cssPixelsToMeters(viewport.height),
        cssPixelsToMeters(desk.wallGutter)
      );

      if (position.x < rangeX.min) {
        const normal = { x: 1, y: 0 };
        position.x = rangeX.min;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      } else if (position.x > rangeX.max) {
        const normal = { x: -1, y: 0 };
        position.x = rangeX.max;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      }

      if (position.y < rangeY.min) {
        const normal = { x: 0, y: 1 };
        position.y = rangeY.min;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      } else if (position.y > rangeY.max) {
        const normal = { x: 0, y: -1 };
        position.y = rangeY.max;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      }
    });
}
