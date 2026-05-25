import type { World } from 'koota';
import { CarouselOffset, Paper, TimelineSlot, Viewport, ViewMode } from '../traits/index.js';
import { dampedLerp } from '../utils/math.js';
import { getTimelineVisualWidth, TIMELINE_GAP } from '../utils/timeline-layout.js';

const SCROLL_LERP_DAMPING = 0.18;

export function updateCarouselScroll(world: World) {
  const viewMode = world.get(ViewMode);
  if (viewMode?.mode !== 'timeline') return;

  const carousel = world.get(CarouselOffset);
  if (!carousel) return;

  const viewport = world.get(Viewport);
  const viewportWidth = viewport?.width ?? window.innerWidth;

  // Compute total content width from timeline slots
  let maxTargetX = 0;

  world.query(TimelineSlot, Paper).readEach(([slot, paper]) => {
    const rightEdge = slot.targetX + getTimelineVisualWidth(paper.width) / 2 + TIMELINE_GAP;
    if (rightEdge > maxTargetX) maxTargetX = rightEdge;
  });

  const maxScroll = Math.max(0, maxTargetX - viewportWidth);

  // Clamp target, then lerp current toward it
  carousel.targetX = Math.min(Math.max(carousel.targetX, 0), maxScroll);
  carousel.x = dampedLerp(carousel.x, carousel.targetX, SCROLL_LERP_DAMPING, 1);
}
