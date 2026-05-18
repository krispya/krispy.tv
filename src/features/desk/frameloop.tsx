import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import {
  dampVelocity,
  syncToDOM,
  updateDragging,
  updateTime,
  updateTransform,
} from './systems/index.js';
import { Pointer, Viewport } from './traits.js';
import { useAnimationFrame } from '../../utils/use-animation-frame.js';

export function Frameloop() {
  const world = useWorld();

  useAnimationFrame(() => {
    updateTime(world);
    updateDragging(world);
    dampVelocity(world);
    updateTransform(world);
    syncToDOM(world);
  });

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
