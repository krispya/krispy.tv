import type { World } from 'koota';
import { Dragging, Paper, Position, Ref, Rotation, StackIndex } from '../traits/index.js';
import { getRestingHeight } from '../utils/resting-height.js';

const DRAGGING_STACK_BOOST = 1000;
const MAX_SHADOW_HEIGHT = 96;
const SHADOW_REST_OFFSET_X = 2;
const SHADOW_REST_OFFSET_Y = 3;
const SHADOW_LIFT_OFFSET_X = 32;
const SHADOW_LIFT_OFFSET_Y = 40;
const SHADOW_REST_BLUR = 1;
const SHADOW_LIFT_BLUR = 2;

export function syncPaperToDOM(world: World) {
  world
    .query(Paper, Position, Rotation, Ref, StackIndex)
    .updateEach(([_paper, position, rotation, ref, stackIndex], entity) => {
      const cssZIndex = getPaperZIndex(stackIndex, entity.has(Dragging));

      ref.style.transform = `translate(${position.x}px, ${position.y}px)`;
      ref.style.zIndex = cssZIndex.toString();

      const supportZ = getRestingHeight(entity);
      const height = Math.min(Math.max(position.z - supportZ, 0), MAX_SHADOW_HEIGHT);
      const lift = height / MAX_SHADOW_HEIGHT;
      const offsetX = SHADOW_REST_OFFSET_X + lift * SHADOW_LIFT_OFFSET_X;
      const offsetY = SHADOW_REST_OFFSET_Y + lift * SHADOW_LIFT_OFFSET_Y;
      const blur = SHADOW_REST_BLUR + lift * SHADOW_LIFT_BLUR;
      const scaleX = 1 + lift * 0.07;
      const scaleY = 1 + lift * 0.045;
      const opacity = 0.4 + lift * 0.1;

      ref.style.setProperty('--paper-z', `${position.z}px`);
      ref.style.setProperty('--paper-rotate-x', `${rotation.x}deg`);
      ref.style.setProperty('--paper-rotate-y', `${rotation.y}deg`);
      ref.style.setProperty('--paper-rotate-z', `${rotation.z}deg`);
      ref.style.setProperty('--shadow-offset-x', `${offsetX}px`);
      ref.style.setProperty('--shadow-offset-y', `${offsetY}px`);
      ref.style.setProperty('--shadow-blur', `${blur}px`);
      ref.style.setProperty('--shadow-scale-x', scaleX.toString());
      ref.style.setProperty('--shadow-scale-y', scaleY.toString());
      ref.style.setProperty('--shadow-opacity', opacity.toString());
    });
}

function getPaperZIndex(stackIndex: { value: number }, isDragging: boolean) {
  return isDragging ? stackIndex.value + DRAGGING_STACK_BOOST : stackIndex.value;
}
