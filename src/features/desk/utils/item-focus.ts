import type { Entity } from 'koota';
import { IsFocused, ItemFocusMotion } from '../traits/index.js';
import { clamp01 } from './math.js';

export function getItemFocusProgress(entity: Entity) {
  const motion = entity.get(ItemFocusMotion);
  if (motion) return clamp01(motion.progress);

  return entity.has(IsFocused) ? 1 : 0;
}
