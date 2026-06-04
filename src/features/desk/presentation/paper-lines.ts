import type { CSSProperties } from 'react';
import { color } from '../../../color.js';

export type PaperLinesLayout = {
  /** Scale from the center of the paper face (1 = fit the box). */
  scaleX: number;
  scaleY: number;
  /** px, applied after centering on the paper face */
  offsetX: number;
  offsetY: number;
  opacity: number;
};

export const PAPER_LINES_COLOR = color.line.ink;

/** Hand-drawn US Letter line art — tune placement here. */
export const PAPER_LINES_LAYOUT = {
  scaleX: 1.1,
  scaleY: 1.065,
  offsetX: 0,
  offsetY: -1,
  opacity: 0.5,
} satisfies PaperLinesLayout;

export const US_LETTER_LINE_COUNT = 3;

/** Full boil cycle; each of three variants is visible for one third. */
export const PAPER_LINES_BOIL_CYCLE_SECONDS = 0.36;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

/** Which boil slot (0–2) this paper begins on in the cycle. */
export function getPaperLinesBoilStartFrame(paperId: string): number {
  return hashString(paperId) % US_LETTER_LINE_COUNT;
}

/** 1-based variant index for `us_letter-Na.png` (boil slot, not per-paper). */
export function getPaperLineVariant(frame: number): number {
  return (frame % US_LETTER_LINE_COUNT) + 1;
}

export function getPaperLineSrc(variant: number): string {
  return `${import.meta.env.BASE_URL}lines/us_letter-${variant}a.png`;
}

export function getPaperLinesTransform(layout: PaperLinesLayout = PAPER_LINES_LAYOUT): string {
  return `translate(calc(-50% + ${layout.offsetX}px), calc(-50% + ${layout.offsetY}px)) scale(${layout.scaleX}, ${layout.scaleY})`;
}

export function getPaperLinesFrameStyle(
  src: string,
  layout: PaperLinesLayout = PAPER_LINES_LAYOUT
): CSSProperties {
  return {
    left: '50%',
    top: '50%',
    width: '100%',
    height: '100%',
    transform: getPaperLinesTransform(layout),
    transformOrigin: 'center center',
    opacity: layout.opacity,
    backgroundColor: PAPER_LINES_COLOR,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };
}

export function getPaperLinesBoilPhaseOffset(paperId: string): number {
  const startFrame = getPaperLinesBoilStartFrame(paperId);
  const slotDuration = PAPER_LINES_BOIL_CYCLE_SECONDS / US_LETTER_LINE_COUNT;
  const desync = ((hashString(`${paperId}:boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}
