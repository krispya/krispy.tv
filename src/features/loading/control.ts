export type LoadingPhase = 'pending' | 'ready';

type Listener = () => void;

let phase: LoadingPhase = 'pending';
const listeners = new Set<Listener>();

/**
 * Imperative API for other features to drive the loading cover. The loading
 * feature itself is pure React; callers (e.g. the desk's ECS lifecycle)
 * project their own readiness state here.
 */
export const loadingControl = {
  get: (): LoadingPhase => phase,

  set: (next: LoadingPhase) => {
    if (next === phase) return;
    phase = next;
    for (const listener of listeners) listener();
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
