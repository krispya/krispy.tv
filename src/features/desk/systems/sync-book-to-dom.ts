import type { World } from 'koota';
import { Book, Position, Ref, Rotation } from '../traits/index.js';
import { getHeightAbovePlaneM, toLift01 } from '../utils/height.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getBookDepthMeters } from '../utils/resting-height.js';
import { getBookShadowClip, getBookShadowSize } from '../utils/book-shadow.js';
import { getItemFocusProgress } from '../utils/item-focus.js';
import { lerp } from '../utils/math.js';

const FOCUSED_SHADOW_OPACITY_MULTIPLIER = 0;

export function syncBookToDOM(world: World) {
  world.query(Book, Position, Rotation, Ref).updateEach(([book, position, rotation, ref], entity) => {
    const focusProgress = getItemFocusProgress(entity);
    const heightM = getHeightAbovePlaneM(position.z);
    const lift = toLift01(heightM);
    const shadow = toShadowStyle(heightM);
    const depthPx = metersToCssPixels(getBookDepthMeters(book));
    // Rotation only matters while grounded; once lifted the shadow becomes a light-space
    // projection that scales out (no spin, no shear) like the paper shadow.
    const shadowRotationZ = rotation.z * Math.pow(1 - lift, 2);
    const size = getBookShadowSize(book.width, book.height, depthPx);
    const clip = getBookShadowClip(book.width, book.height, depthPx, shadowRotationZ, size);
    const shadowOpacity = lerp(
      shadow.opacity,
      shadow.opacity * FOCUSED_SHADOW_OPACITY_MULTIPLIER,
      focusProgress
    );

    ref.style.setProperty('--book-shadow-size', `${size}px`);
    ref.style.setProperty('--book-shadow-clip', clip);
    ref.style.setProperty(
      '--book-shadow-lift',
      `translate(${shadow.offsetX.toFixed(2)}px, ${shadow.offsetY.toFixed(2)}px) scale(${shadow.scaleX.toFixed(3)}, ${shadow.scaleY.toFixed(3)})`
    );
    ref.style.setProperty('--book-shadow-opacity', shadowOpacity.toFixed(3));
  });
}
