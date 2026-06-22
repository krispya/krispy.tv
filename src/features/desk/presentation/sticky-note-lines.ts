import type { CSSProperties } from 'react';
import { color } from '../../../color.js';

export const STICKY_NOTE_LINE_COUNT = 3;
export const STICKY_NOTE_LINES_BOIL_CYCLE_SECONDS = 0.36;
export const STICKY_NOTE_LINES_COLOR = color.line.ink;

const STICKY_NOTE_LINES_ASSET_PATH = 'lines/sticky-note';
const STICKY_NOTE_LINE_SCALE_X = 1.05;
const STICKY_NOTE_LINE_SCALE_Y = 1.05;
const STICKY_NOTE_LINE_OFFSET_X = 0;
const STICKY_NOTE_LINE_OFFSET_Y = 0;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getStickyNoteLinesBoilStartFrame(stickyNoteId: string): number {
  return hashString(stickyNoteId) % STICKY_NOTE_LINE_COUNT;
}

export function getStickyNoteLineVariant(frame: number): number {
  return (frame % STICKY_NOTE_LINE_COUNT) + 1;
}

export function getStickyNoteLineSrc(variant: number): string {
  return `${import.meta.env.BASE_URL}${STICKY_NOTE_LINES_ASSET_PATH}/sticky-note-line-${variant}.png`;
}

export function getStickyNoteLinesFrameStyle(
  src: string,
  colorValue = STICKY_NOTE_LINES_COLOR
): CSSProperties {
  return {
    left: '50%',
    top: '50%',
    width: '100%',
    height: '100%',
    transform: `translate(calc(-50% + ${STICKY_NOTE_LINE_OFFSET_X}px), calc(-50% + ${STICKY_NOTE_LINE_OFFSET_Y}px)) scale(${STICKY_NOTE_LINE_SCALE_X}, ${STICKY_NOTE_LINE_SCALE_Y})`,
    transformOrigin: 'center center',
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

export function getStickyNoteLinesBoilPhaseOffset(stickyNoteId: string): number {
  const startFrame = getStickyNoteLinesBoilStartFrame(stickyNoteId);
  const slotDuration = STICKY_NOTE_LINES_BOIL_CYCLE_SECONDS / STICKY_NOTE_LINE_COUNT;
  const desync = ((hashString(`${stickyNoteId}:sticky-note-lines-boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}
