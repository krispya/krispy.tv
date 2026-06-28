import { Not, type World } from 'koota';
import {
  AngularVelocity,
  BoundingBox,
  Desk,
  IsControlled,
  IsEnteringDesk,
  IsFocused,
  IsOpen,
  ItemFocusMotion,
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
import { getVisibleDeskBarrierRange } from '../utils/visible-desk-barrier.js';

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
      Not(IsControlled),
      Not(IsEnteringDesk),
      Not(IsFocused),
      Not(ItemFocusMotion),
      Not(IsOpen)
    )
    .updateEach(([position, velocity, angularVelocity, box]) => {
      const range = getVisibleDeskBarrierRange(visibleRect, box, desk.barrierOverflowRatio);
      if (!range) return;

      if (position.x < range.minX) {
        const normal = { x: 1, y: 0 };
        position.x = range.minX;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      } else if (position.x > range.maxX) {
        const normal = { x: -1, y: 0 };
        position.x = range.maxX;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      }

      if (position.y < range.minY) {
        const normal = { x: 0, y: 1 };
        position.y = range.minY;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      } else if (position.y > range.maxY) {
        const normal = { x: 0, y: -1 };
        position.y = range.maxY;
        if (reflectVelocityOnBarrier(velocity, normal, desk.wallBounce, desk.wallFriction)) {
          applyBarrierBounceSpin(angularVelocity, normal, velocity, getBounceSpinBias(normal));
        }
      }
    });
}
