import type { CSSProperties } from 'react';
import {
  type BookLineKind,
  BOOK_LINE_COUNT,
  getBookLineSrc,
  getBookLineVariant,
  getBookLinesBoilPhaseOffset,
  getBookLinesBoilStartFrame,
  getBookLinesFrameStyle,
} from '../presentation/book-lines.js';

export function BookLinesOverlay({
  bookId,
  kind,
  lineColor,
}: {
  bookId: string;
  kind: BookLineKind;
  lineColor: string;
}) {
  const phaseOffset = getBookLinesBoilPhaseOffset(`${bookId}:${kind}`);
  const startFrame = getBookLinesBoilStartFrame(`${bookId}:${kind}`);

  return (
    <div
      aria-hidden="true"
      className="paper-lines-boil pointer-events-none absolute inset-0 overflow-visible"
      style={{ '--boil-phase': `${phaseOffset}s` } as CSSProperties}
    >
      {Array.from({ length: BOOK_LINE_COUNT }, (_, frameIndex) => {
        const boilFrame = frameIndex + startFrame;
        const src = getBookLineSrc(kind, getBookLineVariant(boilFrame));

        return (
          <div
            key={frameIndex}
            className={`paper-lines-boil-frame paper-lines-boil-frame--${frameIndex} absolute`}
            style={getBookLinesFrameStyle(kind, src, lineColor)}
          />
        );
      })}
    </div>
  );
}
