import { useTrait, useWorld } from 'koota/react';
import { Camera, Viewport } from '../traits/index.js';
import { getVisibleDeskRect } from '../utils/camera.js';
import { getStagePerspective, getStagePerspectiveOrigin, getStageTiltTransform } from './stage.js';

export function DeskProjection({ children }: { children: React.ReactNode }) {
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const camera = useTrait(world, Camera);
  const rect = getVisibleDeskRect(viewport, camera);
  const zoom = Math.max(0.001, camera?.zoom ?? 1);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        perspective: getStagePerspective(),
        perspectiveOrigin: getStagePerspectiveOrigin(),
      }}
    >
      <div className="absolute inset-0" style={{ transform: getStageTiltTransform() }}>
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${-rect.x * zoom}px, ${-rect.y * zoom}px) scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
