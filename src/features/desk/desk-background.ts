import type { CSSProperties } from 'react';
import { color } from '../../color.js';

/** Public asset path (under `public/`). */
export const DESK_FOAM_IMAGE = 'foam-splash.jpg';

export type DeskBackgroundBase =
  | { type: 'color'; value: string }
  | { type: 'gradient'; value: string };

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
  base: { type: 'color', value: color.surface.desk },
  foam: {
    blendMode: 'screen',
    hueRotateDeg: 0,
    saturatePercent: 100,
    brightnessPercent: 100,
    contrastPercent: 100,
    opacityPercent: 100,
  },
};

function getDeskFoamUrl() {
  return `${import.meta.env.BASE_URL}${DESK_FOAM_IMAGE}`;
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
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
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
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: foam.opacityPercent / 100,
    ...(filter && { filter }),
  };
}
