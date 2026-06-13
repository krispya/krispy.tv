import type { World } from 'koota';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { toMeshLiftScale, toTranslateZPx } from '../presentation/lift.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { setItemPerspectiveVars } from '../presentation/item-perspective.js';
import { POLAROID_FOCUSED_SCALE } from '../presentation/polaroid-focus.js';
import {
  Desk,
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
import { isThresholdItem } from '../utils/stack-order.js';

const DRAGGING_STACK_BOOST = 1000;
const FOCUSED_STACK_BOOST = 2000;
const FOCUSED_SHADOW_OPACITY_MULTIPLIER = 0;

export function syncPolaroidToDOM(world: World) {
  const restackThreshold = world.queryFirst(Desk)?.get(Desk)?.restackThreshold ?? 0;

  world
    .query(Polaroid, Position, Rotation, Ref, StackIndex)
    .updateEach(([_polaroid, position, rotation, ref, stackIndex], entity) => {
      const focusMotion = entity.get(PolaroidFocusMotion);
      const focusProgress = focusMotion ? clamp01(focusMotion.progress) : entity.has(IsOpen) ? 1 : 0;
      // Once a closing polaroid descends past the restack threshold it has
      // been resorted into the desk plane, so drop the focus z boost and let
      // it render at its stack position while it settles.
      const isTuckedIntoDeskPlane =
        focusMotion?.phase === 'closing' && isThresholdItem(entity, restackThreshold);
      const cssZIndex = getPolaroidZIndex(
        stackIndex,
        entity.has(Dragging),
        (entity.has(IsOpen) || !!focusMotion) && !isTuckedIntoDeskPlane
      );
      const heightM = getHeightAbovePlaneM(position.z);
      const shadow = toShadowStyle(heightM);
      const liftScale = lerp(toMeshLiftScale(heightM), POLAROID_FOCUSED_SCALE, focusProgress);
      const shadowOpacity = lerp(
        shadow.opacity,
        shadow.opacity * FOCUSED_SHADOW_OPACITY_MULTIPLIER,
        focusProgress
      );

      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.zIndex = cssZIndex.toString();
      // Lift/focus growth is a centered 2D scale on the hit target (same as
      // paper/book) so the visual stays aligned with the bounding box even
      // when the per-item perspective origin is offset.
      ref.style.setProperty('--paper-z', `${toTranslateZPx(heightM, entity)}px`);
      ref.style.setProperty('--paper-lift-scale', liftScale.toString());
      ref.style.setProperty('--paper-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--paper-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--paper-rotate-z', `${rotation.z}deg`);
      setItemPerspectiveVars(world, ref, position, rotation.z);
      ref.style.setProperty('--shadow-offset-x', `${shadow.offsetX}px`);
      ref.style.setProperty('--shadow-offset-y', `${shadow.offsetY}px`);
      ref.style.setProperty('--shadow-scale-x', shadow.scaleX.toString());
      ref.style.setProperty('--shadow-scale-y', shadow.scaleY.toString());
      ref.style.setProperty('--shadow-opacity', shadowOpacity.toString());
      ref.style.setProperty('--focus-progress', focusProgress.toString());
    });
}

function getPolaroidZIndex(stackIndex: { value: number }, isDragging: boolean, isFocused: boolean) {
  if (isFocused) return stackIndex.value + FOCUSED_STACK_BOOST;
  return isDragging ? stackIndex.value + DRAGGING_STACK_BOOST : stackIndex.value;
}
