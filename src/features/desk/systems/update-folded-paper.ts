import type { World } from 'koota';
import { FoldedPaperMotion, Time } from '../traits/index.js';
import { clamp01, stepSpring } from '../utils/math.js';

// Near-critically damped so the sheet eases out and unfolds without bouncing.
const PROGRESS_STIFFNESS = 22;
const PROGRESS_DAMPING = 9.4;
const MAX_SPRING_DELTA = 1 / 30;
const PROGRESS_REST_EPSILON = 0.01;

export function updateFoldedPaper(world: World) {
  const time = world.get(Time);
  if (!time) return;

  const delta = Math.min(time.delta, MAX_SPRING_DELTA);

  world.query(FoldedPaperMotion).updateEach(([motion], entity) => {
    const target = motion.phase === 'closing' ? 0 : 1;
    const next = stepSpring(
      motion.progress,
      motion.progressVelocity,
      target,
      PROGRESS_STIFFNESS,
      PROGRESS_DAMPING,
      delta
    );

    motion.progress = clamp01(next.value);
    motion.progressVelocity = next.velocity;

    // Within this band the pose is visually at rest; the spring's velocity tail
    // carries no visible motion, so don't wait on it.
    if (Math.abs(motion.progress - target) > PROGRESS_REST_EPSILON) return;

    motion.progress = target;
    motion.progressVelocity = 0;

    if (motion.phase === 'closing') entity.remove(FoldedPaperMotion);
  });
}
