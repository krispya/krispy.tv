import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { useRoute } from 'wouter';
import { routes } from '../../routes.js';
import {
  activateWallBarrier,
  applyAngularVelocity,
  applyBreeze,
  applyGravity,
  applyVelocity,
  bounceWithinViewport,
  dampVelocity,
  detectOffScreen,
  resolvePaperSupports,
  syncArticle,
  syncOpenState,
  syncToDOM,
  updateArticleMotion,
  updateDragging,
  updateResponsiveDeskLayout,
  updateTime,
  updateTransform,
} from './systems/index.js';
import { ActiveSlug, Pointer, Viewport } from './traits/index.js';
import { useAnimationFrame } from '../frameloop/use-animation-frame.js';

export function Frameloop() {
  const world = useWorld();
  const [isArticle, params] = useRoute<{ slug: string }>(routes.article.path);
  const slug = isArticle ? (params?.slug ?? '') : '';

  useAnimationFrame(() => {
    updateTime(world);
    updateResponsiveDeskLayout(world);
    updateDragging(world);
    applyGravity(world);
    applyBreeze(world);
    applyVelocity(world);
    applyAngularVelocity(world);
    resolvePaperSupports(world);
    activateWallBarrier(world);
    bounceWithinViewport(world);
    dampVelocity(world);
    updateTransform(world);
    syncOpenState(world);
    detectOffScreen(world);
    syncArticle(world);
    updateArticleMotion(world);
    syncToDOM(world);
  });

  useEffect(() => {
    world.set(ActiveSlug, { slug });
  }, [world, slug]);

  useEffect(() => {
    const updateViewport = () => {
      world.set(Viewport, { width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, [world]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      world.set(Pointer, { x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [world]);

  return null;
}
