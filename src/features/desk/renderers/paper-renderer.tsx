import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait } from 'koota/react';
import { useCallback, type CSSProperties } from 'react';
import { useLocation } from 'wouter';
import { routes } from '../../../routes.js';
import { actions } from '../actions.js';
import {
  AngularVelocity,
  Dragging,
  Paper,
  Pressed,
  Position,
  Ref,
  Rotation,
  Selected,
  Velocity,
} from '../traits/index.js';

const DRAG_THRESHOLD_PX = 5;
type PaperStyle = CSSProperties & Record<`--${string}`, string>;

const PAPER_INITIAL_STYLE = {
  '--paper-z': '0px',
  '--paper-rotate-x': '0deg',
  '--paper-rotate-y': '0deg',
  '--paper-rotate-z': '0deg',
  '--shadow-offset-x': '2px',
  '--shadow-offset-y': '3px',
  '--shadow-blur': '1px',
  '--shadow-scale-x': '1',
  '--shadow-scale-y': '1',
  '--shadow-opacity': '0.2',
} satisfies PaperStyle;
const PAPER_TEXTURE_OVERLAYS = [
  'linear-gradient(17deg, rgba(49, 35, 18, 0.024), rgba(49, 35, 18, 0.04))',
  'linear-gradient(133deg, rgba(75, 57, 26, 0.032), rgba(75, 57, 26, 0.048))',
  'linear-gradient(251deg, rgba(34, 52, 65, 0.026), rgba(34, 52, 65, 0.04))',
  'linear-gradient(68deg, rgba(56, 67, 38, 0.022), rgba(56, 67, 38, 0.038))',
  'linear-gradient(309deg, rgba(83, 45, 49, 0.02), rgba(83, 45, 49, 0.036))',
];

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function getPaperTextureOverlay(id: string): string {
  return PAPER_TEXTURE_OVERLAYS[hashString(id) % PAPER_TEXTURE_OVERLAYS.length];
}

export function PaperRenderer() {
  const entities = useQuery(Paper, Position, Rotation);
  return entities.map((entity) => <PaperView key={entity.id()} entity={entity} />);
}

function PaperView({ entity }: { entity: Entity }) {
  const paper = useTrait(entity, Paper);
  const isDragging = useHas(entity, Dragging);
  const isSelected = useHas(entity, Selected);
  const { raisePaper } = useActions(actions);
  const [, navigate] = useLocation();

  const isOpenable = paper?.openable ?? true;

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

      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offset = {
        x: event.clientX - centerX,
        y: event.clientY - centerY,
      };
      const rotation = entity.get(Rotation) ?? { x: 0, y: 0, z: 0 };

      entity.remove(Dragging);
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

      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      entity.set(Position, { x: centerX, y: centerY, z: 0 });
      entity.set(Velocity, { x: 0, y: 0, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
      entity.remove(Pressed);
      entity.remove(Selected);
      raisePaper(entity);
      entity.add(
        Dragging({
          offset: pressed.offset,
          rotation: pressed.rotation,
          liftProgress: 0,
        })
      );
    },
    [entity, raisePaper]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pressed = entity.get(Pressed);
      const dragging = entity.get(Dragging);

      if (pressed && pressed.pointerId === event.pointerId) {
        entity.remove(Pressed);
        entity.remove(Selected);

        if (paper?.openable) {
          navigate(routes.article.href({ slug: paper.id }));
        }
      }

      if (dragging) {
        entity.remove(Dragging);
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [entity, navigate, paper]
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

  if (!paper) return null;

  return (
    <div
      ref={handleInit}
      className="fixed top-0 left-0 isolate will-change-transform"
      style={{
        ...PAPER_INITIAL_STYLE,
        width: paper.width,
        height: paper.height,
        marginLeft: paper.width / -2,
        marginTop: paper.height / -2,
      }}
    >
      <PaperShadow />
      <div
        role={isOpenable ? 'button' : undefined}
        tabIndex={isOpenable ? 0 : undefined}
        aria-label={isOpenable ? 'Open article' : 'Blank sheet'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        className={`absolute inset-0 flex cursor-grab touch-none flex-col overflow-hidden rounded-[3px] border border-stone-200 p-6 text-left text-gray-950 will-change-transform select-none ${
          isDragging ? 'cursor-grabbing' : ''
        } ${isSelected || isDragging ? 'outline-3 outline-offset-2 outline-blue-500' : ''}`}
        style={{
          transform:
            'perspective(1200px) translateZ(var(--paper-z)) rotateX(var(--paper-rotate-x)) rotateY(var(--paper-rotate-y)) rotateZ(var(--paper-rotate-z))',
          backgroundColor: paper.color,
          ...(paper.openable && {
            backgroundImage: `${getPaperTextureOverlay(paper.id)}, url(${import.meta.env.BASE_URL}images/articles/${paper.id}.png)`,
            backgroundBlendMode: 'multiply, normal',
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, top center',
            backgroundRepeat: 'no-repeat, no-repeat',
          }),
        }}
      ></div>
    </div>
  );
}

function PaperShadow() {
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
