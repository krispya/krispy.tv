import type { CSSProperties } from 'react';
import { color } from '../../../color.js';

/** Public asset path (under `public/`). */
export const DESK_FOAM_IMAGE = 'foam-splash.jpg';
export const DESK_FOAM_TILE_SIZE_PX = 1480;
export const DESK_GEOMETRIC_GRUNGE_IMAGE = 'geometric_grunge_line_pattern-2x.webp';
export const DESK_GEOMETRIC_GRUNGE_TILE_SIZE_PX = {
  width: 1024,
  height: 512,
};

export type DeskBackgroundBase =
  | { type: 'color'; value: string }
  | { type: 'gradient'; value: string }
  | {
      type: 'image';
      value: string;
      size: string;
      position: string;
      repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
      tint?: { color: string; opacityPercent: number };
    };

/**
 * Desk background tuning. Foam is a high-contrast texture; `screen` / `lighten`
 * let the dark areas show the base while bright specks add grain. Foam sits on a
 * separate layer so `opacityPercent` only softens the texture, not the base.
 * `blendMode` is applied with `mix-blend-mode` so the foam composites into the base.
 */
export const deskBackground: {
  base: DeskBackgroundBase;
  foam: {
    blendMode: 'screen' | 'lighten' | 'overlay' | 'soft-light' | 'multiply' | 'normal';
    hueRotateDeg: number;
    saturatePercent: number;
    brightnessPercent: number;
    contrastPercent: number;
    /** 0 hides foam; 100 is full strength before blend mode. */
    opacityPercent: number;
  };
} = {
  base: {
    type: 'image',
    value: DESK_GEOMETRIC_GRUNGE_IMAGE,
    size: `${DESK_GEOMETRIC_GRUNGE_TILE_SIZE_PX.width}px ${DESK_GEOMETRIC_GRUNGE_TILE_SIZE_PX.height}px`,
    position: '0 0',
    repeat: 'repeat',
    tint: { color: color.accent.wood, opacityPercent: 68 },
  },
  foam: {
    blendMode: 'screen',
    hueRotateDeg: 0,
    saturatePercent: 100,
    brightnessPercent: 100,
    contrastPercent: 100,
    opacityPercent: 0,
  },
};

export function getDeskPublicAssetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

function getDeskFoamUrl() {
  return getDeskPublicAssetUrl(DESK_FOAM_IMAGE);
}

function getColorWithOpacity(colorValue: string, opacityPercent: number) {
  if (/^#[0-9a-f]{6}$/i.test(colorValue)) {
    const red = Number.parseInt(colorValue.slice(1, 3), 16);
    const green = Number.parseInt(colorValue.slice(3, 5), 16);
    const blue = Number.parseInt(colorValue.slice(5, 7), 16);

    return `rgb(${red} ${green} ${blue} / ${opacityPercent}%)`;
  }

  return `color-mix(in srgb, ${colorValue} ${opacityPercent}%, transparent)`;
}

function getDeskFoamFilter(): string | undefined {
  const { hueRotateDeg, saturatePercent, brightnessPercent, contrastPercent } = deskBackground.foam;
  const parts: string[] = [];

  if (hueRotateDeg !== 0) parts.push(`hue-rotate(${hueRotateDeg}deg)`);
  if (saturatePercent !== 100) parts.push(`saturate(${saturatePercent}%)`);
  if (brightnessPercent !== 100) parts.push(`brightness(${brightnessPercent}%)`);
  if (contrastPercent !== 100) parts.push(`contrast(${contrastPercent}%)`);

  return parts.length > 0 ? parts.join(' ') : undefined;
}

export function getDeskBaseStyle(): CSSProperties {
  const { base } = deskBackground;

  if (base.type === 'gradient') {
    return {
      backgroundImage: base.value,
      backgroundSize: 'auto',
      backgroundPosition: '0 0',
      backgroundRepeat: 'repeat',
    };
  }

  if (base.type === 'image') {
    const imageUrl = `url(${getDeskPublicAssetUrl(base.value)})`;

    if (base.tint) {
      const tint = getColorWithOpacity(base.tint.color, base.tint.opacityPercent);

      return {
        backgroundColor: color.surface.desk,
        backgroundImage: `linear-gradient(${tint}, ${tint}), ${imageUrl}`,
        backgroundBlendMode: 'normal, multiply',
        backgroundSize: `auto, ${base.size}`,
        backgroundPosition: `0 0, ${base.position}`,
        backgroundRepeat: `repeat, ${base.repeat}`,
      };
    }

    return {
      backgroundColor: color.surface.desk,
      backgroundImage: imageUrl,
      backgroundSize: base.size,
      backgroundPosition: base.position,
      backgroundRepeat: base.repeat,
    };
  }

  return { backgroundColor: base.value };
}

export function getDeskFoamLayerStyle(): CSSProperties | null {
  const { foam } = deskBackground;
  if (foam.opacityPercent <= 0) return null;

  const filter = getDeskFoamFilter();

  return {
    backgroundImage: `url(${getDeskFoamUrl()})`,
    mixBlendMode: foam.blendMode,
    backgroundSize: `${DESK_FOAM_TILE_SIZE_PX}px ${DESK_FOAM_TILE_SIZE_PX}px`,
    backgroundPosition: '0 0',
    backgroundRepeat: 'repeat',
    opacity: foam.opacityPercent / 100,
    ...(filter && { filter }),
  };
}
