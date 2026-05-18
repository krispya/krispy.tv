import { createActions, type Entity } from 'koota';
import { createSeededLayout } from './utils/create-seeded-layout.js';
import { getDeskItemStackIndex } from './utils/desk-item-stack-index.js';
import { DeskItem, Position, Rotation, Scale, StackIndex, Velocity, Viewport } from './traits.js';

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
  stackIndex?: number;
  centered?: boolean;
};

export const actions = createActions((world) => ({
  spawnDeskItem: (config: DeskItemConfig) => {
    let position = config.position;
    let rotationZ = config.rotation?.z;
    let stackIndex = config.stackIndex;

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

    stackIndex ??= getDeskItemStackIndex(config.id);

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
      StackIndex({ value: stackIndex ?? 0 })
    );
  },
  raiseDeskItem: (entity: Entity) => {
    let top = 0;

    world.query(StackIndex).forEach((item) => {
      top = Math.max(top, item.get(StackIndex)?.value ?? 0);
    });

    entity.set(StackIndex, { value: top + 1 });
  },
  resetDeskItems: () => {
    world.query(DeskItem).forEach((entity) => entity.destroy());
  },
}));
