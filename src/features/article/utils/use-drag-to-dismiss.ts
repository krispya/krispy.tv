import { useEffect, useRef, useState } from 'react';

const DISMISS_THRESHOLD_PX = 120;
const ACTIVATE_THRESHOLD_PX = 6;
const SNAP_BACK_TRANSITION = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)';

type DragState = {
  active: boolean;
  startY: number;
  y: number;
};

type DragRef = {
  current: DragState;
};

function beginDrag(container: HTMLElement, dragRef: DragRef, clientY: number) {
  dragRef.current = { active: true, startY: clientY, y: 0 };
  container.style.transition = 'none';
  container.style.transform = 'translateY(0px)';
}

function updateDrag(container: HTMLElement, dragRef: DragRef, clientY: number) {
  const y = Math.max(0, clientY - dragRef.current.startY);
  dragRef.current.y = y;
  container.style.transform = `translateY(${y}px)`;
}

function finishDrag(container: HTMLElement, dragRef: DragRef, onDismiss: () => void) {
  if (!dragRef.current.active) return;

  const y = dragRef.current.y;
  dragRef.current.active = false;

  if (y > DISMISS_THRESHOLD_PX) {
    onDismiss();
    return;
  }

  dragRef.current.y = 0;
  container.style.transition = SNAP_BACK_TRANSITION;
  container.style.transform = 'translateY(0px)';
}

export function useDragToDismiss(onDismiss: () => void) {
  const [container, containerRef] = useState<HTMLDivElement | null>(null);
  const [handle, handleRef] = useState<HTMLDivElement | null>(null);
  const [scroll, scrollRef] = useState<HTMLElement | null>(null);
  const dragRef = useRef<DragState>({ active: false, startY: 0, y: 0 });
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!container || !handle) return;

    let pointerId: number | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      pointerId = event.pointerId;
      handle.setPointerCapture(event.pointerId);
      beginDrag(container, dragRef, event.clientY);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;

      updateDrag(container, dragRef, event.clientY);
      event.preventDefault();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;

      pointerId = null;
      finishDrag(container, dragRef, onDismissRef.current);
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerEnd);
    handle.addEventListener('pointercancel', onPointerEnd);

    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerEnd);
      handle.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [container, handle]);

  useEffect(() => {
    if (!container || !scroll) return;

    let touchId: number | null = null;
    let startY = 0;
    let mode: 'pending' | 'scroll' | 'drag' = 'pending';

    const getTouch = (event: TouchEvent) =>
      Array.from(event.touches).find((touch) => touch.identifier === touchId);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      touchId = touch.identifier;
      startY = touch.clientY;
      mode = 'pending';
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = getTouch(e);
      if (!touch) return;

      const deltaY = touch.clientY - startY;

      if (mode === 'pending') {
        if (Math.abs(deltaY) < ACTIVATE_THRESHOLD_PX) return;

        if (deltaY > 0 && scroll.scrollTop <= 0) {
          mode = 'drag';
          beginDrag(container, dragRef, startY);
        } else {
          mode = 'scroll';
          return;
        }
      }

      if (mode === 'drag') {
        e.preventDefault();
        updateDrag(container, dragRef, touch.clientY);
      }
    };

    const onTouchEnd = () => {
      if (mode === 'drag') finishDrag(container, dragRef, onDismissRef.current);

      touchId = null;
      mode = 'pending';
    };

    scroll.addEventListener('touchstart', onTouchStart, { passive: true });
    scroll.addEventListener('touchmove', onTouchMove, { passive: false });
    scroll.addEventListener('touchend', onTouchEnd);
    scroll.addEventListener('touchcancel', onTouchEnd);

    return () => {
      scroll.removeEventListener('touchstart', onTouchStart);
      scroll.removeEventListener('touchmove', onTouchMove);
      scroll.removeEventListener('touchend', onTouchEnd);
      scroll.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [container, scroll]);

  return { containerRef, handleRef, scrollRef };
}
