import type { World } from 'koota';
import { Book, FoldedPaperMotion, Position, Ref, Rotation } from '../traits/index.js';
import {
  FOLDED_PAPER_FOLD_X_VAR,
  FOLDED_PAPER_FOLD_Y_VAR,
  FOLDED_PAPER_DRIFT_VAR,
  FOLDED_PAPER_RISE_VAR,
  FOLDED_PAPER_SLIDE_VAR,
  getFoldedPaperPose,
} from '../presentation/folded-paper.js';
import { getHeightAbovePlaneM, toLift01 } from '../utils/height.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getBookDepthMeters } from '../utils/resting-height.js';
import { getBookShadowClip, getBookShadowSize } from '../utils/book-shadow.js';
import { getItemFocusProgress } from '../utils/item-focus.js';
import { lerp } from '../utils/math.js';
import { SCREEN_FACING_BOOK_ROTATION } from '../presentation/book.js';

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

    if (!book.hasFoldedPaper) return;

    const pose = getFoldedPaperPose(entity.get(FoldedPaperMotion)?.progress ?? 0);
    ref.style.setProperty(FOLDED_PAPER_SLIDE_VAR, pose.slide.toFixed(4));
    ref.style.setProperty(FOLDED_PAPER_RISE_VAR, pose.rise.toFixed(4));
    ref.style.setProperty(FOLDED_PAPER_DRIFT_VAR, pose.drift.toFixed(4));
    ref.style.setProperty(FOLDED_PAPER_FOLD_X_VAR, `${pose.foldX.toFixed(2)}deg`);
    ref.style.setProperty(FOLDED_PAPER_FOLD_Y_VAR, `${pose.foldY.toFixed(2)}deg`);

    if (pose.rise <= 0) return;

    // As the letter rises, square the whole book up to the screen (overriding
    // the generic item vars set just before) so the sheet reads flat and
    // head-on instead of in the desk's oblique projection.
    ref.style.setProperty(
      '--item-rotate-x',
      `${lerp(rotation.x, SCREEN_FACING_BOOK_ROTATION.x, pose.rise).toFixed(3)}deg`
    );
    ref.style.setProperty(
      '--item-rotate-y',
      `${lerp(rotation.y, SCREEN_FACING_BOOK_ROTATION.y, pose.rise).toFixed(3)}deg`
    );
    ref.style.setProperty(
      '--item-rotate-z',
      `${lerp(rotation.z, SCREEN_FACING_BOOK_ROTATION.z, pose.rise).toFixed(3)}deg`
    );
    for (const property of ['--item-persp-x', '--item-persp-y']) {
      const current = Number.parseFloat(ref.style.getPropertyValue(property)) || 0;
      ref.style.setProperty(property, `${lerp(current, 0, pose.rise).toFixed(1)}px`);
    }
  });
}
