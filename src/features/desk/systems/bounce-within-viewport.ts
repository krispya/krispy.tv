import { type World } from 'koota';
import { Desk, Position, Ref, Velocity, Viewport } from '../traits.js';

function getViewportRange(size: number, viewportSize: number, wallBuffer: number) {
  const halfSize = size / 2;
  const min = halfSize - wallBuffer;
  const max = viewportSize - halfSize + wallBuffer;

  if (min <= max) return { min, max };

  const midpoint = viewportSize / 2;
  return { min: midpoint, max: midpoint };
}

export function bounceWithinViewport(world: World) {
  const viewport = world.get(Viewport);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!viewport || !desk || viewport.width <= 0 || viewport.height <= 0) return;

  world.query(Position, Velocity, Ref).updateEach(([position, velocity, ref]) => {
    const width = ref.offsetWidth;
    const height = ref.offsetHeight;
    if (width <= 0 || height <= 0) return;

    const rangeX = getViewportRange(width, viewport.width, desk.wallBuffer);
    const rangeY = getViewportRange(height, viewport.height, desk.wallBuffer);

    if (position.x < rangeX.min) {
      position.x = rangeX.min;
      if (velocity.x < 0) velocity.x = -velocity.x * desk.wallBounce;
    } else if (position.x > rangeX.max) {
      position.x = rangeX.max;
      if (velocity.x > 0) velocity.x = -velocity.x * desk.wallBounce;
    }

    if (position.y < rangeY.min) {
      position.y = rangeY.min;
      if (velocity.y < 0) velocity.y = -velocity.y * desk.wallBounce;
    } else if (position.y > rangeY.max) {
      position.y = rangeY.max;
      if (velocity.y > 0) velocity.y = -velocity.y * desk.wallBounce;
    }
  });
}
