import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

const DISMISS_THRESHOLD_PX = 120;
const ACTIVATE_THRESHOLD_PX = 4;
const SNAP_BACK_TRANSITION = 'transform 0.3s ease';

export function useDragToDismiss(onDismiss: () => void) {
  const scrollRef = useRef<HTMLElement>(null);
  const pointerStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [transition, setTransition] = useState(SNAP_BACK_TRANSITION);

  const finishDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (dragYRef.current > DISMISS_THRESHOLD_PX) {
      onDismiss();
    } else {
      dragYRef.current = 0;
      setTransition(SNAP_BACK_TRANSITION);
      setDragY(0);
    }
  }, [onDismiss]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      pointerStartYRef.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const dy = event.touches[0].clientY - pointerStartYRef.current;

      if (!isDraggingRef.current) {
        if (element.scrollTop <= 0 && dy > ACTIVATE_THRESHOLD_PX) {
          isDraggingRef.current = true;
          setTransition('none');
        } else {
          return;
        }
      }

      event.preventDefault();

      const clamped = Math.max(0, dy);
      dragYRef.current = clamped;
      setDragY(clamped);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', finishDrag);
    element.addEventListener('touchcancel', finishDrag);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', finishDrag);
      element.removeEventListener('touchcancel', finishDrag);
    };
  }, [finishDrag]);

  const style: CSSProperties = {
    transform: `translateY(${dragY}px)`,
    transition,
  };

  return { scrollRef, style };
}
