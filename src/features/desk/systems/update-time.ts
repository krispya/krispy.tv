import type { World } from 'koota';
import { Time } from '../traits/index.js';

export function updateTime(world: World) {
  const now = performance.now();
  const time = world.get(Time);
  const delta = time ? Math.min((now - time.last) / 1000, 0.1) : 0;

  world.set(Time, { last: now, delta });
}
