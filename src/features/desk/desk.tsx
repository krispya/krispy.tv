import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import { use } from 'react';
import { Frameloop } from './frameloop.js';
import { DeskProjection } from './presentation/desk-projection.js';
import { ArticleRenderer } from './renderers/article-renderer.js';
import { BookRenderer } from './renderers/book-renderer.js';
import { DeskRenderer } from './renderers/desk-renderer.js';
import { HeadphonesRenderer } from './renderers/headphones-renderer.js';
import { PaperRenderer } from './renderers/paper-renderer.js';
import { PolaroidFocusBackdrop } from './renderers/polaroid-focus-backdrop.js';
import { PolaroidRenderer } from './renderers/polaroid-renderer.js';
import { Startup } from './startup.js';
import { ActiveSlug, Camera, Pointer, Scene, Time, Viewport } from './traits/index.js';
import { preloadDeskAssets } from './utils/preload-assets.js';

export function Desk() {
  // Suspend until all desk images are decoded, before the world exists.
  use(preloadDeskAssets());

  const world = createWorld(Time, Pointer, Viewport, Camera, ActiveSlug, Scene);

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup />

      <DeskProjection>
        <DeskRenderer />
        <HeadphonesRenderer />
        <PaperRenderer />
        <PolaroidFocusBackdrop />
        <PolaroidRenderer />
        <BookRenderer />
      </DeskProjection>
      <ArticleRenderer />
    </WorldProvider>
  );
}
