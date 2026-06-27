import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { useRoute } from 'wouter';
import { routes } from '../../routes.js';
import {
  activateVisibleDeskBarrier,
  applyAngularVelocity,
  applyBreeze,
  applyGravity,
  applyVelocity,
  bounceWithinVisibleDesk,
  dampVelocity,
  detectPastVisibleDesk,
  resolveBodyCollisions,
  resolveRestingBody,
  restackDeskPlaneItems,
  syncArticle,
  syncBookToDOM,
  syncDeskItemToDOM,
  syncHeadphonesToDOM,
  syncOpenState,
  syncPaperToDOM,
  syncPolaroidToDOM,
  updateArticleMotion,
  updateDragging,
  updateItemFocus,
  updateRotation,
  updateTime,
} from './systems/index.js';
import { ActiveSlug, Camera, Pointer, Viewport } from './traits/index.js';
import { DEFAULT_CAMERA, getResponsiveDeskZoom } from './utils/camera.js';
import { useFrame } from '../frameloop/use-frame.js';

export function Frameloop() {
  const world = useWorld();
  const [isArticle, params] = useRoute<{ slug: string }>(routes.article.path);
  const slug = isArticle ? (params?.slug ?? '') : '';

  useFrame(() => {
    // Time
    updateTime(world);

    // Input
    updateDragging(world);

    // Simulation
    applyGravity(world);
    applyBreeze(world);
    applyVelocity(world);
    applyAngularVelocity(world);

    // Physics
    resolveBodyCollisions(world);
    resolveRestingBody(world);
    restackDeskPlaneItems(world);
    activateVisibleDeskBarrier(world);
    bounceWithinVisibleDesk(world);

    // Post-simulation
    dampVelocity(world);
    updateRotation(world);

    // App state
    syncOpenState(world);
    detectPastVisibleDesk(world);
    syncArticle(world);
    updateArticleMotion(world);
    updateItemFocus(world);

    // View
    syncDeskItemToDOM(world);
    syncPaperToDOM(world);
    syncPolaroidToDOM(world);
    syncBookToDOM(world);
    syncHeadphonesToDOM(world);
  });

  useEffect(() => {
    world.set(ActiveSlug, { slug });
  }, [world, slug]);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const camera = world.get(Camera) ?? DEFAULT_CAMERA;

      world.set(Viewport, { width, height });
      world.set(Camera, {
        x: camera.x,
        y: camera.y,
        zoom: getResponsiveDeskZoom(width),
      });
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
