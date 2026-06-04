import type { CSSProperties } from 'react';
import {
  getPaperLineSrc,
  getPaperLineVariant,
  getPaperLinesBoilPhaseOffset,
  getPaperLinesBoilStartFrame,
  getPaperLinesFrameStyle,
  PAPER_LINES_LAYOUT,
  US_LETTER_LINE_COUNT,
} from '../presentation/paper-lines.js';

export function PaperLinesOverlay({
  paperId,
  animate = true,
  paused = false,
}: {
  paperId: string;
  /** Cycle line art variants for a boil effect (CSS-driven). */
  animate?: boolean;
  /** Freeze the boil on the current frame (e.g. while dragging). */
  paused?: boolean;
}) {
  const phaseOffset = getPaperLinesBoilPhaseOffset(paperId);
  const startFrame = getPaperLinesBoilStartFrame(paperId);
  const frameCount = animate ? US_LETTER_LINE_COUNT : 1;
  return (
    <div
      aria-hidden="true"
      className={`paper-lines-boil pointer-events-none absolute inset-0 overflow-visible${animate ? '' : 'paper-lines-boil--static'}${paused ? 'paper-lines-boil--paused' : ''}`}
      style={{ '--boil-phase': `${phaseOffset}s` } as CSSProperties}
    >
      {Array.from({ length: frameCount }, (_, frameIndex) => {
        const boilFrame = animate ? frameIndex : startFrame;
        const src = getPaperLineSrc(getPaperLineVariant(boilFrame));

        return (
          <div
            key={frameIndex}
            className={`paper-lines-boil-frame paper-lines-boil-frame--${frameIndex} absolute`}
            style={getPaperLinesFrameStyle(src, PAPER_LINES_LAYOUT)}
          />
        );
      })}
    </div>
  );
}
