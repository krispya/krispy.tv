import type { Entity } from 'koota';
import { WorldProvider, useActions, useQuery } from 'koota/react';
import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { actions } from '../../core/actions.js';
import { createDeskWorld } from '../../core/world.js';
import { DeskItem as DeskItemTrait } from '../../core/traits.js';
import { createSeededLayout } from '../../core/utils/create-seeded-layout.js';
import { Frameloop } from '../../frameloop.js';
import { Page } from './page.js';

export type DeskStageItem = {
  id: string;
  ariaLabel?: string;
  className?: string;
  openable?: boolean;
  style?: CSSProperties;
};

type DeskStageProps = {
  items: DeskStageItem[];
  renderItem: (id: string, entity: Entity) => ReactNode;
  onItemOpen?: (id: string) => void;
  className?: string;
};

export function DeskStage({ items, renderItem, onItemOpen, className = '' }: DeskStageProps) {
  const world = useMemo(() => createDeskWorld(), []);
  const itemConfigById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  return (
    <WorldProvider world={world}>
      <section className={`relative h-screen min-h-[560px] overflow-hidden ${className}`}>
        <Frameloop />
        <DeskItemSpawner items={items} />
        <DeskItemRenderer
          itemConfigById={itemConfigById}
          renderItem={renderItem}
          onItemOpen={onItemOpen}
        />
      </section>
    </WorldProvider>
  );
}

function DeskItemSpawner({ items }: { items: DeskStageItem[] }) {
  const { resetDeskItems, spawnDeskItem } = useActions(actions);
  const itemSignature = useMemo(() => items.map((item) => item.id).join('\u0000'), [items]);

  useEffect(() => {
    resetDeskItems();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const itemWidth = Math.min(Math.max(viewportWidth * 0.32, 220), 380);
    const itemHeight = itemWidth * (11 / 8.5);

    items.forEach((item, index) => {
      const layout = createSeededLayout({
        id: item.id,
        index,
        total: items.length,
        viewportWidth,
        viewportHeight,
        itemWidth,
        itemHeight,
      });

      spawnDeskItem({
        id: item.id,
        position: { x: layout.x, y: layout.y },
        rotation: { z: layout.rotation },
        zIndex: layout.zIndex,
      });
    });

    return () => resetDeskItems();
  }, [itemSignature, items, resetDeskItems, spawnDeskItem]);

  return null;
}

function DeskItemRenderer({
  itemConfigById,
  renderItem,
  onItemOpen,
}: {
  itemConfigById: Map<string, DeskStageItem>;
  renderItem: (id: string, entity: Entity) => ReactNode;
  onItemOpen?: (id: string) => void;
}) {
  const entities = useQuery(DeskItemTrait);

  return (
    <>
      {entities.map((entity) => (
        <Page
          key={entity.id()}
          entity={entity}
          itemConfig={itemConfigById.get(entity.get(DeskItemTrait)?.id ?? '')}
          onOpen={onItemOpen}
        >
          {renderItem}
        </Page>
      ))}
    </>
  );
}
