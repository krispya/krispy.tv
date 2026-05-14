import { createActions, type Entity } from 'koota';
import { DeskItem, Position, Rotation, Scale, Velocity, ZIndex } from './traits.js';

export type DeskItemConfig = {
  id: string;
  position: {
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
};

export const actions = createActions((world) => ({
  spawnDeskItem: (config: DeskItemConfig) => {
    return world.spawn(
      DeskItem({ id: config.id }),
      Position({ x: config.position.x, y: config.position.y, z: config.position.z ?? 0 }),
      Rotation({
        x: config.rotation?.x ?? 0,
        y: config.rotation?.y ?? 0,
        z: config.rotation?.z ?? 0,
      }),
      Scale,
      Velocity,
      ZIndex({ value: config.zIndex ?? 0 })
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
