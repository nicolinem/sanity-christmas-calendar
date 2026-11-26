import { normalizeAbout } from "../about";
import type { Progress, SideRecord } from "./types";

// Reading a saved progress record and merging two copies of one. Pure, so the
// browser (progress.ts) and the backup route (src/app/api/progress) share it.

// The backup document in the player's project. The dot keeps it out of
// token-less reads, so a public dataset doesn't show it to others.
export const PROGRESS_DOC_ID = "winter-quest.progress";
export const PROGRESS_DOC_TYPE = "playerProgress";

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
  studioTypes: {},
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

// The same progress gives the same string, whatever order its keys are in.
export function progressJson(progress: Progress): string {
  return JSON.stringify(progress, (_, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : value,
  );
}

// A saved record (parsed JSON) as Progress, or null if it isn't an object.
export function normalizeProgress(raw: unknown): Progress | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const saved = { ...raw } as Partial<Progress> & {
    skipped?: unknown;
    studioConfirmed?: unknown;
  };
  delete saved.skipped;
  delete saved.studioConfirmed;
  const value: Progress = {
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
      typeof saved.sharePrompted === "boolean" ? saved.sharePrompted : false,
    seenGear: record<true>(saved.seenGear),
    studioTypes: facts(saved.studioTypes),
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
  if (typeof value.savedAt !== "string") delete value.savedAt;
  if (typeof value.startedAt !== "string") delete value.startedAt;
  if (typeof value.lookAt !== "string") delete value.lookAt;
  if (typeof value.shareAt !== "string") delete value.shareAt;
  const about = normalizeAbout(saved.about);
  if (about) value.about = about;
  else delete value.about;
  return value;
}

// Each side's entries, the first time wins where both have one.
function earliest(a: Record<string, string>, b: Record<string, string>) {
  const out = { ...a };
  for (const [key, at] of Object.entries(b))
    if (!out[key] || at < out[key]) out[key] = at;
  return out;
}

function most(a: Record<string, number>, b: Record<string, number>) {
  const out = { ...a };
  for (const [key, n] of Object.entries(b))
    out[key] = Math.max(out[key] ?? 0, n);
  return out;
}

// A delivered side quest beats one in progress, and a later step an earlier.
function furthest(
  a: Record<string, SideRecord>,
  b: Record<string, SideRecord>,
) {
  const out = { ...a };
  for (const [key, r] of Object.entries(b)) {
    const o = out[key];
    if (!o || (r.done && !o.done) || (!o.done === !r.done && r.step > o.step))
      out[key] = r;
  }
  return out;
}

// Two copies of the same player's progress (this browser and the backup).
//
// A newer game («Nytt spill») replaces an older one whole. Within one game
// nothing earned is taken back: lukes, hints, finds and the rest are kept from
// both. Choices that can change (track, figure, sharing, the cave bag) come
// from the copy saved last, unless that copy hasn't made the choice yet, as
// in a fresh browser that hasn't fetched the backup.
export function mergeProgress(a: Progress, b: Progress): Progress {
  const game = (p: Progress) => p.startedAt ?? "";
  if (game(a) !== game(b)) return game(a) > game(b) ? a : b;
  const [newer, older] =
    (b.savedAt ?? "") > (a.savedAt ?? "") ? [b, a] : [a, b];
  const madeBy = (has: (p: Progress) => unknown) =>
    has(newer) || !has(older) ? newer : older;
  // The copy where this choice was made last, if both have a time for it.
  const latest = (at: (p: Progress) => string | undefined) =>
    (at(a) ?? "") === (at(b) ?? "")
      ? null
      : (at(a) ?? "") > (at(b) ?? "")
        ? a
        : b;
  const track = madeBy((p) => p.trackChosen);
  // Figure, name and Om meg, and sharing, follow when they were last chosen, so a
  // browser that hasn't heard yet can't bring a removed figure back or switch
  // sharing on again. Older saves have no times: there, the copy with a
  // figure, and sharing only if both copies say yes.
  const look = latest((p) => p.lookAt) ?? madeBy((p) => p.figure);
  const shared = latest((p) => p.shareAt);
  const sharing = shared ?? madeBy((p) => p.sharePrompted);
  const shareProfile = shared
    ? shared.shareProfile
    : sharing.shareProfile &&
      (!a.sharePrompted ||
        !b.sharePrompted ||
        a.shareProfile === b.shareProfile);
  const cave = madeBy((p) => p.deepest > 0);

  const merged: Progress = {
    ...newer,
    track: track.track,
    trackChosen: a.trackChosen || b.trackChosen,
    figure: look.figure,
    name: look.name,
    about: look.about,
    lookAt: look.lookAt,
    shareProfile,
    shareHints: sharing.shareHints,
    shareAt: sharing.shareAt,
    sharePrompted: a.sharePrompted || b.sharePrompted,
    metBlacksmith: a.metBlacksmith || b.metBlacksmith,
    wraithDefeated: a.wraithDefeated || b.wraithDefeated,
    introSeen: a.introSeen || b.introSeen,
    completed: earliest(a.completed, b.completed),
    briefed: { ...older.briefed, ...newer.briefed },
    fetched: { ...older.fetched, ...newer.fetched },
    hints: most(a.hints, b.hints),
    struck: { ...older.struck, ...newer.struck },
    solved: { ...older.solved, ...newer.solved },
    weeksSeen: { ...older.weeksSeen, ...newer.weeksSeen },
    seenGear: { ...older.seenGear, ...newer.seenGear },
    studioTypes: { ...older.studioTypes, ...newer.studioTypes },
    side: furthest(older.side, newer.side),
    found: { ...older.found, ...newer.found },
    bosses: { ...older.bosses, ...newer.bosses },
    chests: { ...older.chests, ...newer.chests },
    xp: Math.max(a.xp, b.xp),
    crafted: { ...older.crafted, ...newer.crafted },
    deepest: Math.max(a.deepest, b.deepest),
    inventory: cave.inventory,
    trip: cave.trip,
    inCave: cave.inCave,
    bakeryOrderId: newer.bakeryOrderId ?? older.bakeryOrderId,
    weaponDescriptionItemId:
      newer.weaponDescriptionItemId ?? older.weaponDescriptionItemId,
    weaponDescriptionBefore:
      newer.weaponDescriptionItemId !== undefined
        ? newer.weaponDescriptionBefore
        : older.weaponDescriptionBefore,
  };
  // Left out rather than kept as undefined, so equal copies compare equal.
  for (const key of Object.keys(merged) as (keyof Progress)[])
    if (merged[key] === undefined) delete merged[key];
  return merged;
}
