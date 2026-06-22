import type { CSSProperties } from 'react';
import {
  getStickyNoteLineSrc,
  getStickyNoteLineVariant,
  getStickyNoteLinesBoilPhaseOffset,
  getStickyNoteLinesBoilStartFrame,
  getStickyNoteLinesFrameStyle,
  STICKY_NOTE_LINE_COUNT,
} from '../presentation/sticky-note-lines.js';

export function StickyNoteLinesOverlay({
  stickyNoteId,
  lineColor,
}: {
  stickyNoteId: string;
  lineColor: string;
}) {
  const phaseOffset = getStickyNoteLinesBoilPhaseOffset(stickyNoteId);
  const startFrame = getStickyNoteLinesBoilStartFrame(stickyNoteId);

  return (
    <div
      aria-hidden="true"
      className="paper-lines-boil pointer-events-none absolute inset-0 overflow-visible"
      style={{ '--boil-phase': `${phaseOffset}s` } as CSSProperties}
    >
      {Array.from({ length: STICKY_NOTE_LINE_COUNT }, (_, frameIndex) => {
        const boilFrame = frameIndex + startFrame;
        const src = getStickyNoteLineSrc(getStickyNoteLineVariant(boilFrame));

        return (
          <div
            key={frameIndex}
            className={`paper-lines-boil-frame paper-lines-boil-frame--${frameIndex} absolute`}
            style={getStickyNoteLinesFrameStyle(src, lineColor)}
          />
        );
      })}
    </div>
  );
}
