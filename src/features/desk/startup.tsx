import { useActions, useTraitEffect, useWorld } from 'koota/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { loadingControl } from '../loading/index.js';
import { actions } from './actions.js';
import type { PendingThrow } from './create-desk-world.js';
import { Scene } from './traits/index.js';
import { waitForStableFrames } from './utils/warmup.js';

/** Milliseconds. Lets the loading cover fall most of the way before items toss up. */
const TOSS_DELAY_MS = 220;

type StartupProps = {
  pendingThrows: PendingThrow[];
};

export function Startup({ pendingThrows }: StartupProps) {
  const world = useWorld();
  const { throwOntoDesk: throwPaperOntoDesk } = useActions(actions);
  const hasCoveredRef = useRef(false);
  const hasStartedWarmupRef = useRef(false);

  // Re-cover the desk before paint on first boot, but not when Activity reveals cached state.
  useLayoutEffect(() => {
    if (hasCoveredRef.current) return;

    hasCoveredRef.current = true;
    loadingControl.set('pending');
  }, []);

  useEffect(() => {
    if (hasStartedWarmupRef.current) return;

    // Assets are already decoded (the Desk component suspends on them), so the
    // world starts at `warming`: the mounted scene composites behind the boot
    // screen until the frame rate settles.
    hasStartedWarmupRef.current = true;

    void waitForStableFrames().then(() => {
      world.set(Scene, { phase: 'ready' });
    });
  }, [world]);

  useTraitEffect(world, Scene, (scene) => {
    if (scene?.phase !== 'ready') return;

    loadingControl.set('ready');

    setTimeout(() => {
      for (const { entity, centered, target } of pendingThrows.splice(0)) {
        throwPaperOntoDesk(entity, { centered, target });
      }
    }, TOSS_DELAY_MS);
  });

  return null;
}
