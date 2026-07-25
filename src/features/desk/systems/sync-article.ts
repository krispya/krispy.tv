import type { Entity, World } from 'koota';
import {
  ActiveSlug,
  ArticleMotion,
  ArticleOf,
  IsOffScreen,
  IsOpen,
  IsPreloading,
  Paper,
} from '../traits/index.js';

export function syncArticle(world: World) {
  const route = world.get(ActiveSlug);
  if (!route) return;

  const { slug } = route;

  world.query(ArticleOf('*'), IsPreloading).readEach((_, entity) => {
    const paper = entity.targetFor(ArticleOf);
    if (!paper?.has(IsOpen) || paper.has(IsOffScreen)) {
      entity.remove(IsPreloading);
    }
  });

  // When slug clears, remove IsOpen from paper — syncOpenState handles the throw.
  // The article entity's spring will detect paper lost IsOpen and slide off.
  // Nothing to do here for closing — the spring system handles it.

  if (!slug) return;

  // Check if an article entity already exists for this slug
  let hasArticle = false;
  world.query(ArticleOf('*'), ArticleMotion).readEach((_, entity) => {
    const paper = entity.targetFor(ArticleOf);
    if (paper?.get(Paper)?.id === slug) hasArticle = true;
  });
  if (hasArticle) return;

  // Find the paper as soon as it opens so React can begin rendering while
  // hidden. Sketchable pages open into the sketch sheet instead (syncSketch).
  let targetPaper: Entity | undefined;
  world.query(Paper, IsOpen).readEach(([paper], entity) => {
    if (paper.id === slug && paper.openable) targetPaper = entity;
  });
  if (!targetPaper) return;

  // Spawn article entity with relation to paper
  world.spawn(ArticleMotion({ progress: 1, velocity: 0 }), IsPreloading, ArticleOf(targetPaper));
}
