import type { CSSProperties } from 'react';
import {
  type PolaroidLineKind,
  POLAROID_LINE_COUNT,
  getPolaroidLineSrc,
  getPolaroidLineVariant,
  getPolaroidLinesBoilPhaseOffset,
  getPolaroidLinesBoilStartFrame,
  getPolaroidLinesFrameStyle,
} from '../presentation/polaroid-lines.js';

export function PolaroidLinesOverlay({
  polaroidId,
  kind,
  lineColor,
}: {
  polaroidId: string;
  kind: PolaroidLineKind;
  lineColor: string;
}) {
  const phaseOffset = getPolaroidLinesBoilPhaseOffset(`${polaroidId}:${kind}`);
  const startFrame = getPolaroidLinesBoilStartFrame(`${polaroidId}:${kind}`);

  return (
    <div
      aria-hidden="true"
      className="paper-lines-boil pointer-events-none absolute inset-0 overflow-visible"
      style={{ '--boil-phase': `${phaseOffset}s` } as CSSProperties}
    >
      {Array.from({ length: POLAROID_LINE_COUNT }, (_, frameIndex) => {
        const boilFrame = frameIndex + startFrame;
        const src = getPolaroidLineSrc(kind, getPolaroidLineVariant(boilFrame));

        return (
          <div
            key={frameIndex}
            className={`paper-lines-boil-frame paper-lines-boil-frame--${frameIndex} absolute`}
            style={getPolaroidLinesFrameStyle(kind, src, lineColor)}
          />
        );
      })}
    </div>
  );
}
