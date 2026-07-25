import { useCallback, useEffect, useRef } from 'react';
import { color } from '../../color.js';
import { SketchControls } from './sketch-controls.js';
import { clearSketchTexture, getSketchTexture, saveSketchTexture } from './store.js';

/** US letter portrait, matching the desk paper and the `.paper-page` box. */
const PAGE_ASPECT_RATIO = 8.5 / 11;
/** Internal canvas resolution. The texture is scaled onto the desk paper. */
const CANVAS_WIDTH = 1088;
const CANVAS_HEIGHT = Math.round(CANVAS_WIDTH / PAGE_ASPECT_RATIO);
/** Canvas pixels at neutral (mouse) pressure. */
const BASE_BRUSH_WIDTH = 6;

type ActiveStroke = {
  pointerId: number;
  x: number;
  y: number;
};

/**
 * Fullscreen drawing surface for a blank desk page. Strokes render into a
 * fixed-resolution canvas whose aspect ratio matches the paper, so the saved
 * texture maps 1:1 onto the page back on the desk.
 */
export function Sketch({ id, onClose }: { id: string; onClose?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<ActiveStroke | null>(null);
  const dirtyRef = useRef(false);

  // Restore the persisted drawing when the surface mounts.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const texture = getSketchTexture(id);
    if (!texture) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = texture;

    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dirtyRef.current) return;

    dirtyRef.current = false;
    saveSketchTexture(id, canvas.toDataURL('image/png'));
  }, [id]);

  // Catch a mid-stroke exit (e.g. close while drawing) on unmount.
  useEffect(() => save, [save]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (strokeRef.current) return;

    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.setPointerCapture(event.pointerId);

    const point = getCanvasPoint(canvas, event.clientX, event.clientY);
    drawDot(context, point.x, point.y, getBrushWidth(event.pressure));
    strokeRef.current = { pointerId: event.pointerId, ...point };
    dirtyRef.current = true;
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (!stroke || stroke.pointerId !== event.pointerId) return;

    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;

    const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];

    for (const sample of events) {
      const point = getCanvasPoint(canvas, sample.clientX, sample.clientY);
      drawSegment(context, stroke, point, getBrushWidth(sample.pressure));
      stroke.x = point.x;
      stroke.y = point.y;
    }
  }, []);

  const endStroke = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const stroke = strokeRef.current;
      if (!stroke || stroke.pointerId !== event.pointerId) return;

      strokeRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      save();
    },
    [save]
  );

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    strokeRef.current = null;
    dirtyRef.current = false;
    clearSketchTexture(id);
  }, [id]);

  // `.paper-page` sizes the box to PAGE_ASPECT_RATIO, so the controls sit on
  // the page itself rather than in the corner of the screen.
  return (
    <div className="paper-stage absolute inset-0 flex items-center justify-center p-4 sm:p-10">
      <div className="paper-page pointer-events-auto relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block h-full w-full cursor-crosshair touch-none rounded-[3px] shadow-2xl select-none"
          style={{ backgroundColor: color.surface.paper }}
          aria-label="Drawing surface"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onLostPointerCapture={endStroke}
          onDragStart={(event) => event.preventDefault()}
        />

        <SketchControls onClear={handleClear} onClose={onClose} />
      </div>
    </div>
  );
}

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function getBrushWidth(pressure: number) {
  // Mouse reports a constant 0.5, mapping to the base width.
  return BASE_BRUSH_WIDTH * (0.4 + 1.2 * pressure);
}

function drawDot(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.fillStyle = color.line.ink;
  context.beginPath();
  context.arc(x, y, width / 2, 0, Math.PI * 2);
  context.fill();
}

function drawSegment(
  context: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number
) {
  context.strokeStyle = color.line.ink;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}
