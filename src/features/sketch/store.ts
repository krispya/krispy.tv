import { useSyncExternalStore } from 'react';

/**
 * Texture store for page drawings, keyed by page id. Holds PNG data URLs in
 * memory (mirrored to localStorage so drawings survive reloads) and notifies
 * subscribers so views like the desk paper can re-render after a save.
 */

const STORAGE_PREFIX = 'sketch-texture:';

/** `null` means "known empty" so we don't re-read storage on every get. */
const textures = new Map<string, string | null>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStorage(id: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + id);
  } catch {
    return null;
  }
}

export function getSketchTexture(id: string): string | null {
  if (!textures.has(id)) {
    textures.set(id, readStorage(id));
  }

  return textures.get(id) ?? null;
}

export function saveSketchTexture(id: string, dataUrl: string) {
  textures.set(id, dataUrl);

  try {
    localStorage.setItem(STORAGE_PREFIX + id, dataUrl);
  } catch {
    // Quota or privacy-mode failure — the in-memory texture still works for
    // this session.
  }

  emit();
}

export function clearSketchTexture(id: string) {
  textures.set(id, null);

  try {
    localStorage.removeItem(STORAGE_PREFIX + id);
  } catch {
    // Ignore storage failures; memory state is authoritative for the session.
  }

  emit();
}

export function subscribeSketchTextures(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSketchTexture(id: string): string | null {
  return useSyncExternalStore(subscribeSketchTextures, () => getSketchTexture(id));
}
