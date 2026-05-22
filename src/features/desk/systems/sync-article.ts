import type { Entity, World } from 'koota';
import {
  ActiveSlug,
  ArticleOf,
  IsOffScreen,
  IsOpen,
  Paper,
  Position,
  Velocity,
} from '../traits/index.js';

export function syncArticle(world: World) {
  const route = world.get(ActiveSlug);
  if (!route) return;

  const { slug } = route;

  // When slug clears, remove IsOpen from paper — syncOpenState handles the throw.
  // The article entity's spring will detect paper lost IsOpen and slide off.
  // Nothing to do here for closing — the spring system handles it.

  if (!slug) return;

  // Check if an article entity already exists for this slug
  let hasArticle = false;
  world.query(ArticleOf('*'), Position).readEach((_, entity) => {
    const paper = entity.targetFor(ArticleOf);
    if (paper?.get(Paper)?.id === slug) hasArticle = true;
  });
  if (hasArticle) return;

  // Find the paper that's open and off-screen
  let targetPaper: Entity | undefined;
  world.query(Paper, IsOpen, IsOffScreen).readEach(([paper], entity) => {
    if (paper.id === slug) targetPaper = entity;
  });
  if (!targetPaper) return;

  // Spawn article entity with relation to paper
  world.spawn(Position({ x: 0, y: 1, z: 0 }), Velocity({ x: 0, y: 0, z: 0 }), ArticleOf(targetPaper));
}
