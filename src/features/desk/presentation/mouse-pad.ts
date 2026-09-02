import type { CSSProperties } from 'react';
import type { Options } from 'roughjs/bin/core.js';
import { shade } from '../utils/color.js';

const MOUSE_PAD_LINE_SHADE = -120;
const MOUSE_PAD_STITCH_SHADE = -44;
/** Pixels. Inset of the stitched border from the pad edge. */
export const MOUSE_PAD_STITCH_INSET_PX = 11;

/** Outer edge: one confident wobbly line, like the hand-drawn PNG art. */
export const MOUSE_PAD_EDGE_LINE_OPTIONS = {
  roughness: 1.9,
  bowing: 2.2,
  strokeWidth: 2.2,
  disableMultiStroke: true,
  preserveVertices: false,
} satisfies Options;

/** Inner stitching: thinner, dashed, a touch calmer than the edge. */
export const MOUSE_PAD_STITCH_LINE_OPTIONS = {
  roughness: 0.9,
  bowing: 1.2,
  strokeWidth: 1.1,
  disableMultiStroke: true,
  preserveVertices: false,
  strokeLineDash: [5, 4],
} satisfies Options;

export function getMousePadLineColor(fillColor: string): string {
  return shade(fillColor, MOUSE_PAD_LINE_SHADE);
}

export function getMousePadStitchColor(fillColor: string): string {
  return shade(fillColor, MOUSE_PAD_STITCH_SHADE);
}

/** Cloth face: flat fill with a faint weave and a soft light-to-shade wash. */
export function getMousePadFillStyle(fillColor: string, cornerRadius: number): CSSProperties {
  return {
    borderRadius: cornerRadius,
    backgroundColor: fillColor,
    backgroundImage: [
      'linear-gradient(155deg, rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.045))',
      'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0 1px, transparent 1px 3px)',
      'repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.03) 0 1px, transparent 1px 3px)',
    ].join(', '),
  };
}
