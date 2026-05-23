import { Not, type World } from 'koota';
import { ArticleOf, IsOpen, IsPreloading, Position, Time, Velocity } from '../traits/index.js';

/** Spring stiffness (ω²). Higher = snappier. */
const STIFFNESS = 100;
/** Damping coefficient (2ζω). Critically damped when = 2√STIFFNESS ≈ 20. */
const DAMPING = 20;
const REST_EPSILON = 0.001;

/** Constant downward acceleration for the close — feels like a slam. */
const CLOSE_ACCELERATION = 80;

export function updateArticleMotion(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const dt = time.delta;

  world
    .query(ArticleOf('*'), Position, Velocity, Not(IsPreloading))
    .updateEach(([pos, vel], entity) => {
      const paper = entity.targetFor(ArticleOf);
      const isOpen = paper?.has(IsOpen) ?? false;

      if (!isOpen) {
        // Closing: constant acceleration downward (accelerating slam)
        vel.y += CLOSE_ACCELERATION * dt;

        if (pos.y >= 1) {
          entity.destroy();
        }
        return;
      }

      // Opening: critically-damped spring toward y=0
      const displacement = pos.y;
      vel.y += (-STIFFNESS * displacement - DAMPING * vel.y) * dt;

      if (Math.abs(pos.y) < REST_EPSILON && Math.abs(vel.y) < REST_EPSILON) {
        pos.y = 0;
        vel.y = 0;
      }
    });
}
