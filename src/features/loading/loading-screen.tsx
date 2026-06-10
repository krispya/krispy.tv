import { useState, useSyncExternalStore } from 'react';
import { color } from '../../color.js';
import { loadingControl } from './control.js';
import { Spinner } from './spinner.js';

/**
 * Single persistent cover for a feature's boot waterfall: chunk load, asset
 * decode and GPU warmup all happen beneath it with no fallback handoff.
 * When a feature reports ready through `loadingControl` the whole cover drops
 * off the bottom of the viewport (as the desk items throw up) and unmounts.
 */
export function LoadingScreen() {
  const phase = useSyncExternalStore(loadingControl.subscribe, loadingControl.get);
  const ready = phase === 'ready';
  const [done, setDone] = useState(false);

  if (done) return null;

  const coverClasses = [
    'loading-cover fixed inset-0 z-3000 flex items-center justify-center',
    ready && 'loading-cover--exit',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={coverClasses}
      style={{ backgroundColor: color.surface.desk }}
      onAnimationEnd={(event) => {
        if (ready && event.animationName === 'loading-cover-drop') setDone(true);
      }}
      onTransitionEnd={() => {
        // Reduced-motion exit is an opacity transition instead of the drop.
        if (ready) setDone(true);
      }}
      aria-hidden={ready ? true : undefined}
    >
      <Spinner />
    </div>
  );
}
