import type { World } from 'koota';
import { IsOffScreen, IsOpen, Position, Ref, Viewport } from '../traits/index.js';

/**
 * Marks an open paper as off-screen once it has fully exited through the bottom of the viewport.
 *
 * Assumes the paper is represented by its center `Position`, and that its DOM `Ref` has a measured
 * height. The `IsOffScreen` tag is intentionally sticky; another system removes it when the paper is
 * closed and thrown back onto the desk.
 */
export function detectOffScreen(world: World) {
  const viewport = world.get(Viewport);
  if (!viewport || viewport.height <= 0) return;

  world.query(IsOpen, Position, Ref).readEach(([position, ref], entity) => {
    if (entity.has(IsOffScreen)) return;

    const height = ref.offsetHeight;
    if (position.y - height / 2 > viewport.height) {
      entity.add(IsOffScreen);
    }
  });
}
