import { WorldProvider } from 'koota/react';
import { use, useState } from 'react';
import { createDeskWorld } from './create-desk-world.js';
import { Frameloop } from './frameloop.js';
import { DeskProjection } from './presentation/desk-projection.js';
import { ArticleRenderer } from './renderers/article-renderer.js';
import { BookRenderer } from './renderers/book-renderer.js';
import { DeskRenderer } from './renderers/desk-renderer.js';
import { HeadphonesRenderer } from './renderers/headphones-renderer.js';
import { ItemFocusBackdrop } from './renderers/item-focus-backdrop.js';
import { MousePadRenderer } from './renderers/mouse-pad-renderer.js';
import { PaperRenderer } from './renderers/paper-renderer.js';
import { PolaroidFocusBody } from './renderers/polaroid-focus-body.js';
import { PolaroidRenderer } from './renderers/polaroid-renderer.js';
import { SketchRenderer } from './renderers/sketch-renderer.js';
import { Startup } from './startup.js';
import { preloadDeskAssets } from './utils/preload-assets.js';

export function Desk() {
  // Suspend until all desk images are decoded, before the world exists.
  use(preloadDeskAssets());

  const [{ pendingThrows, world }] = useState(createDeskWorld);

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup pendingThrows={pendingThrows} />

      <DeskProjection>
        <DeskRenderer />
        <MousePadRenderer />
        <HeadphonesRenderer />
        <PaperRenderer />
        <ItemFocusBackdrop />
        <PolaroidFocusBody />
        <PolaroidRenderer />
        <BookRenderer />
      </DeskProjection>

      <ArticleRenderer />
      <SketchRenderer />
    </WorldProvider>
  );
}
