// One reward type for lukes, side quests, chests and monsters
// (docs/plan-utforsking.md). Rewards are worked out from facts the player has
// earned (a delivered side quest, an opened chest), never stored themselves,
// so a changed reward reaches everyone and nothing needs migrating.
//
// Phase 1 only reads `unlock` entries that start with "gear:". `xp` and
// `items` are written in the data now and counted once phase A lands.
//
// Pure data, no DOM, so it runs anywhere (and in tests).

export type Reward = {
  xp?: number;
  items?: { id: string; count: number }[]; // materials, defined in code
  unlock?: string[]; // "gear:hat:bobble", later "recipe:…", "area:…"
};

// The figure parts a reward unlocks, as "hat:bobble".
export function rewardGear(reward: Reward): string[] {
  return (reward.unlock ?? [])
    .filter((key) => key.startsWith("gear:"))
    .map((key) => key.slice("gear:".length));
}
