import { useEffect, useRef, useState } from 'react';

const DISMISS_THRESHOLD_PX = 120;
const ACTIVATE_THRESHOLD_PX = 6;
const SNAP_BACK_TRANSITION = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)';
const WHEEL_IDLE_MS = 140;

type DragState = {
  active: boolean;
  startY: number;
  y: number;
};

type DragRef = {
  current: DragState;
};

function beginDrag(sheet: HTMLElement, dragRef: DragRef, startY: number) {
  dragRef.current = { active: true, startY, y: 0 };
  sheet.style.transition = 'none';
  sheet.style.transform = 'translateY(0px)';
}

function setDragY(sheet: HTMLElement, dragRef: DragRef, y: number) {
  const dragY = Math.max(0, y);
  dragRef.current.y = dragY;
  sheet.style.transform = `translateY(${dragY}px)`;
}

function updateDrag(sheet: HTMLElement, dragRef: DragRef, clientY: number) {
  setDragY(sheet, dragRef, clientY - dragRef.current.startY);
}

function finishDrag(sheet: HTMLElement, dragRef: DragRef, onDismiss: () => void) {
  if (!dragRef.current.active) return;

  const y = dragRef.current.y;
  dragRef.current.active = false;

  if (y > DISMISS_THRESHOLD_PX) {
    onDismiss();
    return;
  }

  dragRef.current.y = 0;
  sheet.style.transition = SNAP_BACK_TRANSITION;
  sheet.style.transform = 'translateY(0px)';
}

function normalizeWheelDeltaY(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

type DismissibleSheetOptions = {
  onDismiss: () => void;
  handleDrag?: boolean;
  touchScrollDismiss?: boolean;
  wheelDismiss?: boolean;
};

export function useDismissibleSheet({
  onDismiss,
  handleDrag = true,
  touchScrollDismiss = true,
  wheelDismiss = true,
}: DismissibleSheetOptions) {
  const [sheet, sheetRef] = useState<HTMLDivElement | null>(null);
  const [handle, handleRef] = useState<HTMLDivElement | null>(null);
  const [scroll, scrollRef] = useState<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>({ active: false, startY: 0, y: 0 });
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!sheet || !handle || !handleDrag) return;

    let pointerId: number | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      pointerId = event.pointerId;
      handle.setPointerCapture(event.pointerId);
      beginDrag(sheet, dragRef, event.clientY);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;

      updateDrag(sheet, dragRef, event.clientY);
      event.preventDefault();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;

      pointerId = null;
      finishDrag(sheet, dragRef, onDismissRef.current);
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
  }, [sheet, handle, handleDrag]);

  useEffect(() => {
    if (!sheet || !scroll || !touchScrollDismiss) return;

    let touchId: number | null = null;
    let startY = 0;
    let mode: 'pending' | 'scroll' | 'drag' = 'pending';

    const getTouch = (event: TouchEvent) =>
      Array.from(event.touches).find((touch) => touch.identifier === touchId);

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      touchId = touch.identifier;
      startY = touch.clientY;
      mode = 'pending';
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = getTouch(event);
      if (!touch) return;

      const deltaY = touch.clientY - startY;

      if (mode === 'pending') {
        if (Math.abs(deltaY) < ACTIVATE_THRESHOLD_PX) return;

        if (deltaY > 0 && scroll.scrollTop <= 0) {
          mode = 'drag';
          beginDrag(sheet, dragRef, startY);
        } else {
          mode = 'scroll';
          return;
        }
      }

      if (mode === 'drag') {
        event.preventDefault();
        updateDrag(sheet, dragRef, touch.clientY);
      }
    };

    const onTouchEnd = () => {
      if (mode === 'drag') finishDrag(sheet, dragRef, onDismissRef.current);

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
  }, [sheet, scroll, touchScrollDismiss]);

  useEffect(() => {
    if (!sheet || !scroll || !wheelDismiss) return;

    let finishTimeout: number | undefined;
    let dismissed = false;

    const finishWheelDrag = () => {
      finishTimeout = undefined;
      finishDrag(sheet, dragRef, onDismissRef.current);
    };

    const scheduleFinish = () => {
      if (finishTimeout !== undefined) window.clearTimeout(finishTimeout);
      finishTimeout = window.setTimeout(finishWheelDrag, WHEEL_IDLE_MS);
    };

    const onWheel = (event: WheelEvent) => {
      if (dismissed) return;

      const deltaY = normalizeWheelDeltaY(event);
      const isPullingPastTop = scroll.scrollTop <= 0 && deltaY < 0;

      if (!dragRef.current.active && !isPullingPastTop) return;

      event.preventDefault();

      if (!dragRef.current.active) {
        beginDrag(sheet, dragRef, 0);
      }

      setDragY(sheet, dragRef, dragRef.current.y - deltaY);

      if (dragRef.current.y > DISMISS_THRESHOLD_PX) {
        if (finishTimeout !== undefined) window.clearTimeout(finishTimeout);
        dismissed = true;
        finishDrag(sheet, dragRef, onDismissRef.current);
        return;
      }

      scheduleFinish();
    };

    scroll.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      if (finishTimeout !== undefined) window.clearTimeout(finishTimeout);
      scroll.removeEventListener('wheel', onWheel);
    };
  }, [sheet, scroll, wheelDismiss]);

  return { sheetRef, handleRef, scrollRef };
}
