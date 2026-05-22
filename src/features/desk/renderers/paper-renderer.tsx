import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait } from 'koota/react';
import { useCallback, type CSSProperties } from 'react';
import { useLocation } from 'wouter';
import { routes } from '../../../routes.js';
import { actions } from '../actions.js';
import { PAPER_SIZE } from '../utils/paper-size.js';
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

const paperStyle = {
  '--paper-width': `clamp(${PAPER_SIZE.minWidth}px, ${PAPER_SIZE.viewportScale * 100}vw, ${PAPER_SIZE.maxWidth}px)`,
  width: 'var(--paper-width)',
  aspectRatio: `${PAPER_SIZE.aspectRatio * 11} / 11`,
  marginLeft: 'calc(var(--paper-width) / -2)',
  marginTop: `calc(var(--paper-width) / ${PAPER_SIZE.aspectRatio} / -2)`,
} as CSSProperties;

const DRAG_THRESHOLD_PX = 5;

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
      role={isOpenable ? 'button' : undefined}
      tabIndex={isOpenable ? 0 : undefined}
      aria-label={isOpenable ? 'Open article' : 'Blank sheet'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      className={`fixed top-0 left-0 flex cursor-grab touch-none flex-col overflow-hidden rounded-[3px] border border-stone-200 p-6 text-left text-gray-950 will-change-transform select-none ${
        isDragging ? 'cursor-grabbing' : ''
      } ${isSelected || isDragging ? 'outline-3 outline-offset-2 outline-blue-500' : ''}`}
      style={{
        ...paperStyle,
        backgroundColor: paper.color,
        ...(paper.openable && {
          backgroundImage: `url(${import.meta.env.BASE_URL}images/articles/${paper.id}.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
        }),
      }}
    ></div>
  );
}
