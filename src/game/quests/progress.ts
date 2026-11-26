import { normalizeAbout } from "../about";
import type { Progress } from "./types";

// Quest progress lives in the player's browser, one record per Sanity project,
// so switching projects (or running the demo) starts a fresh adventure.
// Shaped for React's useSyncExternalStore: stable snapshots and a subscribe.

export const EMPTY_PROGRESS: Progress = {
  track: "technical",
  trackChosen: false,
  shareProfile: false,
  sharePrompted: false,
  shareHints: true,
  metBlacksmith: false,
  wraithDefeated: false,
  completed: {},
  briefed: {},
  fetched: {},
  hints: {},
  struck: {},
  introSeen: false,
  solved: {},
  weeksSeen: {},
  seenGear: {},
  side: {},
  found: {},
  bosses: {},
  chests: {},
  xp: 0,
  inventory: {},
  crafted: {},
  deepest: 0,
  trip: {},
};

// A stored record that is a plain object, else an empty one.
function record<T>(value: unknown): Record<string, T> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, T>)
    : {};
}

// A stored count map keeping only whole numbers >= 0.
function counts(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record<unknown>(value)).filter(
      ([, count]) => Number.isInteger(count) && (count as number) >= 0,
    ),
  ) as Record<string, number>;
}

// A stored map keeping only string values.
function strings(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record<unknown>(value)).filter(
      ([, v]) => typeof v === "string",
    ),
  ) as Record<string, string>;
}

// A stored fact map keeping only entries that are exactly true.
function facts(value: unknown): Record<string, true> {
  return Object.fromEntries(
    Object.entries(record<unknown>(value)).filter(([, v]) => v === true),
  ) as Record<string, true>;
}

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
    if (raw) {
      const saved = JSON.parse(raw) as
        (Partial<Progress> & { skipped?: unknown }) | null;
      if (saved && typeof saved === "object") {
        delete saved.skipped;
        delete (saved as Partial<Progress> & { studioConfirmed?: unknown })
          .studioConfirmed;
        value = {
          ...EMPTY_PROGRESS,
          ...saved,
          track: saved.track === "nonTechnical" ? "nonTechnical" : "technical",
          // Existing records belonged to players who had already entered the game.
          // Keep them out of first-run onboarding, but never infer sharing consent.
          trackChosen:
            typeof saved.trackChosen === "boolean" ? saved.trackChosen : true,
          shareProfile: saved.shareProfile === true,
          shareHints: saved.shareHints !== false,
          sharePrompted:
            typeof saved.sharePrompted === "boolean"
              ? saved.sharePrompted
              : false,
          seenGear: record<true>(saved.seenGear),
          side: record(saved.side),
          found: record<true>(saved.found),
          bosses: facts(saved.bosses),
          chests: facts(saved.chests),
          xp:
            typeof saved.xp === "number" && Number.isFinite(saved.xp)
              ? Math.max(0, saved.xp)
              : 0,
          inventory: counts(saved.inventory),
          trip: counts(saved.trip),
          crafted: strings(saved.crafted),
          deepest:
            Number.isInteger(saved.deepest) && (saved.deepest as number) >= 0
              ? (saved.deepest as number)
              : 0,
        };
        // Only a literal true counts; anything else is removed, not kept as undefined.
        if (value.inCave !== true) delete value.inCave;
        const about = normalizeAbout(saved.about);
        if (about) value.about = about;
        else delete value.about;
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
  updateProgress(project, () => EMPTY_PROGRESS);
}
