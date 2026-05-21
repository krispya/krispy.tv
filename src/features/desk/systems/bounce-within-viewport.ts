import { Not, type World } from 'koota';
import { Desk, IsEnteringDesk, Paper, Position, Ref, Velocity, Viewport } from '../traits/index.js';
import { getViewportRange } from '../utils/viewport-range.js';

export function bounceWithinViewport(world: World) {
  const viewport = world.get(Viewport);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!viewport || !desk || viewport.width <= 0 || viewport.height <= 0) return;

  world
    .query(Paper, Position, Velocity, Ref, Not(IsEnteringDesk))
    .updateEach(([_paper, position, velocity, ref]) => {
      const width = ref.offsetWidth;
      const height = ref.offsetHeight;
      if (width <= 0 || height <= 0) return;

      const rangeX = getViewportRange(width, viewport.width, desk.wallBuffer);
      const rangeY = getViewportRange(height, viewport.height, desk.wallBuffer);

      if (position.x < rangeX.min) {
        position.x = rangeX.min;
        if (velocity.x < 0) {
          velocity.x = -velocity.x * desk.wallBounce;
          velocity.y *= desk.wallFriction;
        }
      } else if (position.x > rangeX.max) {
        position.x = rangeX.max;
        if (velocity.x > 0) {
          velocity.x = -velocity.x * desk.wallBounce;
          velocity.y *= desk.wallFriction;
        }
      }

      if (position.y < rangeY.min) {
        position.y = rangeY.min;
        if (velocity.y < 0) {
          velocity.y = -velocity.y * desk.wallBounce;
          velocity.x *= desk.wallFriction;
        }
      } else if (position.y > rangeY.max) {
        position.y = rangeY.max;
        if (velocity.y > 0) {
          velocity.y = -velocity.y * desk.wallBounce;
          velocity.x *= desk.wallFriction;
        }
      }
    });
}
