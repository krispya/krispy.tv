import type { CSSProperties } from 'react';
import {
  getHeadphonesBoilPhaseOffset,
  getHeadphonesBoilStartFrame,
  getHeadphonesLineMaskStyle,
  getHeadphonesLineSrc,
  getHeadphonesLineVariant,
  HEADPHONES_LINE_COUNT,
} from '../presentation/headphones-lines.js';

export function HeadphonesLinesOverlay({
  headphonesId,
  lineColor,
}: {
  headphonesId: string;
  lineColor: string;
}) {
  const phaseOffset = getHeadphonesBoilPhaseOffset(headphonesId);
  const startFrame = getHeadphonesBoilStartFrame(headphonesId);

  return (
    <div
      aria-hidden="true"
      className="paper-lines-boil pointer-events-none absolute inset-0 overflow-visible"
      style={{ '--boil-phase': `${phaseOffset}s` } as CSSProperties}
    >
      {Array.from({ length: HEADPHONES_LINE_COUNT }, (_, frameIndex) => {
        const boilFrame = frameIndex + startFrame;
        const src = getHeadphonesLineSrc(getHeadphonesLineVariant(boilFrame));

        return (
          <div
            key={frameIndex}
            className={`paper-lines-boil-frame paper-lines-boil-frame--${frameIndex} absolute`}
            style={getHeadphonesLineMaskStyle(src, lineColor, 0.92)}
          />
        );
      })}
    </div>
  );
}
