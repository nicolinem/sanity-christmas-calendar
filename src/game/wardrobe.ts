// Gear (utstyr): figure options with an `unlock` label are earned in play,
// not freely chosen. This maps quests to the gear they give and strips gear
// the player doesn't own from a stored choice.
//
// Pure data, no DOM, so it runs anywhere (and in tests).

import { DEFAULT_FIGURE, FIGURE_OPTIONS, type FigureChoice } from "./figure";
import type { Progress } from "./quests/types";

export type GearKey = `${keyof FigureChoice}:${string}`;

const KEYS = Object.keys(FIGURE_OPTIONS) as (keyof FigureChoice)[];
const option = (key: keyof FigureChoice, id: string) =>
  FIGURE_OPTIONS[key].find((o) => o.id === id);

export function isGear(key: keyof FigureChoice, id: string): boolean {
  return !!option(key, id)?.unlock;
}

// The unlock label, for the UI ("Arkivarens spørsmål").
export function gearSource(
  key: keyof FigureChoice,
  id: string,
): string | undefined {
  return option(key, id)?.unlock;
}

// Every gear item with the given unlock label.
function gearWithSource(source: string): GearKey[] {
  return KEYS.flatMap((key) =>
    FIGURE_OPTIONS[key]
      .filter((o) => o.unlock === source)
      .map((o) => `${key}:${o.id}` as GearKey),
  );
}

// Quest id → the gear it gives. HIDDEN_GEAR has no source yet: it will be
// found out in the world later.
export const GEAR_REWARDS: Record<string, GearKey[]> = {
  "archive-questions": gearWithSource("Arkivarens spørsmål"),
};

// A whole week's core lukes on one track, technical and non-technical.
const WEEK_REWARDS: { gear: GearKey; tracks: string[][] }[] = [
  {
    gear: "scarf:scarf",
    tracks: [
      [
        "the-broken-forge",
        "branns-ledger",
        "the-guilds-law",
        "the-drawing-board",
      ],
      ["the-broken-forge", "weapon-description", "apprentice-mistake"],
    ],
  },
  {
    gear: "hat:crown",
    tracks: [
      ["baker-template", "baker-forge", "baker-function"],
      ["baker-model", "baker-sign", "morning-rush"],
    ],
  },
];

const ALL_GEAR: GearKey[] = KEYS.flatMap((key) =>
  FIGURE_OPTIONS[key]
    .filter((o) => o.unlock)
    .map((o) => `${key}:${o.id}` as GearKey),
);

// Gear from completed quests; in dev, all of it.
export function ownedGear(
  progress: Pick<Progress, "completed">,
  opts: { dev?: boolean } = {},
): Set<GearKey> {
  if (opts.dev) return new Set(ALL_GEAR);
  const owned = new Set<GearKey>();
  for (const [questId, gear] of Object.entries(GEAR_REWARDS)) {
    if (progress.completed[questId]) for (const g of gear) owned.add(g);
  }
  for (const { gear, tracks } of WEEK_REWARDS)
    if (tracks.some((ids) => ids.every((id) => progress.completed[id])))
      owned.add(gear);
  return owned;
}

// A copy where gear the player doesn't own is swapped for "none", else the
// default, else the first option that isn't gear.
export function wearable(
  choice: FigureChoice,
  owned: Set<GearKey>,
): FigureChoice {
  const out = { ...choice };
  for (const key of KEYS) {
    const id = out[key];
    if (!isGear(key, id) || owned.has(`${key}:${id}`)) continue;
    const free = FIGURE_OPTIONS[key].filter((o) => !o.unlock);
    out[key] =
      free.find((o) => o.id === "none")?.id ??
      free.find((o) => o.id === DEFAULT_FIGURE[key])?.id ??
      free[0]?.id ??
      id;
  }
  return out;
}
