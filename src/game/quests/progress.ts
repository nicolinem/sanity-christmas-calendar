import type { Progress } from "./types";

// Quest progress lives in the player's browser, one record per Sanity project,
// so switching projects (or running the demo) starts a fresh adventure.
// Shaped for React's useSyncExternalStore: stable snapshots and a subscribe.

export const EMPTY_PROGRESS: Progress = {
  metBlacksmith: false,
  wraithDefeated: false,
  completed: {},
  briefed: {},
  hints: {},
  struck: {},
};

const storageKey = (project: string) => `winter-quest:progress:${project}`;

let cache: { project: string; value: Progress } | null = null;
const listeners = new Set<() => void>();

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readProgress(project: string): Progress {
  if (cache?.project === project) return cache.value;
  let value = EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(storageKey(project));
    if (raw) value = { ...EMPTY_PROGRESS, ...JSON.parse(raw) };
  } catch {
    // Private mode or blocked storage: play on, progress just won't stick.
  }
  cache = { project, value };
  return value;
}

export function updateProgress(project: string, change: (p: Progress) => Progress) {
  const before = readProgress(project);
  const next = change(before);
  if (next === before) return;
  cache = { project, value: next };
  try {
    window.localStorage.setItem(storageKey(project), JSON.stringify(next));
  } catch {
    // See readProgress.
  }
  listeners.forEach((l) => l());
}

// Starts over: used by the quest log's "Reset progress".
export function resetProgress(project: string) {
  updateProgress(project, () => EMPTY_PROGRESS);
}
