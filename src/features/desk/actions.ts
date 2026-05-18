import { createActions, type Entity } from 'koota';
import { createSeededLayout } from './utils/create-seeded-layout.js';
import { getDeskItemZIndex } from './utils/desk-item-z-index.js';
import { DeskItem, Position, Rotation, Scale, Velocity, Viewport, ZIndex } from './traits.js';

export type DeskItemConfig = {
  id: string;
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  rotation?: {
    x?: number;
    y?: number;
    z?: number;
  };
  zIndex?: number;
  centered?: boolean;
};

export const actions = createActions((world) => ({
  spawnDeskItem: (config: DeskItemConfig) => {
    let position = config.position;
    let rotationZ = config.rotation?.z;
    let zIndex = config.zIndex;

    if (position === undefined || rotationZ === undefined) {
      const viewport = world.get(Viewport);
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const itemWidth = Math.min(Math.max(viewportWidth * 0.32, 220), 380);
      const itemHeight = itemWidth * (11 / 8.5);

      const layout = createSeededLayout({
        id: config.id,
        centered: config.centered,
        viewportWidth,
        viewportHeight,
        itemWidth,
        itemHeight,
      });

      position ??= { x: layout.x, y: layout.y };
      rotationZ ??= layout.rotation;
    }

    zIndex ??= getDeskItemZIndex(config.id);

    return world.spawn(
      DeskItem({ id: config.id }),
      Position({ x: position.x, y: position.y, z: position.z ?? 0 }),
      Rotation({
        x: config.rotation?.x ?? 0,
        y: config.rotation?.y ?? 0,
        z: rotationZ ?? 0,
      }),
      Scale,
      Velocity,
      ZIndex({ value: zIndex ?? 0 })
    );
  },
  raiseDeskItem: (entity: Entity) => {
    let top = 0;

    world.query(ZIndex).forEach((item) => {
      top = Math.max(top, item.get(ZIndex)?.value ?? 0);
    });

    entity.set(ZIndex, { value: top + 1 });
  },
  resetDeskItems: () => {
    world.query(DeskItem).forEach((entity) => entity.destroy());
  },
}));
