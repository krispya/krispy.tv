import type { World } from 'koota';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { toMeshLiftScale } from '../presentation/lift.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { setItemPerspectiveVars, toPerspectiveGrowthZPx } from '../presentation/item-perspective.js';
import {
  Dragging,
  IsOpen,
  Polaroid,
  PolaroidFocusMotion,
  Position,
  Ref,
  Rotation,
  StackIndex,
} from '../traits/index.js';
import { clamp01, lerp } from '../utils/math.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const DRAGGING_STACK_BOOST = 1000;
const FOCUSED_STACK_BOOST = 2000;
const FOCUSED_SCALE = 1.34;
const FOCUSED_SHADOW_OPACITY_MULTIPLIER = 0;

export function syncPolaroidToDOM(world: World) {
  world
    .query(Polaroid, Position, Rotation, Ref, StackIndex)
    .updateEach(([_polaroid, position, rotation, ref, stackIndex], entity) => {
      const focusMotion = entity.get(PolaroidFocusMotion);
      const focusProgress = entity.has(IsOpen) ? clamp01(focusMotion?.progress ?? 1) : 0;
      const cssZIndex = getPolaroidZIndex(
        stackIndex,
        entity.has(Dragging),
        entity.has(IsOpen) || !!focusMotion
      );
      const heightM = getHeightAbovePlaneM(position.z);
      const shadow = toShadowStyle(heightM);
      const liftScale = lerp(toMeshLiftScale(heightM), FOCUSED_SCALE, focusProgress);
      const shadowOpacity = lerp(
        shadow.opacity,
        shadow.opacity * FOCUSED_SHADOW_OPACITY_MULTIPLIER,
        focusProgress
      );

      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.zIndex = cssZIndex.toString();
      // Lift/focus growth comes from moving the item toward the per-item
      // perspective camera instead of a 2D scale, so item and shadow grow
      // consistently with the projection.
      ref.style.setProperty('--paper-z', `${toPerspectiveGrowthZPx(world, liftScale).toFixed(1)}px`);
      ref.style.setProperty('--paper-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--paper-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--paper-rotate-z', `${rotation.z}deg`);
      setItemPerspectiveVars(world, ref, position, rotation.z);
      ref.style.setProperty('--shadow-offset-x', `${shadow.offsetX}px`);
      ref.style.setProperty('--shadow-offset-y', `${shadow.offsetY}px`);
      ref.style.setProperty('--shadow-scale-x', shadow.scaleX.toString());
      ref.style.setProperty('--shadow-scale-y', shadow.scaleY.toString());
      ref.style.setProperty('--shadow-opacity', shadowOpacity.toString());
    });
}

function getPolaroidZIndex(stackIndex: { value: number }, isDragging: boolean, isFocused: boolean) {
  if (isFocused) return stackIndex.value + FOCUSED_STACK_BOOST;
  return isDragging ? stackIndex.value + DRAGGING_STACK_BOOST : stackIndex.value;
}
