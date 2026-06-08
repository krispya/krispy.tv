import { createWorld } from 'koota';
import { useTrait, useWorld, WorldProvider } from 'koota/react';
import {
  getStagePerspective,
  getStagePerspectiveOrigin,
  getStageTiltTransform,
} from './presentation/stage.js';
import { Frameloop } from './frameloop.js';
import { ArticleRenderer } from './renderers/article-renderer.js';
import { BookRenderer } from './renderers/book-renderer.js';
import { DeskRenderer } from './renderers/desk-renderer.js';
import { PaperRenderer } from './renderers/paper-renderer.js';
import { PolaroidFocusBackdrop } from './renderers/polaroid-focus-backdrop.js';
import { PolaroidRenderer } from './renderers/polaroid-renderer.js';
import { Startup } from './startup.js';
import { ActiveSlug, Camera, Pointer, Time, Viewport } from './traits/index.js';
import { getVisibleDeskRect } from './utils/camera.js';

export function Desk() {
  const world = createWorld(Time, Pointer, Viewport, Camera, ActiveSlug);

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup />

      <Stage>
        <DeskCameraLayer>
          <DeskRenderer />
          <PaperRenderer />
          <PolaroidFocusBackdrop />
          <PolaroidRenderer />
          <BookRenderer />
        </DeskCameraLayer>
      </Stage>
      <ArticleRenderer />
    </WorldProvider>
  );
}

function DeskCameraLayer({ children }: { children: React.ReactNode }) {
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const camera = useTrait(world, Camera);
  const rect = getVisibleDeskRect(viewport, camera);
  const zoom = Math.max(0.001, camera?.zoom ?? 1);

  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `translate(${-rect.x * zoom}px, ${-rect.y * zoom}px) scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      {children}
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        perspective: getStagePerspective(),
        perspectiveOrigin: getStagePerspectiveOrigin(),
      }}
    >
      <div className="absolute inset-0" style={{ transform: getStageTiltTransform() }}>
        {children}
      </div>
    </div>
  );
}
