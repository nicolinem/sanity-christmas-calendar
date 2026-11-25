import type { Progress } from "./quests/types";
import type { SpriteDef } from "./sprites";

export type MaterialId = "isskar" | "malm";

// Materials the player collects in the cave. Defined in code; the player's
// counts live in Progress.inventory.
export const MATERIALS: Record<
  MaterialId,
  { name: string; sprite: SpriteDef; description: string }
> = {
  isskar: {
    name: "Isskår",
    sprite: { sheet: "dungeon", frame: 56 },
    description: "Kald og klar. Brukes i smia senere.",
  },
  malm: {
    name: "Gammel malm",
    sprite: { sheet: "dungeon", frame: 42 },
    description: "Tung og rusten. Brukes i smia senere.",
  },
};

// Adds counts, rounding down and never going below zero.
export function addItems(
  progress: Progress,
  items: { id: string; count: number }[],
): Progress {
  const inventory = { ...progress.inventory };
  for (const { id, count } of items) {
    inventory[id] = Math.max(0, Math.floor((inventory[id] ?? 0) + count));
  }
  return { ...progress, inventory };
}
