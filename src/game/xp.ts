import { CHAPTERS } from "./quests/chapters";
import { forgeLevelFor } from "./quests/engine";
import type { Chapter, Progress } from "./quests/types";
import { levelForXp, XP_PER_BONUS_LUKE, XP_PER_LUKE } from "./rules";
import { SIDE_QUESTS } from "./sideQuests/data";

// XP is worked out from facts the player has earned, so a changed reward
// reaches everyone. Only monster XP is stored (Progress.xp). Lukes count over
// every chapter, not just the chosen track, so switching track loses nothing.
const LUKES = CHAPTERS.flatMap((chapter) => chapter.quests);

// XP for cave facts (bosses beaten, chests opened). The floor-5 chest gives
// armour only.
export const CAVE_FACT_XP = {
  bosses: { yeti: 100, drake: 100 },
  chests: { "cave-10": 100 },
} as const;

export function totalXp(
  progress: Pick<Progress, "completed" | "side" | "xp"> &
    Partial<Pick<Progress, "bosses" | "chests">>,
): number {
  const lukes = LUKES.reduce(
    (sum, quest) =>
      progress.completed[quest.id]
        ? sum + (quest.bonus ? XP_PER_BONUS_LUKE : XP_PER_LUKE)
        : sum,
    0,
  );
  const side = SIDE_QUESTS.reduce(
    (sum, quest) =>
      progress.side[quest.id]?.done ? sum + (quest.reward.xp ?? 0) : sum,
    0,
  );
  const cave = (
    Object.keys(CAVE_FACT_XP) as (keyof typeof CAVE_FACT_XP)[]
  ).reduce(
    (sum, kind) =>
      Object.entries(CAVE_FACT_XP[kind]).reduce(
        (inner, [id, xp]) => (progress[kind]?.[id] ? inner + xp : inner),
        sum,
      ),
    0,
  );
  return lukes + side + cave + progress.xp;
}

// With the rpg flag off the level is the forge level (lukes only, max 4);
// with it on, it comes from XP (max 10).
export function playerLevel(
  chapters: Chapter[],
  progress: Progress,
  rpg: boolean,
): number {
  return rpg
    ? levelForXp(totalXp(progress))
    : forgeLevelFor(chapters, progress);
}
