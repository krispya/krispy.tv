/** 2D scale applied to a polaroid at full focus. */
export const POLAROID_FOCUSED_SCALE = 1.34;

/**
 * Layout for the MDX body column floated to the right of a focused polaroid.
 * Values are in desk-plane pixels (the focused card's footprint is its width
 * times `POLAROID_FOCUSED_SCALE`; stage transforms flatten `translateZ`, so
 * the focus lift adds no perceived scale).
 */
export const POLAROID_FOCUS_BODY_WIDTH_PX = 280;

/** Gap between the focused polaroid's scaled edge and the body column. */
export const POLAROID_FOCUS_BODY_GAP_PX = 56;

/**
 * 0–1. How much of the full centering shift the card takes on when a body is
 * present. 1 centers the card + body pair exactly; lower values bias the pair
 * right, keeping the photo closer to the focus point.
 */
export const POLAROID_FOCUS_BODY_CENTER_BIAS = 0.4;

/** How far the card shifts left when a body is present. */
export const POLAROID_FOCUS_BODY_SHIFT_PX =
  ((POLAROID_FOCUS_BODY_GAP_PX + POLAROID_FOCUS_BODY_WIDTH_PX) / 2) * POLAROID_FOCUS_BODY_CENTER_BIAS;

/** Viewport widths below this place the body under the polaroid instead. */
export const POLAROID_FOCUS_BODY_BREAKPOINT_PX = 640;

/** Gap between the focused polaroid's bottom edge and the body when below. */
export const POLAROID_FOCUS_BODY_BELOW_GAP_PX = 52;

/** Screen-edge padding for the body column when placed below. */
export const POLAROID_FOCUS_BODY_BELOW_INSET_PX = 20;

export type PolaroidFocusBodyPlacement = 'right' | 'below';

export function getPolaroidFocusBodyPlacement(viewportWidth: number): PolaroidFocusBodyPlacement {
  return viewportWidth < POLAROID_FOCUS_BODY_BREAKPOINT_PX ? 'below' : 'right';
}
