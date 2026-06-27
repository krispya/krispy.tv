import type { Entity } from 'koota';
import { useActions, useQuery, useTrait, useWorld } from 'koota/react';
import { actions } from '../actions.js';
import { getInverseStageTiltTransform } from '../presentation/stage.js';
import { Camera, IsFocused, ItemFocusMotion, Viewport } from '../traits/index.js';
import { getVisibleDeskRect } from '../utils/camera.js';
import { clamp01, easeInOutCubic, easeOutCubic } from '../utils/math.js';

const BACKDROP_Z_INDEX = 1500;
const BACKDROP_SCALE = 1.16;

export function ItemFocusBackdrop() {
  // Track focus motion rather than IsFocused so the backdrop can keep fading out
  // while an item is closing (IsFocused is removed as soon as a close starts).
  const focusedItems = useQuery(ItemFocusMotion);
  const focusedItem = focusedItems.find((entity) => entity.has(IsFocused)) ?? focusedItems[0];

  if (!focusedItem) return null;

  return <ItemFocusBackdropSurface entity={focusedItem} />;
}

function ItemFocusBackdropSurface({ entity }: { entity: Entity }) {
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const camera = useTrait(world, Camera);
  const motion = useTrait(entity, ItemFocusMotion);
  const { closeFocusedItems } = useActions(actions);
  const opacity = getBackdropOpacity(motion);
  const rect = getVisibleDeskRect(viewport, camera);
  const isClosing = motion?.phase === 'closing';

  return (
    <div
      aria-hidden="true"
      className="absolute bg-stone-950 backdrop-blur-[2px] will-change-[opacity,transform]"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        opacity,
        // While closing, the fading backdrop must not block grabbing items.
        pointerEvents: isClosing ? 'none' : 'auto',
        transform: `${getInverseStageTiltTransform()} scale(${BACKDROP_SCALE})`,
        transformOrigin: 'center center',
        zIndex: BACKDROP_Z_INDEX,
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        closeFocusedItems();
      }}
    />
  );
}

function getBackdropOpacity(motion: ReturnType<typeof useTrait<typeof ItemFocusMotion>>) {
  const maxOpacity = 0.82;
  if (!motion) return maxOpacity;

  const progress = clamp01(motion.progress);
  if (motion.phase === 'closing') return maxOpacity * easeInOutCubic(progress);

  return maxOpacity * easeOutCubic(progress);
}
