import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait } from 'koota/react';
import { useCallback, type CSSProperties } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { actions } from '../actions.js';
import { PolaroidGlossOverlay } from './polaroid-gloss-overlay.js';
import {
  AngularVelocity,
  Dragging,
  IsResting,
  Polaroid,
  Pressed,
  Position,
  Ref,
  Rotation,
  Selected,
  Velocity,
} from '../traits/index.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';
import { hashSeed, SketchOutline } from './sketch-outline.js';

const DRAG_THRESHOLD_PX = 5;
const FRAME_PADDING_PX = 12;
type PolaroidStyle = CSSProperties & Record<`--${string}`, string>;

const POLAROID_INITIAL_STYLE = {
  '--paper-z': '0px',
  '--paper-rotate-x': '0deg',
  '--paper-rotate-y': '0deg',
  '--paper-rotate-z': '0deg',
  '--paper-lift-scale': '1',
  '--shadow-offset-x': '2px',
  '--shadow-offset-y': '3px',
  '--shadow-blur': '1px',
  '--shadow-scale-x': '1',
  '--shadow-scale-y': '1',
  '--shadow-opacity': '0.2',
} satisfies PolaroidStyle;

export function PolaroidRenderer() {
  const entities = useQuery(Polaroid, Position, Rotation);
  return entities.map((entity) => <PolaroidView key={entity.id()} entity={entity} />);
}

function PolaroidView({ entity }: { entity: Entity }) {
  const polaroid = useTrait(entity, Polaroid);
  const isDragging = useHas(entity, Dragging);
  const isSelected = useHas(entity, Selected);
  const { raiseDeskItem } = useActions(actions);

  const { enabled: isDebug } = useDebug();

  const handleInit = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;

      entity.add(Ref(element));

      return () => entity.remove(Ref);
    },
    [entity]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };
      const offset = {
        x: cssPixelsToMeters(event.clientX) - position.x,
        y: cssPixelsToMeters(event.clientY) - position.y,
      };
      const rotation = entity.get(Rotation) ?? { x: 0, y: 0, z: 0 };

      entity.remove(Dragging, IsResting);
      entity.set(Velocity, { x: 0, y: 0, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
      entity.add(
        Pressed({
          pointerId: event.pointerId,
          origin: { x: event.clientX, y: event.clientY },
          offset,
          rotation: {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
          },
        })
      );
      entity.add(Selected);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [entity]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pressed = entity.get(Pressed);

      if (!pressed || pressed.pointerId !== event.pointerId) return;

      const dx = event.clientX - pressed.origin.x;
      const dy = event.clientY - pressed.origin.y;
      const distance = Math.hypot(dx, dy);

      if (distance < DRAG_THRESHOLD_PX) return;

      const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };

      entity.set(Position, { x: position.x, y: position.y, z: 0 });
      entity.set(Velocity, { x: 0, y: 0, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
      entity.remove(Pressed, IsResting);
      entity.remove(Selected);
      raiseDeskItem(entity);
      entity.add(
        Dragging({
          offset: pressed.offset,
          rotation: pressed.rotation,
          liftProgress: 0,
        })
      );
    },
    [entity, raiseDeskItem]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pressed = entity.get(Pressed);
      const dragging = entity.get(Dragging);

      if (pressed && pressed.pointerId === event.pointerId) {
        entity.remove(Pressed);
        entity.remove(Selected);
      }

      if (dragging) {
        entity.remove(Dragging);
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [entity]
  );

  const handlePointerCancel = useCallback(() => {
    entity.remove(Pressed);
    entity.remove(Selected);
    entity.remove(Dragging);
  }, [entity]);

  const handleLostPointerCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.buttons === 0) {
        entity.remove(Pressed);
        entity.remove(Selected);
        entity.remove(Dragging);
      }
    },
    [entity]
  );

  if (!polaroid) return null;

  const imageSize = polaroid.width - FRAME_PADDING_PX * 2;

  return (
    <div
      ref={handleInit}
      className="absolute top-0 left-0 isolate will-change-transform [transform-style:preserve-3d]"
      style={{
        ...POLAROID_INITIAL_STYLE,
        width: polaroid.width,
        height: polaroid.height,
        marginLeft: polaroid.width / -2,
        marginTop: polaroid.height / -2,
      }}
    >
      {isDebug && <BoundingBoxDebug entity={entity} />}
      <PolaroidShadow />
      <div
        aria-label="Photo"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onDragStart={(event) => event.preventDefault()}
        className={`absolute inset-0 cursor-grab touch-none rounded-[3px] select-none [-webkit-user-drag:none] ${
          isDragging ? 'cursor-grabbing' : ''
        } ${isSelected || isDragging ? 'outline-3 outline-offset-2 outline-blue-500' : ''}`}
        style={{
          transform:
            'translateZ(var(--paper-z)) rotateX(var(--paper-rotate-x)) rotateY(var(--paper-rotate-y)) rotateZ(var(--paper-rotate-z)) scale(var(--paper-lift-scale))',
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3px] bg-[#f8f6f0] p-3 shadow-inner">
          <PolaroidPhoto id={polaroid.id} imageSrc={polaroid.imageSrc} imageSize={imageSize} />
          {polaroid.caption ? (
            <p className="mt-2 text-center text-sm text-stone-700">{polaroid.caption}</p>
          ) : null}
        </div>
        <SketchOutline width={polaroid.width} height={polaroid.height} seed={hashSeed(polaroid.id)} />
      </div>
    </div>
  );
}

function PolaroidPhoto({
  id,
  imageSrc,
  imageSize,
}: {
  id: string;
  imageSrc: string;
  imageSize: number;
}) {
  return (
    <div
      className="relative isolate shrink-0 overflow-hidden"
      style={{ width: imageSize, height: imageSize }}
    >
      <img src={imageSrc} alt="" draggable={false} className="h-full w-full object-cover" />
      <PolaroidGlossOverlay id={id} size={imageSize} />
      <SketchOutline width={imageSize} height={imageSize} seed={hashSeed(`${id}:image`)} />
    </div>
  );
}

function PolaroidShadow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[3px] bg-stone-950 will-change-transform"
      style={{
        opacity: 'var(--shadow-opacity)',
        filter: 'blur(var(--shadow-blur))',
        transform:
          'translate(var(--shadow-offset-x), var(--shadow-offset-y)) rotate(var(--paper-rotate-z)) scale(var(--shadow-scale-x), var(--shadow-scale-y))',
      }}
    />
  );
}
