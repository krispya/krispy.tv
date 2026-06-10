import type { CSSProperties } from 'react';
import rough from 'roughjs';
import { color } from '../../color.js';

const SIZE = 72;
const RADIUS = 26;
/** Degrees. Open mouth of the arc so it reads as a spinner, not a circle. */
const GAP_DEGREES = 80;
const BOIL_VARIANT_COUNT = 3;

const roughGenerator = rough.generator();

function getArcPaths(seed: number) {
  const gap = (GAP_DEGREES * Math.PI) / 180;
  const drawable = roughGenerator.arc(
    SIZE / 2,
    SIZE / 2,
    RADIUS * 2,
    RADIUS * 2,
    gap / 2,
    Math.PI * 2 - gap / 2,
    false,
    {
      roughness: 1.8,
      bowing: 2,
      stroke: color.line.ink,
      strokeWidth: 3.5,
      preserveVertices: false,
      seed,
    }
  );

  return roughGenerator.toPaths(drawable);
}

/**
 * Hand-drawn pencil arc that turns in stepped increments (so the rotation
 * feels animated on ones) while the stroke boils through three rough.js
 * variants, matching the desk's sketch aesthetic.
 */
export function Spinner() {
  const variants = Array.from({ length: BOIL_VARIANT_COUNT }, (_, index) => getArcPaths(index + 1));

  return (
    <div className="loading-spinner" style={{ width: SIZE, height: SIZE }}>
      <svg
        aria-hidden="true"
        className="sketch-boil overflow-visible"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        style={{ '--boil-phase': '0s' } as CSSProperties}
      >
        {variants.map((paths, frameIndex) => (
          <g key={frameIndex} className={`sketch-boil-frame sketch-boil-frame--${frameIndex}`}>
            {paths.map((path, index) => (
              <path
                key={index}
                d={path.d}
                stroke={path.stroke}
                strokeWidth={path.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
