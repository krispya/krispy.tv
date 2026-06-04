import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core.js';
import type { CSSProperties } from 'react';
import { color } from '../../../color.js';
import { withAlpha } from '../utils/color.js';

// Draw the sketched rectangle right on the element's edge. The svg uses
// overflow-visible so the hand-drawn wobble can straddle the border.
const SKETCH_INSET = 0;
const DEFAULT_OPTIONS = {
  roughness: 1.6,
  bowing: 1.4,
  stroke: withAlpha(color.line.ink, 0.5),
  strokeWidth: 1.3,
  preserveVertices: false,
} satisfies Options;

const BOIL_VARIANT_COUNT = 3;
/** Full cycle length; each variant is visible for 1/3 (~8 fps boil). */
const BOIL_CYCLE_SECONDS = 0.36;

const roughGenerator = rough.generator();

type SketchPath = ReturnType<typeof roughGenerator.toPaths>[number];

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

function getBoilPhaseOffset(seed: number) {
  // Desync outlines so they do not boil in lockstep.
  return -((seed % 997) / 997) * BOIL_CYCLE_SECONDS;
}

function SketchPaths({ paths }: { paths: SketchPath[] }) {
  return paths.map((path, index) => (
    <path
      key={index}
      d={path.d}
      stroke={path.stroke}
      strokeWidth={path.strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ));
}

export function SketchOutline({
  width,
  height,
  seed,
  options,
  animate = true,
  paused = false,
}: {
  width: number;
  height: number;
  seed: number;
  options?: Options;
  /** Cycle rough.js seeds for a line-boil effect (CSS-driven). */
  animate?: boolean;
  /** Freeze the boil on the current frame (e.g. while dragging). */
  paused?: boolean;
}) {
  const phaseOffset = getBoilPhaseOffset(seed);
  const variants = animate
    ? Array.from({ length: BOIL_VARIANT_COUNT }, (_, index) =>
        getSketchOutlinePaths(width, height, seed + index, options)
      )
    : [getSketchOutlinePaths(width, height, seed, options)];

  return (
    <svg
      aria-hidden="true"
      className={`sketch-boil pointer-events-none absolute inset-0 overflow-visible${animate ? '' : 'sketch-boil--static'}${paused ? 'sketch-boil--paused' : ''}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ '--boil-phase': `${phaseOffset}s` } as CSSProperties}
    >
      {variants.map((paths, frameIndex) => (
        <g key={frameIndex} className={`sketch-boil-frame sketch-boil-frame--${frameIndex}`}>
          <SketchPaths paths={paths} />
        </g>
      ))}
    </svg>
  );
}
