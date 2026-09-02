import { useWorld } from 'koota/react';
import { useEffect } from 'react';
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
  syncMousePadToDOM,
  syncOpenState,
  syncPaperToDOM,
  syncPolaroidToDOM,
  syncSketch,
  updateArticleMotion,
  updateDragging,
  updateFoldedPaper,
  updateItemFocus,
  updateRotation,
  updateSketchMotion,
  updateTime,
} from './systems/index.js';
import { Pointer } from './traits/index.js';
import { syncViewportToWindow } from './utils/camera.js';
import { useFrame } from '../frameloop/use-frame.js';

export function Frameloop() {
  const world = useWorld();

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
    syncSketch(world);
    updateSketchMotion(world);
    updateItemFocus(world);
    updateFoldedPaper(world);

    // View
    syncDeskItemToDOM(world);
    syncPaperToDOM(world);
    syncPolaroidToDOM(world);
    syncBookToDOM(world);
    syncHeadphonesToDOM(world);
    syncMousePadToDOM(world);
  });

  useEffect(() => {
    const updateViewport = () => syncViewportToWindow(world);

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
