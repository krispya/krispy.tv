import type { CSSProperties } from 'react';
import { color } from '../../../color.js';

export const POLAROID_LINE_COUNT = 3;
export const POLAROID_LINES_BOIL_CYCLE_SECONDS = 0.36;

type PolaroidLineKind = 'inner' | 'outer';

type PolaroidLinesLayout = {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

const POLAROID_LINES_ASSET_PATH = 'lines/polaroid';

const POLAROID_OUTER_LINE_SCALE_X = 1.04;
const POLAROID_OUTER_LINE_SCALE_Y = 1.04;
const POLAROID_OUTER_LINE_OFFSET_X = 0;
const POLAROID_OUTER_LINE_OFFSET_Y = 0;

const POLAROID_INNER_LINE_SCALE_X = 1.07;
const POLAROID_INNER_LINE_SCALE_Y = 1.06;
const POLAROID_INNER_LINE_OFFSET_X = 0;
const POLAROID_INNER_LINE_OFFSET_Y = 1;

const POLAROID_LINES_LAYOUTS = {
  outer: {
    scaleX: POLAROID_OUTER_LINE_SCALE_X,
    scaleY: POLAROID_OUTER_LINE_SCALE_Y,
    offsetX: POLAROID_OUTER_LINE_OFFSET_X,
    offsetY: POLAROID_OUTER_LINE_OFFSET_Y,
    opacity: 1,
  },
  inner: {
    scaleX: POLAROID_INNER_LINE_SCALE_X,
    scaleY: POLAROID_INNER_LINE_SCALE_Y,
    offsetX: POLAROID_INNER_LINE_OFFSET_X,
    offsetY: POLAROID_INNER_LINE_OFFSET_Y,
    opacity: 1,
  },
} satisfies Record<PolaroidLineKind, PolaroidLinesLayout>;

export const POLAROID_LINES_COLOR = color.accent.gold;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getPolaroidLinesBoilStartFrame(polaroidId: string): number {
  return hashString(polaroidId) % POLAROID_LINE_COUNT;
}

export function getPolaroidLineVariant(frame: number): number {
  return (frame % POLAROID_LINE_COUNT) + 1;
}

export function getPolaroidLineSrc(kind: PolaroidLineKind, variant: number): string {
  return `${import.meta.env.BASE_URL}${POLAROID_LINES_ASSET_PATH}/polaroid-${kind}-line-${variant}.png`;
}

export function getPolaroidLinesFrameStyle(
  kind: PolaroidLineKind,
  src: string,
  colorValue = POLAROID_LINES_COLOR
): CSSProperties {
  const layout = POLAROID_LINES_LAYOUTS[kind];

  return {
    left: '50%',
    top: '50%',
    width: '100%',
    height: '100%',
    transform: `translate(calc(-50% + ${layout.offsetX}px), calc(-50% + ${layout.offsetY}px)) scale(${layout.scaleX}, ${layout.scaleY})`,
    transformOrigin: 'center center',
    opacity: layout.opacity,
    backgroundColor: colorValue,
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

export function getPolaroidLinesBoilPhaseOffset(polaroidId: string): number {
  const startFrame = getPolaroidLinesBoilStartFrame(polaroidId);
  const slotDuration = POLAROID_LINES_BOIL_CYCLE_SECONDS / POLAROID_LINE_COUNT;
  const desync = ((hashString(`${polaroidId}:polaroid-lines-boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}

export type { PolaroidLineKind };
