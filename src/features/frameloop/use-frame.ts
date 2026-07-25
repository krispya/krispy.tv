import { useEffect, useRef } from 'react';

export function useFrame(callback: () => void, active = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;

    let rafId: number;

    const loop = () => {
      callbackRef.current();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [active]);
}
