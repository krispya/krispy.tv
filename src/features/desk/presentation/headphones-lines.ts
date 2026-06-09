import type { CSSProperties } from 'react';
import { color } from '../../../color.js';
import { shade } from '../utils/color.js';

export const HEADPHONES_LINE_COUNT = 3;
export const HEADPHONES_BOIL_CYCLE_SECONDS = 0.36;

const HEADPHONES_FILL_RENDER_WIDTH = 1646;
const HEADPHONES_FILL_RENDER_HEIGHT = 731;
const HEADPHONES_LINE_RENDER_WIDTH = 1700;
const HEADPHONES_LINE_RENDER_HEIGHT = 760;
const HEADPHONES_LINE_OFFSET_X = 10;
const HEADPHONES_LINE_OFFSET_Y = 2;

const HEADPHONES_STAND_SCALE = 1.7;
const HEADPHONES_STAND_OFFSET_X = 12;
const HEADPHONES_STAND_OFFSET_Y = -44;
const HEADPHONES_STAND_RENDER_WIDTH = 515;
const HEADPHONES_STAND_RENDER_HEIGHT = 752;

const HEADPHONES_ASSET_PATH = 'lines/headphones';
const HEADPHONES_ASSET_NAME = 'heaphones';
const HEADPHONES_STAND_ASSET_PATH = 'lines/stand';

type HeadphonesFillToneConfig = {
  name: 'light' | 'mid' | 'dark';
  shade: number;
  opacity?: number;
};

export const HEADPHONES_FILL_TONES = [
  { name: 'mid', shade: -8, opacity: 1 },
  { name: 'dark', shade: -52, opacity: 1 },
] as const satisfies readonly HeadphonesFillToneConfig[];

const HEADPHONES_LINE_SHADE = -88;
const HEADPHONES_STAND_FILL_COLOR = color.accent.wood;
const HEADPHONES_STAND_FILL_SHADE = 0;
const HEADPHONES_STAND_LINE_SHADE = -40;

type HeadphonesFillTone = (typeof HEADPHONES_FILL_TONES)[number]['name'];

function getHeadphonesFillTone(tone: HeadphonesFillTone): HeadphonesFillToneConfig | undefined {
  return (HEADPHONES_FILL_TONES as readonly HeadphonesFillToneConfig[]).find(
    (candidate) => candidate.name === tone
  );
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getHeadphonesBoilStartFrame(id: string): number {
  return hashString(id) % HEADPHONES_LINE_COUNT;
}

export function getHeadphonesLineVariant(frame: number): number {
  return (frame % HEADPHONES_LINE_COUNT) + 1;
}

export function getHeadphonesFillSrc(): string {
  return `${import.meta.env.BASE_URL}${HEADPHONES_ASSET_PATH}/${HEADPHONES_ASSET_NAME}-fill.png`;
}

export function getHeadphonesFillToneSrc(tone: HeadphonesFillTone): string {
  return `${import.meta.env.BASE_URL}${HEADPHONES_ASSET_PATH}/${HEADPHONES_ASSET_NAME}-fill-tone-${tone}.png`;
}

export function getHeadphonesFillToneColor(fillColor: string, tone: HeadphonesFillTone): string {
  const fillTone = getHeadphonesFillTone(tone);
  return shade(fillColor, fillTone?.shade ?? 0);
}

export function getHeadphonesFillToneOpacity(tone: HeadphonesFillTone): number {
  const fillTone = getHeadphonesFillTone(tone);
  return fillTone?.opacity ?? 1;
}

export function getHeadphonesLineColor(fillColor: string): string {
  return shade(fillColor, HEADPHONES_LINE_SHADE);
}

export function getHeadphonesLineSrc(variant: number): string {
  return `${import.meta.env.BASE_URL}${HEADPHONES_ASSET_PATH}/${HEADPHONES_ASSET_NAME}-line-${variant}.png`;
}

export function getHeadphonesStandFillSrc(): string {
  return `${import.meta.env.BASE_URL}${HEADPHONES_STAND_ASSET_PATH}/stand-fill.png`;
}

export function getHeadphonesStandFillColor(): string {
  return shade(HEADPHONES_STAND_FILL_COLOR, HEADPHONES_STAND_FILL_SHADE);
}

export function getHeadphonesStandLineColor(): string {
  return shade(HEADPHONES_STAND_FILL_COLOR, HEADPHONES_STAND_LINE_SHADE);
}

export function getHeadphonesStandLineSrc(variant: number): string {
  return `${import.meta.env.BASE_URL}${HEADPHONES_STAND_ASSET_PATH}/stand-line-${variant}.png`;
}

export function getHeadphonesMaskStyle(
  src: string,
  backgroundColor: string,
  opacity = 1
): CSSProperties {
  return {
    inset: 0,
    opacity,
    backgroundColor,
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

export function getHeadphonesLineMaskStyle(
  src: string,
  backgroundColor: string,
  opacity = 1
): CSSProperties {
  return {
    ...getHeadphonesMaskStyle(src, backgroundColor, opacity),
    inset: undefined,
    left: '50%',
    top: '50%',
    width: `${(HEADPHONES_LINE_RENDER_WIDTH / HEADPHONES_FILL_RENDER_WIDTH) * 100}%`,
    height: `${(HEADPHONES_LINE_RENDER_HEIGHT / HEADPHONES_FILL_RENDER_HEIGHT) * 100}%`,
    transform: `translate(calc(-50% + ${HEADPHONES_LINE_OFFSET_X}px), calc(-50% + ${HEADPHONES_LINE_OFFSET_Y}px))`,
    transformOrigin: 'center center',
  };
}

export function getHeadphonesStandMaskStyle(
  src: string,
  backgroundColor: string,
  opacity = 1
): CSSProperties {
  return {
    ...getHeadphonesMaskStyle(src, backgroundColor, opacity),
    inset: undefined,
    left: '50%',
    top: 0,
    width: `${((HEADPHONES_STAND_RENDER_WIDTH * HEADPHONES_STAND_SCALE) / HEADPHONES_FILL_RENDER_WIDTH) * 100}%`,
    height: `${((HEADPHONES_STAND_RENDER_HEIGHT * HEADPHONES_STAND_SCALE) / HEADPHONES_FILL_RENDER_HEIGHT) * 100}%`,
    transform: `translate(calc(-50% + ${HEADPHONES_STAND_OFFSET_X}px), ${HEADPHONES_STAND_OFFSET_Y}px)`,
    transformOrigin: 'top center',
  };
}

export function getHeadphonesBoilPhaseOffset(id: string): number {
  const startFrame = getHeadphonesBoilStartFrame(id);
  const slotDuration = HEADPHONES_BOIL_CYCLE_SECONDS / HEADPHONES_LINE_COUNT;
  const desync = ((hashString(`${id}:boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}
