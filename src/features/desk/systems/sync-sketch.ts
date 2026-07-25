import type { Entity, World } from 'koota';
import {
  ActiveSlug,
  IsOffScreen,
  IsOpen,
  IsPreloading,
  Paper,
  SketchMotion,
  SketchOf,
} from '../traits/index.js';

/**
 * Mirrors syncArticle for sketchable (blank) pages: when the active slug names
 * a sketchable paper, spawn a sketch sheet entity related to it. The sheet
 * mounts hidden (IsPreloading) so React can render the drawing surface while
 * the paper flies off the desk.
 */
export function syncSketch(world: World) {
  const route = world.get(ActiveSlug);
  if (!route) return;

  const { slug } = route;

  world.query(SketchOf('*'), IsPreloading).readEach((_, entity) => {
    const paper = entity.targetFor(SketchOf);
    if (!paper?.has(IsOpen) || paper.has(IsOffScreen)) {
      entity.remove(IsPreloading);
    }
  });

  // Closing is handled by the sheet spring once the paper loses IsOpen.

  if (!slug) return;

  // Check if a sketch entity already exists for this slug
  let hasSketch = false;
  world.query(SketchOf('*'), SketchMotion).readEach((_, entity) => {
    const paper = entity.targetFor(SketchOf);
    if (paper?.get(Paper)?.id === slug) hasSketch = true;
  });
  if (hasSketch) return;

  // Find the paper as soon as it opens so React can begin rendering while hidden.
  let targetPaper: Entity | undefined;
  world.query(Paper, IsOpen).readEach(([paper], entity) => {
    if (paper.id === slug && paper.sketchable) targetPaper = entity;
  });
  if (!targetPaper) return;

  world.spawn(SketchMotion({ progress: 1, velocity: 0 }), IsPreloading, SketchOf(targetPaper));
}
