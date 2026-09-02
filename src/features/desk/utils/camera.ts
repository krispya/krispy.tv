import type { TraitRecord, World } from 'koota';
import { Camera, Viewport } from '../traits/index.js';
import { clamp01, lerp } from './math.js';
import { cssPixelsToMeters } from './physics-units.js';

export const DESK_CAMERA_REFERENCE_WIDTH = 1440;
export const DESK_CAMERA_REFERENCE_HEIGHT = 900;
export const DESK_CAMERA_MIN_ZOOM = 0.62;
export const DESK_CAMERA_MAX_ZOOM = 0.92;
export const DESK_CAMERA_MIN_ZOOM_WIDTH = 390;
export const DESK_CAMERA_MAX_ZOOM_WIDTH = DESK_CAMERA_REFERENCE_WIDTH;

export type CameraRecord = TraitRecord<typeof Camera>;
export type ViewportRecord = TraitRecord<typeof Viewport>;

export type VisibleDeskRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

export type DeskPoint = {
  x: number;
  y: number;
};

export const DEFAULT_CAMERA: CameraRecord = {
  x: DESK_CAMERA_REFERENCE_WIDTH / 2,
  y: DESK_CAMERA_REFERENCE_HEIGHT / 2,
  zoom: 1,
};

export function getResponsiveDeskZoom(viewportWidth: number) {
  const width = Math.max(0, Number.isFinite(viewportWidth) ? viewportWidth : 0);
  const amount = clamp01(
    (width - DESK_CAMERA_MIN_ZOOM_WIDTH) / (DESK_CAMERA_MAX_ZOOM_WIDTH - DESK_CAMERA_MIN_ZOOM_WIDTH)
  );

  return lerp(DESK_CAMERA_MIN_ZOOM, DESK_CAMERA_MAX_ZOOM, amount);
}

/**
 * Mirrors the window size into the world and picks the responsive zoom for it.
 * Used on boot (before corner-anchored items spawn) and on every resize.
 */
export function syncViewportToWindow(world: World) {
  if (typeof window === 'undefined') return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = world.get(Camera) ?? DEFAULT_CAMERA;

  world.set(Viewport, { width, height });
  world.set(Camera, { x: camera.x, y: camera.y, zoom: getResponsiveDeskZoom(width) });
}

export function getVisibleDeskRect(
  viewport: ViewportRecord | undefined,
  camera: CameraRecord | undefined = DEFAULT_CAMERA
): VisibleDeskRect {
  const fallbackWidth = typeof window === 'undefined' ? 0 : window.innerWidth;
  const fallbackHeight = typeof window === 'undefined' ? 0 : window.innerHeight;
  const width = Math.max(0, viewport?.width || fallbackWidth);
  const height = Math.max(0, viewport?.height || fallbackHeight);
  const zoom = Math.max(0.001, camera?.zoom ?? DEFAULT_CAMERA.zoom);
  const visibleWidth = width / zoom;
  const visibleHeight = height / zoom;
  const centerX = camera?.x ?? DEFAULT_CAMERA.x;
  const centerY = camera?.y ?? DEFAULT_CAMERA.y;
  const x = centerX - visibleWidth / 2;
  const y = centerY - visibleHeight / 2;

  return {
    x,
    y,
    width: visibleWidth,
    height: visibleHeight,
    right: x + visibleWidth,
    bottom: y + visibleHeight,
  };
}

export function getVisibleDeskRectForWorld(world: World) {
  const viewport = world.get(Viewport);
  const camera = world.get(Camera);

  return getVisibleDeskRect(viewport, camera);
}

export function screenPointToDeskPoint(
  screenX: number,
  screenY: number,
  viewport: ViewportRecord | undefined,
  camera: CameraRecord | undefined = DEFAULT_CAMERA
): DeskPoint {
  const rect = getVisibleDeskRect(viewport, camera);
  const zoom = Math.max(0.001, camera?.zoom ?? DEFAULT_CAMERA.zoom);

  return {
    x: rect.x + screenX / zoom,
    y: rect.y + screenY / zoom,
  };
}

export function screenPointToDeskMeters(
  screenX: number,
  screenY: number,
  viewport: ViewportRecord | undefined,
  camera: CameraRecord | undefined = DEFAULT_CAMERA
) {
  const point = screenPointToDeskPoint(screenX, screenY, viewport, camera);

  return {
    x: cssPixelsToMeters(point.x),
    y: cssPixelsToMeters(point.y),
  };
}

export function screenPointToDeskMetersForWorld(world: World, screenX: number, screenY: number) {
  return screenPointToDeskMeters(screenX, screenY, world.get(Viewport), world.get(Camera));
}
