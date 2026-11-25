import { CHAPTERS } from "./quests/chapters";
import type { Progress } from "./quests/types";
import { XP_PER_BONUS_LUKE, XP_PER_LUKE } from "./rules";
import { SIDE_QUESTS } from "./sideQuests/data";

// XP is worked out from facts the player has earned, so a changed reward
// reaches everyone. Only monster XP is stored (Progress.xp). Lukes count over
// every chapter, not just the chosen track, so switching track loses nothing.
const LUKES = CHAPTERS.flatMap((chapter) => chapter.quests);

export function totalXp(
  progress: Pick<Progress, "completed" | "side" | "xp">,
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
  return lukes + side + progress.xp;
}
