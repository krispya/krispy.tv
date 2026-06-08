import type { CSSProperties } from 'react';
import { shade } from '../utils/color.js';

export const HEADPHONES_LINE_COUNT = 3;
export const HEADPHONES_BOIL_CYCLE_SECONDS = 0.36;

const HEADPHONES_ASSET_PATH = 'lines/headphones';
const HEADPHONES_ASSET_NAME = 'heaphones';

export const HEADPHONES_FILL_TONES = [
  { name: 'light', shade: 34 },
  { name: 'mid', shade: -8 },
  { name: 'dark', shade: -52 },
] as const;

type HeadphonesFillTone = (typeof HEADPHONES_FILL_TONES)[number]['name'];

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
  const fillTone = HEADPHONES_FILL_TONES.find((candidate) => candidate.name === tone);
  return shade(fillColor, fillTone?.shade ?? 0);
}

export function getHeadphonesLineSrc(variant: number): string {
  return `${import.meta.env.BASE_URL}${HEADPHONES_ASSET_PATH}/${HEADPHONES_ASSET_NAME}-line-${variant}.png`;
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

export function getHeadphonesBoilPhaseOffset(id: string): number {
  const startFrame = getHeadphonesBoilStartFrame(id);
  const slotDuration = HEADPHONES_BOIL_CYCLE_SECONDS / HEADPHONES_LINE_COUNT;
  const desync = ((hashString(`${id}:boil`) % 997) / 997) * slotDuration;

  return -(startFrame * slotDuration + desync);
}
