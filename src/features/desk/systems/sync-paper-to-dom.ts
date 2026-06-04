import type { World } from 'koota';
import { getHeightAbovePlaneM } from '../utils/height.js';
import { toMeshLiftScale, toTranslateZPx } from '../presentation/lift.js';
import { toShadowStyle } from '../presentation/shadow.js';
import { Dragging, Paper, Position, Ref, Rotation, StackIndex } from '../traits/index.js';
import { metersToCssPixels } from '../utils/physics-units.js';

const DRAGGING_STACK_BOOST = 1000;

export function syncPaperToDOM(world: World) {
  world
    .query(Paper, Position, Rotation, Ref, StackIndex)
    .updateEach(([_paper, position, rotation, ref, stackIndex], entity) => {
      const cssZIndex = getPaperZIndex(stackIndex, entity.has(Dragging));
      const heightM = getHeightAbovePlaneM(position.z);
      const shadow = toShadowStyle(heightM);

      ref.style.transform = `translate(${metersToCssPixels(position.x)}px, ${metersToCssPixels(
        position.y
      )}px)`;
      ref.style.zIndex = cssZIndex.toString();
      ref.style.setProperty('--paper-z', `${toTranslateZPx(heightM, entity)}px`);
      ref.style.setProperty('--paper-lift-scale', toMeshLiftScale(heightM).toString());
      ref.style.setProperty('--paper-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--paper-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--paper-rotate-z', `${rotation.z}deg`);
      ref.style.setProperty('--shadow-offset-x', `${shadow.offsetX}px`);
      ref.style.setProperty('--shadow-offset-y', `${shadow.offsetY}px`);
      ref.style.setProperty('--shadow-blur', `${shadow.blur}px`);
      ref.style.setProperty('--shadow-scale-x', shadow.scaleX.toString());
      ref.style.setProperty('--shadow-scale-y', shadow.scaleY.toString());
      ref.style.setProperty('--shadow-opacity', shadow.opacity.toString());
    });
}

function getPaperZIndex(stackIndex: { value: number }, isDragging: boolean) {
  return isDragging ? stackIndex.value + DRAGGING_STACK_BOOST : stackIndex.value;
}
