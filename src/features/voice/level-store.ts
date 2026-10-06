/**
 * Tiny external store for the live speech level (0–1). Updated every animation frame
 * while the robot talks; only the face subscribes, so the rest of the kiosk never
 * re-renders at 60 fps.
 */
export interface LevelStore {
  get: () => number;
  set: (value: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createLevelStore(): LevelStore {
  let level = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => level,
    set: (value) => {
      const next = Math.round(Math.max(0, Math.min(1, value)) * 20) / 20;
      if (next === level) return;
      level = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
