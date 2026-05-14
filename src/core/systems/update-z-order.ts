import type { World } from 'koota';
import { DeskItem, ZIndex } from '../traits.js';

export function updateZOrder(world: World) {
  world.query(DeskItem, ZIndex).updateEach(([_item, zIndex]) => {
    if (!Number.isFinite(zIndex.value)) {
      zIndex.value = 0;
    }
  });
}
