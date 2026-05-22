import type { World } from 'koota';
import { ActiveSlug, IsOpen, Paper } from '../traits/index.js';

export function syncOpenState(world: World) {
  const route = world.get(ActiveSlug);
  if (!route) return;

  const { slug } = route;

  world.query(Paper).readEach(([paper], entity) => {
    if (slug && paper.id === slug) {
      if (entity.has(IsOpen)) return;
      entity.add(IsOpen);
    } else {
      if (!entity.has(IsOpen)) return;
      entity.remove(IsOpen);
    }
  });
}
