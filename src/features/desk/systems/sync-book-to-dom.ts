import type { World } from 'koota';
import { Book, Dragging, Position, Ref, Rotation, StackIndex } from '../traits/index.js';
import { clamp } from '../utils/math.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getBookDepthMeters, getRestingHeight } from '../utils/resting-height.js';
import { getBookShadowClip, getBookShadowSize } from '../utils/book-shadow.js';

const DRAGGING_STACK_BOOST = 1000;
// Matches the paper shadow (sync-paper-to-dom.ts) so books and papers share one shadow language.
const MAX_SHADOW_LIFT = 96;
const SHADOW_REST_OFFSET_X = 2;
const SHADOW_REST_OFFSET_Y = 3;
const SHADOW_LIFT_OFFSET_X = 32;
const SHADOW_LIFT_OFFSET_Y = 40;
const SHADOW_REST_BLUR = 1;
const SHADOW_LIFT_BLUR = 2;
const SHADOW_LIFT_SCALE_X = 0.07;
const SHADOW_LIFT_SCALE_Y = 0.045;

export function syncBookToDOM(world: World) {
  world
    .query(Book, Position, Rotation, Ref, StackIndex)
    .updateEach(([book, position, rotation, ref, stackIndex], entity) => {
      const cssZIndex = getBookZIndex(stackIndex, entity.has(Dragging));

      ref.style.transform = `translate(${position.x}px, ${position.y}px)`;
      ref.style.zIndex = cssZIndex.toString();
      ref.style.setProperty('--book-z', `${position.z}px`);
      ref.style.setProperty('--book-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--book-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--book-rotate-z', `${rotation.z}deg`);

      const supportZ = getRestingHeight(entity);
      const liftPx = Math.max(0, position.z - supportZ);
      const lift = clamp(liftPx / MAX_SHADOW_LIFT, 0, 1);
      const depthPx = metersToCssPixels(getBookDepthMeters(book));
      // Rotation only matters while grounded; once lifted the shadow becomes a light-space
      // projection that scales out (no spin, no shear) like the paper shadow.
      const shadowRotationZ = rotation.z * Math.pow(1 - lift, 2);
      const size = getBookShadowSize(book.width, book.height, depthPx);
      const clip = getBookShadowClip(book.width, book.height, depthPx, shadowRotationZ, size);

      // Same lift response as the paper shadow: offset down-right, gentle scale, soften, darken.
      const offsetX = SHADOW_REST_OFFSET_X + lift * SHADOW_LIFT_OFFSET_X;
      const offsetY = SHADOW_REST_OFFSET_Y + lift * SHADOW_LIFT_OFFSET_Y;
      const scaleX = 1 + lift * SHADOW_LIFT_SCALE_X;
      const scaleY = 1 + lift * SHADOW_LIFT_SCALE_Y;
      const blur = SHADOW_REST_BLUR + lift * SHADOW_LIFT_BLUR;
      const opacity = 0.4 + lift * 0.1;

      ref.style.setProperty('--book-shadow-size', `${size}px`);
      ref.style.setProperty('--book-shadow-clip', clip);
      ref.style.setProperty(
        '--book-shadow-lift',
        `translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`
      );
      ref.style.setProperty('--book-shadow-blur', `${blur}px`);
      ref.style.setProperty('--book-shadow-opacity', opacity.toFixed(3));
    });
}

function getBookZIndex(stackIndex: { value: number }, isDragging: boolean) {
  return isDragging ? stackIndex.value + DRAGGING_STACK_BOOST : stackIndex.value;
}
