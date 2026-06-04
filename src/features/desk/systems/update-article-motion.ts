import { Not, type World } from 'koota';
import { ArticleMotion, ArticleOf, IsOpen, IsPreloading, Time } from '../traits/index.js';

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

  world.query(ArticleOf('*'), ArticleMotion, Not(IsPreloading)).updateEach(([motion], entity) => {
    const paper = entity.targetFor(ArticleOf);
    const isOpen = paper?.has(IsOpen) ?? false;

    if (!isOpen) {
      // Closing: constant acceleration downward (accelerating slam)
      motion.velocity += CLOSE_ACCELERATION * dt;
      motion.progress += motion.velocity * dt;

      if (motion.progress >= 1) {
        entity.destroy();
      }
      return;
    }

    // Opening: critically-damped spring toward y=0
    const displacement = motion.progress;
    motion.velocity += (-STIFFNESS * displacement - DAMPING * motion.velocity) * dt;
    motion.progress += motion.velocity * dt;

    if (Math.abs(motion.progress) < REST_EPSILON && Math.abs(motion.velocity) < REST_EPSILON) {
      motion.progress = 0;
      motion.velocity = 0;
    }
  });
}
