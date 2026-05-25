import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import { Frameloop } from './frameloop.js';
import { ArticleRenderer } from './renderers/article-renderer.js';
import { DeskRenderer } from './renderers/desk-renderer.js';
import { PaperRenderer } from './renderers/paper-renderer.js';
import { TimelineScroller } from './renderers/timeline-scroller.js';
import { ViewModeToggle } from './renderers/view-mode-toggle.js';
import { Startup } from './startup.js';
import { ActiveSlug, CarouselOffset, Pointer, Time, Viewport, ViewMode } from './traits/index.js';

export function Desk() {
  const world = createWorld(Time, Pointer, Viewport, ActiveSlug, ViewMode, CarouselOffset);

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup />

      <DeskRenderer />
      <TimelineScroller>
        <PaperRenderer />
      </TimelineScroller>
      <ArticleRenderer />
      <ViewModeToggle />
    </WorldProvider>
  );
}
