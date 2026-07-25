/** Spring stiffness (ω²). Higher = snappier. */
const STIFFNESS = 100;
/** Damping coefficient (2ζω). Critically damped when = 2√STIFFNESS ≈ 20. */
const DAMPING = 20;
const REST_EPSILON = 0.001;

/** Constant downward acceleration for the close — feels like a slam. */
const CLOSE_ACCELERATION = 80;

export type SheetMotionState = {
  /** Normalized sheet translation where 0 = open and 1 = below viewport. */
  progress: number;
  /** Normalized progress per second. */
  velocity: number;
};

export type SheetMotionPhase = 'moving' | 'resting' | 'closed';

/**
 * Steps one frame of the shared bottom-sheet motion: a critically-damped
 * spring toward open (progress 0) and an accelerating slam toward closed
 * (progress 1). Mutates `motion` in place and reports where it ended up.
 */
export function stepSheetMotion(
  motion: SheetMotionState,
  isOpen: boolean,
  dt: number
): SheetMotionPhase {
  if (!isOpen) {
    motion.velocity += CLOSE_ACCELERATION * dt;
    motion.progress += motion.velocity * dt;

    return motion.progress >= 1 ? 'closed' : 'moving';
  }

  const displacement = motion.progress;
  motion.velocity += (-STIFFNESS * displacement - DAMPING * motion.velocity) * dt;
  motion.progress += motion.velocity * dt;

  if (Math.abs(motion.progress) < REST_EPSILON && Math.abs(motion.velocity) < REST_EPSILON) {
    motion.progress = 0;
    motion.velocity = 0;
    return 'resting';
  }

  return 'moving';
}
