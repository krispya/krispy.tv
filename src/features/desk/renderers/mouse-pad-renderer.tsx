import type { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import type { CSSProperties } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import {
  getMousePadFillStyle,
  getMousePadLineColor,
  getMousePadStitchColor,
  MOUSE_PAD_EDGE_LINE_OPTIONS,
  MOUSE_PAD_STITCH_INSET_PX,
  MOUSE_PAD_STITCH_LINE_OPTIONS,
} from '../presentation/mouse-pad.js';
import {
  getShadowBoilFrameStyle,
  getShadowBoilPhaseOffset,
  SHADOW_BOIL_FRAME_COUNT,
} from '../presentation/shadow.js';
import { MousePad, Position, Ref, Rotation } from '../traits/index.js';
import { hashSeed, SketchOutline } from './sketch-outline.js';

type MousePadStyle = CSSProperties & Record<`--${string}`, string>;

const MOUSE_PAD_INITIAL_STYLE = {
  '--item-rotate-z': '0deg',
  '--shadow-offset-x': '2px',
  '--shadow-offset-y': '3px',
  '--shadow-opacity': '0.2',
} satisfies MousePadStyle;

export function MousePadRenderer() {
  const entities = useQuery(MousePad, Position, Rotation);
  return entities.map((entity) => <MousePadView key={entity.id()} entity={entity} />);
}

function MousePadView({ entity }: { entity: Entity }) {
  const mousePad = useTrait(entity, MousePad);
  const { enabled: isDebug } = useDebug();

  function handleInit(element: HTMLDivElement | null) {
    if (!element) {
      entity.remove(Ref);
      return;
    }

    entity.add(Ref(element));
  }

  if (!mousePad) return null;

  const seed = hashSeed(mousePad.id);
  const stitchInset = MOUSE_PAD_STITCH_INSET_PX;
  const stitchRadius = Math.max(0, mousePad.cornerRadius - stitchInset);

  return (
    <div
      ref={handleInit}
      aria-hidden="true"
      // z-0 with DOM order right after the desk surface keeps it under every
      // stacked item (whose z-index starts at 0) while still above the wood.
      className="pointer-events-none absolute top-0 left-0 z-0 touch-none will-change-transform select-none"
      style={{
        ...MOUSE_PAD_INITIAL_STYLE,
        width: mousePad.width,
        height: mousePad.height,
        marginLeft: mousePad.width / -2,
        marginTop: mousePad.height / -2,
      }}
    >
      {isDebug && <BoundingBoxDebug entity={entity} />}
      <MousePadShadow mousePadId={mousePad.id} cornerRadius={mousePad.cornerRadius} />
      <div className="absolute inset-0" style={{ transform: 'rotate(var(--item-rotate-z))' }}>
        <div
          className="absolute inset-0"
          style={getMousePadFillStyle(mousePad.fillColor, mousePad.cornerRadius)}
        />
        <SketchOutline
          width={mousePad.width}
          height={mousePad.height}
          radius={mousePad.cornerRadius}
          seed={seed}
          options={{
            ...MOUSE_PAD_EDGE_LINE_OPTIONS,
            stroke: getMousePadLineColor(mousePad.fillColor),
          }}
        />
        <div className="absolute" style={{ inset: stitchInset }}>
          <SketchOutline
            width={mousePad.width - stitchInset * 2}
            height={mousePad.height - stitchInset * 2}
            radius={stitchRadius}
            seed={seed + 7}
            options={{
              ...MOUSE_PAD_STITCH_LINE_OPTIONS,
              stroke: getMousePadStitchColor(mousePad.fillColor),
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MousePadShadow({ mousePadId, cornerRadius }: { mousePadId: string; cornerRadius: number }) {
  const phaseOffset = getShadowBoilPhaseOffset(mousePadId);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 will-change-transform"
      style={
        {
          '--boil-phase': `${phaseOffset}s`,
          opacity: 'var(--shadow-opacity)',
          transform:
            'translate(var(--shadow-offset-x), var(--shadow-offset-y)) rotate(var(--item-rotate-z))',
        } as CSSProperties
      }
    >
      {Array.from({ length: SHADOW_BOIL_FRAME_COUNT }, (_, frameIndex) => (
        <div
          key={frameIndex}
          className={`shadow-boil-frame shadow-boil-frame--${frameIndex} absolute inset-0 bg-stone-950`}
          style={{ ...getShadowBoilFrameStyle(frameIndex, false), borderRadius: cornerRadius }}
        />
      ))}
    </div>
  );
}
