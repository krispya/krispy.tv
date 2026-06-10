import { useState, useSyncExternalStore } from 'react';
import { color } from '../../color.js';
import { loadingControl } from './control.js';

/**
 * Single persistent cover for a feature's boot waterfall: chunk load, asset
 * decode and GPU warmup all happen beneath it with no fallback handoff.
 * Fades out and unmounts once a feature reports ready through `loadingControl`.
 */
export function LoadingScreen() {
  const phase = useSyncExternalStore(loadingControl.subscribe, loadingControl.get);
  const ready = phase === 'ready';
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-3000 flex items-center justify-center transition-opacity duration-300"
      style={{
        backgroundColor: color.surface.desk,
        opacity: ready ? 0 : 1,
        pointerEvents: ready ? 'none' : undefined,
      }}
      onTransitionEnd={() => {
        if (ready) setDone(true);
      }}
      aria-hidden={ready ? true : undefined}
    >
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}
