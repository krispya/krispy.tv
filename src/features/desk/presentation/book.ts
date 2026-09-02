import { STAGE_TILT_DEG } from './stage.js';

// Book lies flat like paper; a tiny tilt reveals just a sliver of the page edges.
export const BASE_BOOK_ROTATE_X = 5;
export const BASE_BOOK_ROTATE_Y = 3;

/**
 * Item rotation (degrees) that cancels the stage tilt and the book's own base
 * tilt so the cover — and anything floating above it — faces the screen head-on.
 * The renderer applies `rotateX(var(--item-rotate-x) + BASE_X)` and
 * `rotateY(var(--item-rotate-y) - BASE_Y)` inside the stage's `rotateX(tilt)`.
 */
export const SCREEN_FACING_BOOK_ROTATION = {
  x: -(STAGE_TILT_DEG + BASE_BOOK_ROTATE_X),
  y: BASE_BOOK_ROTATE_Y,
  z: 0,
} as const;
