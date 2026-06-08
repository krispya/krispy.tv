import type { World } from 'koota';
import { IsOffScreen, IsOpen, Position, Ref } from '../traits/index.js';
import { getVisibleDeskRectForWorld } from '../utils/camera.js';
import { metersToCssPixels } from '../utils/physics-units.js';

/**
 * Marks an open paper as off-screen once it has fully exited through the bottom of the visible desk.
 *
 * Assumes the paper is represented by its center `Position`, and that its DOM `Ref` has a measured
 * height. The `IsOffScreen` tag is intentionally sticky; another system removes it when the paper is
 * closed and thrown back onto the desk.
 */
export function detectPastVisibleDesk(world: World) {
  const visibleRect = getVisibleDeskRectForWorld(world);
  if (visibleRect.height <= 0) return;

  world.query(IsOpen, Position, Ref).readEach(([position, ref], entity) => {
    if (entity.has(IsOffScreen)) return;

    const height = ref.offsetHeight;
    if (metersToCssPixels(position.y) - height / 2 > visibleRect.bottom) {
      entity.add(IsOffScreen);
    }
  });
}
