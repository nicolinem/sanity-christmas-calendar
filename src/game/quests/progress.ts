import type { Progress } from "./types";
import { EMPTY_PROGRESS, normalizeProgress } from "./progressMerge";

export { EMPTY_PROGRESS };

// Quest progress lives in the player's browser, one record per Sanity project,
// so switching projects (or running the demo) starts a fresh adventure. A copy
// is kept in the player's own project (progressBackup.ts), so another browser
// gets it back. Shaped for React's useSyncExternalStore: stable snapshots and
// a subscribe.

// One record per Sanity project, so a fresh project is a fresh start.
export const PROGRESS_PROJECT =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo";

// Set by `npm run setup -- --new` when the old project expired: the first time
// the new project has no progress, the old project's is copied over once.
export const PREVIOUS_PROJECT =
  process.env.NEXT_PUBLIC_SANITY_PREVIOUS_PROJECT_ID || null;

// Who you are on «Hvem er med». Your first project, so starting over with a
// new project doesn't make you a new player.
export const PLAYER_ID =
  process.env.NEXT_PUBLIC_WINTER_QUEST_PLAYER_ID || PROGRESS_PROJECT;

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
    const storage = window.localStorage;
    let raw = storage.getItem(storageKey(project));
    if (!raw && project === PROGRESS_PROJECT && PREVIOUS_PROJECT) {
      raw = storage.getItem(storageKey(PREVIOUS_PROJECT));
      // Saved under the new project, so the Studio sees it too.
      if (raw) storage.setItem(storageKey(project), raw);
    }
    if (raw) value = normalizeProgress(JSON.parse(raw)) ?? EMPTY_PROGRESS;
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
  const changed = change(before);
  if (changed === before) return;
  store(project, { ...changed, savedAt: new Date().toISOString() });
}

// Takes a merged copy from the backup as it is, without a new savedAt.
export function adoptProgress(project: string, next: Progress) {
  if (JSON.stringify(next) === JSON.stringify(readProgress(project))) return;
  store(project, next);
}

function store(project: string, next: Progress) {
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
    ).filter((key): key is string =>
      Boolean(
        key?.startsWith("winter-quest:code:") ||
        key?.startsWith("winter-quest:board:"),
      ),
    );
    drafts.forEach((key) => storage.removeItem(key));
  } catch {
    // Reset progress even when browser storage is unavailable.
  }
  // A new game: the backup's older game gives way to it (progressMerge.ts).
  updateProgress(project, () => ({
    ...EMPTY_PROGRESS,
    startedAt: new Date().toISOString(),
  }));
}
