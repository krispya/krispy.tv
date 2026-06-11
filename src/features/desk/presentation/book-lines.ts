import type { CSSProperties } from 'react';
import { color } from '../../../color.js';

export const BOOK_LINE_COUNT = 3;
export const BOOK_LINES_BOIL_CYCLE_SECONDS = 0.36;

type BookLineKind = 'cover' | 'side' | 'spine';

type BookLinesLayout = {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

const BOOK_LINES_ASSET_PATH = 'lines/books';

const BOOK_COVER_LINE_SCALE_X = 1.07;
const BOOK_COVER_LINE_SCALE_Y = 1.04;
const BOOK_COVER_LINE_OFFSET_X = 1;
const BOOK_COVER_LINE_OFFSET_Y = 0;

const BOOK_SPINE_LINE_SCALE_X = 1.26;
const BOOK_SPINE_LINE_SCALE_Y = 1.05;
const BOOK_SPINE_LINE_OFFSET_X = -1;
const BOOK_SPINE_LINE_OFFSET_Y = 0;

const BOOK_SIDE_LINE_SCALE_X = 1.05;
const BOOK_SIDE_LINE_SCALE_Y = 1.09;
const BOOK_SIDE_LINE_OFFSET_X = 0;
const BOOK_SIDE_LINE_OFFSET_Y = 0;

const BOOK_LINES_LAYOUTS = {
  cover: {
    scaleX: BOOK_COVER_LINE_SCALE_X,
    scaleY: BOOK_COVER_LINE_SCALE_Y,
    offsetX: BOOK_COVER_LINE_OFFSET_X,
    offsetY: BOOK_COVER_LINE_OFFSET_Y,
    opacity: 1,
  },
  spine: {
    scaleX: BOOK_SPINE_LINE_SCALE_X,
    scaleY: BOOK_SPINE_LINE_SCALE_Y,
    offsetX: BOOK_SPINE_LINE_OFFSET_X,
    offsetY: BOOK_SPINE_LINE_OFFSET_Y,
    opacity: 1,
  },
  side: {
    scaleX: BOOK_SIDE_LINE_SCALE_X,
    scaleY: BOOK_SIDE_LINE_SCALE_Y,
    offsetX: BOOK_SIDE_LINE_OFFSET_X,
    offsetY: BOOK_SIDE_LINE_OFFSET_Y,
    opacity: 1,
  },
} satisfies Record<BookLineKind, BookLinesLayout>;

export const BOOK_LINES_COLOR = color.line.ink;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getBookLinesBoilStartFrame(bookId: string): number {
  return hashString(bookId) % BOOK_LINE_COUNT;
}

export function getBookLineVariant(frame: number): number {
  return (frame % BOOK_LINE_COUNT) + 1;
}

export function getBookLineSrc(kind: BookLineKind, variant: number): string {
  return `${import.meta.env.BASE_URL}${BOOK_LINES_ASSET_PATH}/book-${kind}-line-${variant}.png`;
}

export function getBookLinesFrameStyle(
  kind: BookLineKind,
  src: string,
  colorValue = BOOK_LINES_COLOR
): CSSProperties {
  const layout = BOOK_LINES_LAYOUTS[kind];

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

export function getBookLinesBoilPhaseOffset(bookId: string): number {
  const startFrame = getBookLinesBoilStartFrame(bookId);
  const slotDuration = BOOK_LINES_BOIL_CYCLE_SECONDS / BOOK_LINE_COUNT;
  const desync = ((hashString(`${bookId}:book-lines-boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}

export type { BookLineKind };
