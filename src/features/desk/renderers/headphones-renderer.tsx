import type { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import type { CSSProperties } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { Headphones, Position, Ref, Rotation } from '../traits/index.js';
import { getHeadphonesFillSrc, getHeadphonesMaskStyle } from '../presentation/headphones-lines.js';
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
      <HeadphonesShadow />
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
        <HeadphonesLinesOverlay headphonesId={headphones.id} lineColor={headphones.lineColor} />
      </div>
    </div>
  );
}

function HeadphonesShadow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-stone-950 will-change-transform"
      style={{
        opacity: 'var(--shadow-opacity)',
        transform:
          'translate(var(--shadow-offset-x), var(--shadow-offset-y)) rotate(var(--headphones-rotate-z)) scale(var(--shadow-scale-x), var(--shadow-scale-y))',
        WebkitMaskImage: `url(${getHeadphonesFillSrc()})`,
        maskImage: `url(${getHeadphonesFillSrc()})`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    />
  );
}
