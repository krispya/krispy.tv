import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core.js';

// Draw the sketched rectangle right on the element's edge. The svg uses
// overflow-visible so the hand-drawn wobble can straddle the border.
const SKETCH_INSET = 0;
const DEFAULT_OPTIONS = {
  roughness: 1.6,
  bowing: 1.4,
  stroke: '#2f2a24',
  strokeWidth: 1.3,
  preserveVertices: false,
} satisfies Options;

const roughGenerator = rough.generator();

/** Stable positive integer seed derived from an arbitrary key. */
export function hashSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) + 1;
}

function getSketchOutlinePaths(width: number, height: number, seed: number, options?: Options) {
  const drawable = roughGenerator.rectangle(
    SKETCH_INSET,
    SKETCH_INSET,
    Math.max(width - SKETCH_INSET * 2, 0),
    Math.max(height - SKETCH_INSET * 2, 0),
    { ...DEFAULT_OPTIONS, ...options, seed }
  );

  return roughGenerator.toPaths(drawable);
}

export function SketchOutline({
  width,
  height,
  seed,
  options,
}: {
  width: number;
  height: number;
  seed: number;
  options?: Options;
}) {
  const paths = getSketchOutlinePaths(width, height, seed, options);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
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
    </svg>
  );
}
