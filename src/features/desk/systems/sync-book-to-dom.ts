import type { World } from 'koota';
import { Book, Dragging, Position, Ref, Rotation, StackIndex } from '../traits/index.js';
import { getHeightAbovePlaneM, toLift01 } from '../utils/height.js';
import { toMeshLiftScale, toTranslateZPx } from '../presentation/lift.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getBookDepthMeters } from '../utils/resting-height.js';
import { getBookShadowClip, getBookShadowSize } from '../utils/book-shadow.js';

const DRAGGING_STACK_BOOST = 1000;

export function syncBookToDOM(world: World) {
  world
    .query(Book, Position, Rotation, Ref, StackIndex)
    .updateEach(([book, position, rotation, ref, stackIndex], entity) => {
      const cssZIndex = getBookZIndex(stackIndex, entity.has(Dragging));
      const heightM = getHeightAbovePlaneM(position.z);
      const lift = toLift01(heightM);
      const shadow = toShadowStyle(heightM);
      const depthPx = metersToCssPixels(getBookDepthMeters(book));
      // Rotation only matters while grounded; once lifted the shadow becomes a light-space
      // projection that scales out (no spin, no shear) like the paper shadow.
      const shadowRotationZ = rotation.z * Math.pow(1 - lift, 2);
      const size = getBookShadowSize(book.width, book.height, depthPx);
      const clip = getBookShadowClip(book.width, book.height, depthPx, shadowRotationZ, size);

      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.zIndex = cssZIndex.toString();
      ref.style.setProperty('--book-z', `${toTranslateZPx(heightM, entity)}px`);
      ref.style.setProperty('--book-lift-scale', toMeshLiftScale(heightM).toString());
      ref.style.setProperty('--book-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--book-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--book-rotate-z', `${rotation.z}deg`);
      ref.style.setProperty('--book-shadow-size', `${size}px`);
      ref.style.setProperty('--book-shadow-clip', clip);
      ref.style.setProperty(
        '--book-shadow-lift',
        `translate(${shadow.offsetX.toFixed(2)}px, ${shadow.offsetY.toFixed(2)}px) scale(${shadow.scaleX.toFixed(3)}, ${shadow.scaleY.toFixed(3)})`
      );
      ref.style.setProperty('--book-shadow-opacity', shadow.opacity.toFixed(3));
    });
}

function getBookZIndex(stackIndex: { value: number }, isDragging: boolean) {
  return isDragging ? stackIndex.value + DRAGGING_STACK_BOOST : stackIndex.value;
}
