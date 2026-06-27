import type { World } from 'koota';
import {
  Desk,
  Dragging,
  FocusableItem,
  IsFocused,
  ItemFocusMotion,
  Position,
  Ref,
  Rotation,
  StackIndex,
} from '../traits/index.js';
import { toMeshLiftScale, toTranslateZPx } from '../presentation/lift.js';
import { setItemPerspectiveVars } from '../presentation/item-perspective.js';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { getItemFocusProgress } from '../utils/item-focus.js';
import { isThresholdItem } from '../utils/stack-order.js';
import { lerp } from '../utils/math.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const DRAGGING_STACK_BOOST = 1000;
const FOCUSED_STACK_BOOST = 2000;

export function syncDeskItemToDOM(world: World) {
  const restackThreshold = world.queryFirst(Desk)?.get(Desk)?.restackThreshold ?? 0;

  world
    .query(Position, Rotation, Ref, StackIndex)
    .updateEach(([position, rotation, ref, stackIndex], entity) => {
      const focusable = entity.get(FocusableItem);
      const focusMotion = entity.get(ItemFocusMotion);
      const focusProgress = getItemFocusProgress(entity);
      const isTuckedIntoDeskPlane =
        focusMotion?.phase === 'closing' && isThresholdItem(entity, restackThreshold);
      const isFocused = (entity.has(IsFocused) || !!focusMotion) && !isTuckedIntoDeskPlane;
      const heightM = getHeightAbovePlaneM(position.z);
      const liftScale = lerp(toMeshLiftScale(heightM), focusable?.focusedScale ?? 1, focusProgress);

      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.zIndex = getItemZIndex(stackIndex.value, entity.has(Dragging), isFocused).toString();
      ref.style.setProperty('--item-z', `${toTranslateZPx(heightM, entity)}px`);
      ref.style.setProperty('--item-lift-scale', liftScale.toString());
      ref.style.setProperty('--item-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--item-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--item-rotate-z', `${rotation.z}deg`);
      ref.style.setProperty('--item-focus-progress', focusProgress.toString());
      setItemPerspectiveVars(world, ref, position, rotation.z);
    });
}

function getItemZIndex(stackIndex: number, isDragging: boolean, isFocused: boolean) {
  if (isFocused) return stackIndex + FOCUSED_STACK_BOOST;
  return isDragging ? stackIndex + DRAGGING_STACK_BOOST : stackIndex;
}
