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

/** SVG path for a rectangle with rounded corners (radius clamped to fit). */
function getRoundedRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);

  return [
    `M${x + r},${y}`,
    `H${x + width - r}`,
    `A${r},${r} 0 0 1 ${x + width},${y + r}`,
    `V${y + height - r}`,
    `A${r},${r} 0 0 1 ${x + width - r},${y + height}`,
    `H${x + r}`,
    `A${r},${r} 0 0 1 ${x},${y + height - r}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    'Z',
  ].join(' ');
}

function getSketchOutlinePaths(
  width: number,
  height: number,
  seed: number,
  radius: number,
  options?: Options
) {
  const innerWidth = Math.max(width - SKETCH_INSET * 2, 0);
  const innerHeight = Math.max(height - SKETCH_INSET * 2, 0);
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options, seed };
  const drawable =
    radius > 0
      ? roughGenerator.path(
          getRoundedRectPath(SKETCH_INSET, SKETCH_INSET, innerWidth, innerHeight, radius),
          resolvedOptions
        )
      : roughGenerator.rectangle(
          SKETCH_INSET,
          SKETCH_INSET,
          innerWidth,
          innerHeight,
          resolvedOptions
        );

  return roughGenerator.toPaths(drawable);
}

function getBoilPhaseOffset(seed: number) {
  // Desync outlines so they do not boil in lockstep.
  return -((seed % 997) / 997) * BOIL_CYCLE_SECONDS;
}

function SketchPaths({ paths, dashArray }: { paths: SketchPath[]; dashArray?: string }) {
  return paths.map((path, index) => (
    <path
      key={index}
      d={path.d}
      stroke={path.stroke}
      strokeWidth={path.strokeWidth}
      strokeDasharray={dashArray}
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
  radius = 0,
  options,
  animate = true,
  paused = false,
}: {
  width: number;
  height: number;
  seed: number;
  /** Corner radius in px; 0 draws a sharp rectangle. */
  radius?: number;
  options?: Options;
  /** Cycle rough.js seeds for a line-boil effect (CSS-driven). */
  animate?: boolean;
  /** Freeze the boil on the current frame (e.g. while dragging). */
  paused?: boolean;
}) {
  const phaseOffset = getBoilPhaseOffset(seed);
  // rough.js only carries dashes onto elements it draws itself; toPaths drops them.
  const dashArray = options?.strokeLineDash?.join(' ');
  const variants = animate
    ? Array.from({ length: BOIL_VARIANT_COUNT }, (_, index) =>
        getSketchOutlinePaths(width, height, seed + index, radius, options)
      )
    : [getSketchOutlinePaths(width, height, seed, radius, options)];

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
          <SketchPaths paths={paths} dashArray={dashArray} />
        </g>
      ))}
    </svg>
  );
}
