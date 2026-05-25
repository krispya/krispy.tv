import { useQuery, useTrait, useWorld } from 'koota/react';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActiveSlug,
  CarouselOffset,
  Paper,
  TimelineSlot,
  ViewMode,
  Viewport,
} from '../traits/index.js';

const GAP = 32;

export function TimelineScroller({ children }: { children: ReactNode }) {
  const world = useWorld();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const viewMode = useTrait(world, ViewMode);
  const viewport = useTrait(world, Viewport);
  const activeSlug = useTrait(world, ActiveSlug);
  const timelinePapers = useQuery(TimelineSlot, Paper);
  const isTimeline = viewMode?.mode === 'timeline';
  const hasOpenArticle = Boolean(activeSlug?.slug);

  let contentWidth = viewport?.width ?? window.innerWidth;

  for (const entity of timelinePapers) {
    const slot = entity.get(TimelineSlot);
    const paper = entity.get(Paper);
    if (!slot || !paper) continue;

    contentWidth = Math.max(contentWidth, slot.targetX + paper.width / 2 + GAP);
  }

  useEffect(() => {
    if (!isTimeline) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const carousel = world.get(CarouselOffset);
    scroller.scrollLeft = carousel?.x ?? 0;
  }, [isTimeline, world]);

  if (!isTimeline) return children;

  return (
    <div
      ref={scrollerRef}
      className={`fixed inset-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch] ${
        hasOpenArticle ? 'pointer-events-none [touch-action:auto]' : '[touch-action:pan-x]'
      }`}
      onWheel={(event) => {
        if (hasOpenArticle) return;
        if (event.ctrlKey) return;

        const delta = event.deltaX || event.deltaY;
        if (delta === 0) return;

        event.preventDefault();
        event.currentTarget.scrollLeft += delta;
      }}
      onScroll={(event) => {
        const x = event.currentTarget.scrollLeft;
        world.set(CarouselOffset, { x, targetX: x });
      }}
      aria-label="Timeline scroll"
    >
      {children}
      <div style={{ width: contentWidth, height: 1 }} />
    </div>
  );
}
