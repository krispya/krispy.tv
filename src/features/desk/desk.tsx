import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import { getDeskPerspectiveOrigin, getDeskPerspectiveValue, getDeskTiltTransform } from './camera.js';
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

      <Stage>
        <DeskRenderer />
        <PaperRenderer />
        <BookRenderer />
      </Stage>
      <ArticleRenderer />
    </WorldProvider>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        perspective: getDeskPerspectiveValue(),
        perspectiveOrigin: getDeskPerspectiveOrigin(),
      }}
    >
      <div className="absolute inset-0" style={{ transform: getDeskTiltTransform() }}>
        {children}
      </div>
    </div>
  );
}
