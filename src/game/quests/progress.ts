import type { Progress } from "./types";

// Quest progress lives in the player's browser, one record per Sanity project,
// so switching projects (or running the demo) starts a fresh adventure.
// Shaped for React's useSyncExternalStore: stable snapshots and a subscribe.

export const EMPTY_PROGRESS: Progress = {
  track: "technical",
  metBlacksmith: false,
  wraithDefeated: false,
  completed: {},
  briefed: {},
  hints: {},
  struck: {},
  introSeen: false,
  solved: {},
  weeksSeen: {},
};

// One record per Sanity project, so a fresh project is a fresh start.
export const PROGRESS_PROJECT =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo";

// Exported for the Studio, which reads `solved` from the same record.
export const storageKey = (project: string) =>
  `winter-quest:progress:${project}`;

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
    if (raw) {
      const saved = JSON.parse(raw) as
        (Partial<Progress> & { skipped?: unknown }) | null;
      if (saved && typeof saved === "object") {
        delete saved.skipped;
        delete (saved as Partial<Progress> & { studioConfirmed?: unknown }).studioConfirmed;
        value = {
          ...EMPTY_PROGRESS,
          ...saved,
          track: saved.track === "nonTechnical" ? "nonTechnical" : "technical",
        };
      }
    }
  } catch {
    // Private mode or blocked storage: play on, progress just won't stick.
  }
  cache = { project, value };
  return value;
}

export function updateProgress(
  project: string,
  change: (p: Progress) => Progress,
) {
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
  try {
    const storage = window.localStorage;
    const drafts = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index),
    ).filter((key): key is string => key?.startsWith("winter-quest:code:") ?? false);
    drafts.forEach((key) => storage.removeItem(key));
  } catch {
    // Reset progress even when browser storage is unavailable.
  }
  updateProgress(project, () => EMPTY_PROGRESS);
}
