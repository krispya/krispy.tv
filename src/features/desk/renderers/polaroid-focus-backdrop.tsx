import type { Entity } from 'koota';
import { useActions, useQuery, useTrait, useWorld } from 'koota/react';
import { actions } from '../actions.js';
import { getInverseStageTiltTransform } from '../presentation/stage.js';
import { Camera, IsOpen, Polaroid, PolaroidFocusMotion, Viewport } from '../traits/index.js';
import { getVisibleDeskRect } from '../utils/camera.js';
import { clamp01, easeInOutCubic, easeOutCubic } from '../utils/math.js';

const BACKDROP_Z_INDEX = 1500;
const BACKDROP_SCALE = 1.16;

export function PolaroidFocusBackdrop() {
  // Track focus motion rather than IsOpen so the backdrop can keep fading out
  // while a polaroid is closing (IsOpen is removed as soon as a close starts).
  const focusedPolaroids = useQuery(Polaroid, PolaroidFocusMotion);
  const focusedPolaroid =
    focusedPolaroids.find((entity) => entity.has(IsOpen)) ?? focusedPolaroids[0];

  if (!focusedPolaroid) return null;

  return <PolaroidFocusBackdropSurface entity={focusedPolaroid} />;
}

function PolaroidFocusBackdropSurface({ entity }: { entity: Entity }) {
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const camera = useTrait(world, Camera);
  const motion = useTrait(entity, PolaroidFocusMotion);
  const { closeOpenPolaroid } = useActions(actions);
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
        closeOpenPolaroid();
      }}
    />
  );
}

function getBackdropOpacity(motion: ReturnType<typeof useTrait<typeof PolaroidFocusMotion>>) {
  const maxOpacity = 0.82;
  if (!motion) return maxOpacity;

  const progress = clamp01(motion.progress);
  if (motion.phase === 'closing') return maxOpacity * easeInOutCubic(progress);

  return maxOpacity * easeOutCubic(progress);
}
