import type { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import type { CSSProperties } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { Headphones, Position, Ref, Rotation } from '../traits/index.js';
import {
  getHeadphonesFillSrc,
  getHeadphonesFillToneColor,
  getHeadphonesFillToneSrc,
  getHeadphonesMaskStyle,
  HEADPHONES_FILL_TONES,
} from '../presentation/headphones-lines.js';
import {
  getShadowBoilFrameStyle,
  getShadowBoilPhaseOffset,
  SHADOW_BOIL_FRAME_COUNT,
} from '../presentation/shadow.js';
import { HeadphonesLinesOverlay } from './headphones-lines-overlay.js';

type HeadphonesStyle = CSSProperties & Record<`--${string}`, string>;

const HEADPHONES_INITIAL_STYLE = {
  '--headphones-z': '0px',
  '--headphones-rotate-z': '0deg',
  '--shadow-offset-x': '2px',
  '--shadow-offset-y': '3px',
  '--shadow-scale-x': '1',
  '--shadow-scale-y': '1',
  '--shadow-opacity': '0.2',
} satisfies HeadphonesStyle;

export function HeadphonesRenderer() {
  const entities = useQuery(Headphones, Position, Rotation);
  return entities.map((entity) => <HeadphonesView key={entity.id()} entity={entity} />);
}

function HeadphonesView({ entity }: { entity: Entity }) {
  const headphones = useTrait(entity, Headphones);
  const { enabled: isDebug } = useDebug();

  function handleInit(element: HTMLDivElement | null) {
    if (!element) {
      entity.remove(Ref);
      return;
    }

    entity.add(Ref(element));
  }

  if (!headphones) return null;

  return (
    <div
      ref={handleInit}
      className="absolute top-0 left-0 isolate touch-none will-change-transform select-none [transform-style:preserve-3d]"
      style={{
        ...HEADPHONES_INITIAL_STYLE,
        width: headphones.width,
        height: headphones.height,
        marginLeft: headphones.width / -2,
        marginTop: headphones.height / -2,
      }}
    >
      {isDebug && <BoundingBoxDebug entity={entity} />}
      <HeadphonesShadow headphonesId={headphones.id} />
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-visible"
        style={{
          transform: 'translateZ(var(--headphones-z)) rotateZ(var(--headphones-rotate-z))',
        }}
      >
        <div
          className="pointer-events-none absolute"
          style={getHeadphonesMaskStyle(getHeadphonesFillSrc(), headphones.fillColor)}
        />
        {HEADPHONES_FILL_TONES.map((tone) => (
          <div
            key={tone.name}
            className="pointer-events-none absolute"
            style={getHeadphonesMaskStyle(
              getHeadphonesFillToneSrc(tone.name),
              getHeadphonesFillToneColor(headphones.fillColor, tone.name)
            )}
          />
        ))}
        <HeadphonesLinesOverlay headphonesId={headphones.id} lineColor={headphones.lineColor} />
      </div>
    </div>
  );
}

function HeadphonesShadow({ headphonesId }: { headphonesId: string }) {
  const phaseOffset = getShadowBoilPhaseOffset(headphonesId);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[58%] left-[56%] aspect-square w-[72%] will-change-transform"
      style={
        {
          '--boil-phase': `${phaseOffset}s`,
          opacity: 'var(--shadow-opacity)',
          transform:
            'translate(-50%, -50%) translate(var(--shadow-offset-x), var(--shadow-offset-y)) scale(var(--shadow-scale-x), var(--shadow-scale-y))',
        } as CSSProperties
      }
    >
      {Array.from({ length: SHADOW_BOIL_FRAME_COUNT }, (_, frameIndex) => (
        <div
          key={frameIndex}
          className={`shadow-boil-frame shadow-boil-frame--${frameIndex} absolute inset-0 rounded-full bg-stone-950`}
          style={getShadowBoilFrameStyle(frameIndex, false)}
        />
      ))}
    </div>
  );
}
