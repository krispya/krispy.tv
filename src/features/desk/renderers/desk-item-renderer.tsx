import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait } from 'koota/react';
import { useCallback, type CSSProperties, type KeyboardEvent } from 'react';
import { actions } from '../actions.js';
import { DeskItem, Dragging, Position, Ref, Velocity } from '../traits.js';
import type { DeskStageItem } from '../desk.js';
import { ArticleRenderer } from './article-renderer.js';

const deskItemStyle = {
  '--desk-item-width': 'clamp(220px, 32vw, 380px)',
  width: 'var(--desk-item-width)',
  aspectRatio: '8.5 / 11',
  marginLeft: 'calc(var(--desk-item-width) / -2)',
  marginTop: 'calc((var(--desk-item-width) * 11 / 8.5) / -2)',
} as CSSProperties;

type DeskItemRendererProps = {
  itemConfigById: Map<string, DeskStageItem>;
  onOpen?: (id: string) => void;
};

export function DeskItemRenderer({ itemConfigById, onOpen }: DeskItemRendererProps) {
  const entities = useQuery(DeskItem);

  return (
    <>
      {entities.map((entity) => (
        <DeskItemView
          key={entity.id()}
          entity={entity}
          itemConfig={itemConfigById.get(entity.get(DeskItem)?.id ?? '')}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}

function DeskItemView({
  entity,
  itemConfig,
  onOpen,
}: {
  entity: Entity;
  itemConfig?: DeskStageItem;
  onOpen?: (id: string) => void;
}) {
  const item = useTrait(entity, DeskItem);
  const isDragging = useHas(entity, Dragging);
  const { raiseDeskItem } = useActions(actions);
  const isOpenable = itemConfig?.openable ?? true;

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

      entity.set(Position, { x: centerX, y: centerY, z: 0 });
      entity.set(Velocity, { x: 0, y: 0 });
      entity.add(Dragging({ offset }));
      raiseDeskItem(entity);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [entity, raiseDeskItem]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      entity.remove(Dragging);
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [entity]
  );

  const handlePointerCancel = useCallback(() => {
    entity.remove(Dragging);
  }, [entity]);

  const handleLostPointerCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.buttons === 0) entity.remove(Dragging);
    },
    [entity]
  );

  const handleDoubleClick = useCallback(() => {
    if (item && isOpenable) onOpen?.(item.id);
  }, [isOpenable, item, onOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!item || !isOpenable || (event.key !== 'Enter' && event.key !== ' ')) return;

      event.preventDefault();
      onOpen?.(item.id);
    },
    [isOpenable, item, onOpen]
  );

  if (!item) return null;

  return (
    <div
      ref={handleInit}
      role={isOpenable ? 'button' : undefined}
      tabIndex={isOpenable ? 0 : undefined}
      aria-label={itemConfig?.ariaLabel ?? (isOpenable ? 'Open article' : 'Blank sheet')}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      className={`fixed top-0 left-0 flex cursor-grab touch-none flex-col overflow-hidden rounded-[3px] border border-stone-200 bg-[#fffdf7] p-6 text-left text-gray-950 shadow-[0_20px_45px_rgba(42,38,30,0.24)] outline-offset-4 will-change-transform select-none ${itemConfig?.className ?? ''} ${
        isDragging ? 'cursor-grabbing shadow-[0_28px_70px_rgba(42,38,30,0.34)]' : ''
      }`}
      style={{ ...deskItemStyle, ...itemConfig?.style }}
    >
      <ArticleRenderer entity={entity} />
    </div>
  );
}
