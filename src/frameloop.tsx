import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  dampVelocity,
  syncToDOM,
  updateDragging,
  updateTime,
  updateTransform,
  updateZOrder,
} from './core/systems/index.js';
import { Pointer, RouteState, Viewport } from './core/traits.js';
import { parseRoute } from './routes.js';
import { useAnimationFrame } from './utils/use-animation-frame.js';

export function Frameloop() {
  const world = useWorld();
  const [path] = useLocation();

  useAnimationFrame(() => {
    updateTime(world);
    updateDragging(world);
    dampVelocity(world);
    updateTransform(world);
    updateZOrder(world);
    syncToDOM(world);
  });

  useEffect(() => {
    world.set(RouteState, parseRoute(path));
  }, [path, world]);

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
