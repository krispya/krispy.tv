import { Not, type World } from 'koota';
import {
  AngularVelocity,
  Desk,
  IsEnteringDesk,
  IsOpen,
  Paper,
  Position,
  Ref,
  Velocity,
  Viewport,
} from '../traits/index.js';
import { getViewportRange } from '../utils/math.js';

/** How much of the wall-parallel velocity becomes angular spin on bounce. */
const BOUNCE_SPIN_FACTOR = 0.1;
/** How much of the wall-normal (impact) velocity becomes spin on bounce. */
const BOUNCE_NORMAL_SPIN_FACTOR = 0.06;

/** Returns a spin sign biased toward continuing existing rotation, or random if at rest. */
function spinSign(angVelZ: number) {
  return angVelZ !== 0 ? Math.sign(angVelZ) : Math.random() < 0.5 ? 1 : -1;
}

export function bounceWithinViewport(world: World) {
  const viewport = world.get(Viewport);
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!viewport || !desk || viewport.width <= 0 || viewport.height <= 0) return;

  world
    .query(Paper, Position, Velocity, AngularVelocity, Ref, Not(IsEnteringDesk), Not(IsOpen))
    .updateEach(([_paper, position, velocity, angularVelocity, ref]) => {
      const width = ref.offsetWidth;
      const height = ref.offsetHeight;
      if (width <= 0 || height <= 0) return;

      const rangeX = getViewportRange(width, viewport.width, desk.wallGutter);
      const rangeY = getViewportRange(height, viewport.height, desk.wallGutter);

      if (position.x < rangeX.min) {
        position.x = rangeX.min;
        if (velocity.x < 0) {
          const parallel = velocity.y;
          const normal = Math.abs(velocity.x);
          velocity.x = -velocity.x * desk.wallBounce;
          velocity.y *= desk.wallFriction;
          angularVelocity.z +=
            parallel * BOUNCE_SPIN_FACTOR +
            spinSign(angularVelocity.z) * normal * BOUNCE_NORMAL_SPIN_FACTOR;
        }
      } else if (position.x > rangeX.max) {
        position.x = rangeX.max;
        if (velocity.x > 0) {
          const parallel = velocity.y;
          const normal = Math.abs(velocity.x);
          velocity.x = -velocity.x * desk.wallBounce;
          velocity.y *= desk.wallFriction;
          angularVelocity.z -=
            parallel * BOUNCE_SPIN_FACTOR -
            spinSign(angularVelocity.z) * normal * BOUNCE_NORMAL_SPIN_FACTOR;
        }
      }

      if (position.y < rangeY.min) {
        position.y = rangeY.min;
        if (velocity.y < 0) {
          const parallel = velocity.x;
          const normal = Math.abs(velocity.y);
          velocity.y = -velocity.y * desk.wallBounce;
          velocity.x *= desk.wallFriction;
          angularVelocity.z -=
            parallel * BOUNCE_SPIN_FACTOR -
            spinSign(angularVelocity.z) * normal * BOUNCE_NORMAL_SPIN_FACTOR;
        }
      } else if (position.y > rangeY.max) {
        position.y = rangeY.max;
        if (velocity.y > 0) {
          const parallel = velocity.x;
          const normal = Math.abs(velocity.y);
          velocity.y = -velocity.y * desk.wallBounce;
          velocity.x *= desk.wallFriction;
          angularVelocity.z +=
            parallel * BOUNCE_SPIN_FACTOR +
            spinSign(angularVelocity.z) * normal * BOUNCE_NORMAL_SPIN_FACTOR;
        }
      }
    });
}
