import { clamp01, easeInOutCubic, easeOutCubic } from '../utils/math.js';
import { inchesToDeskPixels, US_LETTER_INCHES } from '../utils/dimensions.js';
import { FOLDED_PAPER_HELD_PROGRESS } from '../utils/folded-paper.js';

/** CSS custom properties the book's DOM node exposes for its folded sheet. */
export const FOLDED_PAPER_SLIDE_VAR = '--folded-paper-slide';
export const FOLDED_PAPER_RISE_VAR = '--folded-paper-rise';
export const FOLDED_PAPER_DRIFT_VAR = '--folded-paper-drift';
export const FOLDED_PAPER_FOLD_X_VAR = '--folded-paper-fold-x';
export const FOLDED_PAPER_FOLD_Y_VAR = '--folded-paper-fold-y';

/** Pixels. The unfolded sheet is a US letter at desk scale. */
export const FOLDED_PAPER_SHEET_WIDTH_PX = inchesToDeskPixels(US_LETTER_INCHES.width);
export const FOLDED_PAPER_SHEET_HEIGHT_PX = inchesToDeskPixels(US_LETTER_INCHES.height);
/** Pixels. Folded in quarters, so the packet is one quadrant of the sheet. */
export const FOLDED_PAPER_PANEL_WIDTH_PX = FOLDED_PAPER_SHEET_WIDTH_PX / 2;
export const FOLDED_PAPER_PANEL_HEIGHT_PX = FOLDED_PAPER_SHEET_HEIGHT_PX / 2;
/** Pixels. Visual gap between stacked layers of the folded packet. */
export const FOLDED_PAPER_LAYER_PX = 0.5;
/** Pixels. How far past the fore-edge the packet slides before lifting. */
export const FOLDED_PAPER_SLIDE_GAP_PX = 10;
/**
 * Pixels above the front cover where the unfolded sheet floats. High enough to
 * clear the sticky note's peeled edge with room for the flaps to swing.
 */
export const FOLDED_PAPER_LIFT_HEIGHT_PX = 72;

/** Progress at which the packet has fully cleared the fore-edge. */
const SLIDE_END = 0.3;
/** The packet rises straight up first, so nothing sweeps across the cover. */
const RISE_START = FOLDED_PAPER_HELD_PROGRESS;
const RISE_END = 0.55;
/** Meanwhile it drifts sideways to sit centered over the book. */
const DRIFT_START = 0.3;
const DRIFT_END = 0.8;
/** Only once it is up does the bottom half unfold (last fold in, first out). */
const FOLD_X_START = 0.52;
const FOLD_X_END = 0.78;
/** Then the right half swings open. */
const FOLD_Y_START = 0.68;
const FOLD_Y_END = 1;

export type FoldedPaperPose = {
  /** 0–1 along the fore-edge slide. */
  slide: number;
  /** 0–1 vertical rise from the page block to its floating height. */
  rise: number;
  /** 0–1 sideways drift from the slid-out spot to centered over the book. */
  drift: number;
  /** Degrees. 180 = bottom half folded up over the top half. */
  foldX: number;
  /** Degrees. 180 = right half folded over the left half. */
  foldY: number;
};

function span(progress: number, start: number, end: number) {
  return easeInOutCubic(clamp01((progress - start) / (end - start)));
}

export function getFoldedPaperPose(progress: number): FoldedPaperPose {
  const p = clamp01(progress);

  return {
    slide: span(p, 0, SLIDE_END),
    // Ease-out so the packet gets up and away from the cover quickly.
    rise: easeOutCubic(clamp01((p - RISE_START) / (RISE_END - RISE_START))),
    drift: span(p, DRIFT_START, DRIFT_END),
    foldX: 180 * (1 - span(p, FOLD_X_START, FOLD_X_END)),
    foldY: 180 * (1 - span(p, FOLD_Y_START, FOLD_Y_END)),
  };
}

export const FOLDED_PAPER_INITIAL_POSE_STYLE = {
  [FOLDED_PAPER_SLIDE_VAR]: '0',
  [FOLDED_PAPER_RISE_VAR]: '0',
  [FOLDED_PAPER_DRIFT_VAR]: '0',
  [FOLDED_PAPER_FOLD_X_VAR]: '180deg',
  [FOLDED_PAPER_FOLD_Y_VAR]: '180deg',
} as const;
