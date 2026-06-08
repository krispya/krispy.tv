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
  const openPolaroids = useQuery(Polaroid, IsOpen);
  const openPolaroid = openPolaroids[0];

  if (!openPolaroid) return null;

  return <PolaroidFocusBackdropSurface entity={openPolaroid} />;
}

function PolaroidFocusBackdropSurface({ entity }: { entity: Entity }) {
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const camera = useTrait(world, Camera);
  const motion = useTrait(entity, PolaroidFocusMotion);
  const { closeOpenPolaroid } = useActions(actions);
  const opacity = getBackdropOpacity(motion);
  const rect = getVisibleDeskRect(viewport, camera);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-auto absolute bg-stone-950 backdrop-blur-[2px] will-change-[opacity,transform]"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        opacity,
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
  const maxOpacity = 0.72;
  if (!motion) return maxOpacity;

  const progress = clamp01(motion.progress);
  if (motion.phase === 'closing') return maxOpacity * easeInOutCubic(progress);

  return maxOpacity * easeOutCubic(progress);
}
