import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import { Frameloop } from './frameloop.js';
import { ArticleRenderer } from './renderers/article-renderer.js';
import { BookRenderer } from './renderers/book-renderer.js';
import { DeskRenderer } from './renderers/desk-renderer.js';
import { PaperRenderer } from './renderers/paper-renderer.js';
import { Startup } from './startup.js';
import { ActiveSlug, Pointer, Time, Viewport } from './traits/index.js';

export function Desk() {
  const world = createWorld(Time, Pointer, Viewport, ActiveSlug);

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup />

      <DeskRenderer />
      <PaperRenderer />
      <BookRenderer />
      <ArticleRenderer />
    </WorldProvider>
  );
}
