// The cave recipes: what they cost, what they give, which chest unlocks them.
// Pure data. The Studio imports this, so only types and materials.ts here.

import type { GearKey } from "./wardrobe";
import type { MaterialId } from "./materials";
import type { Progress } from "./quests/types";

export type RecipeId = "recipe-isskjold" | "recipe-ishjelm";

export type Recipe = {
  id: RecipeId;
  name: string;
  // The chest that unlocks it (Progress.chests).
  chest: string;
  gear: GearKey;
  ingredients: { material: MaterialId; count: number }[];
  description: string;
};

export const RECIPES: Record<RecipeId, Recipe> = {
  "recipe-isskjold": {
    id: "recipe-isskjold",
    name: "Isskjold",
    chest: "cave-5",
    gear: "extra:shield",
    ingredients: [
      { material: "malm", count: 4 },
      { material: "isskar", count: 2 },
    ],
    description: "Et lett skjold av isskår, holdt sammen av gammel malm.",
  },
  "recipe-ishjelm": {
    id: "recipe-ishjelm",
    name: "Ishjelm",
    chest: "cave-10",
    gear: "hat:icehelm",
    ingredients: [
      { material: "malm", count: 6 },
      { material: "isskar", count: 4 },
    ],
    description: "En hjelm av is som aldri smelter.",
  },
};

// Floor 5 first.
export const RECIPE_IDS: RecipeId[] = ["recipe-isskjold", "recipe-ishjelm"];

export function isRecipeId(id: unknown): id is RecipeId {
  return typeof id === "string" && Object.hasOwn(RECIPES, id);
}

// Recipes whose chest is opened. Worked out, never stored.
export function unlockedRecipes(
  p: Partial<Pick<Progress, "chests">>,
): RecipeId[] {
  return RECIPE_IDS.filter((id) => p.chests?.[RECIPES[id].chest]);
}
