import type { Entity } from 'koota';
import { FoldedPaperMotion } from '../traits/index.js';

/**
 * Progress above which the sheet is lifted off the page block. Below it the
 * packet is only sliding along the fore-edge, so the book is free to move.
 */
export const FOLDED_PAPER_HELD_PROGRESS = 0.25;

/** True while the book's letter is out: opening, or closing but still lifted. */
export function isFoldedPaperOut(entity: Entity) {
  const motion = entity.get(FoldedPaperMotion);
  if (!motion) return false;

  return motion.phase === 'opening' || motion.progress > FOLDED_PAPER_HELD_PROGRESS;
}
