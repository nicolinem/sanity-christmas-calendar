// Forging: a published Smiing points at a recipe; when the recipe is unlocked
// and the inventory has enough, the materials are taken and the Smiing is
// recorded in Progress.crafted. Pure, so it runs anywhere (and in tests).

import { addItems, MATERIALS, type MaterialId } from "./materials";
import { RECIPES, isRecipeId, unlockedRecipes, type RecipeId } from "./recipes";
import type { Progress } from "./quests/types";

export type Forging = { _id: string; name: string; recipe: string | null };

type Missing = { material: MaterialId; count: number }[];

export type RecipeState = {
  id: RecipeId;
  state: "done" | "missing" | "todo";
  missing: Missing;
};

// What the inventory lacks for a recipe, in the recipe's order.
export function missingFor(
  inventory: Record<string, number>,
  id: RecipeId,
): Missing {
  return RECIPES[id].ingredients
    .map(({ material, count }) => ({
      material,
      count: count - (inventory[material] ?? 0),
    }))
    .filter((m) => m.count > 0);
}

// "Mangler 3 Gammel malm og 2 Isskår"; "" when nothing is missing.
export function missingText(missing: Missing): string {
  if (missing.length === 0) return "";
  return `Mangler ${missing
    .map((m) => `${m.count} ${MATERIALS[m.material].name}`)
    .join(" og ")}`;
}

// "Gammel malm 3/4 · Isskår 2/2": what the inventory holds against the recipe.
export function ingredientLine(
  inventory: Record<string, number>,
  id: RecipeId,
): string {
  return RECIPES[id].ingredients
    .map(
      (i) =>
        `${MATERIALS[i.material].name} ${inventory[i.material] ?? 0}/${i.count}`,
    )
    .join(" · ");
}

// Forges what it can, in the order the forgings come. A recipe gives its gear
// once, and a forging is used once. Returns the same progress when nothing is
// forged.
export function applyForgings(
  p: Progress,
  forgings: Forging[],
): { progress: Progress; forged: { forging: Forging; recipe: RecipeId }[] } {
  let progress = p;
  const forged: { forging: Forging; recipe: RecipeId }[] = [];
  for (const forging of forgings) {
    const id = forging.recipe;
    if (!isRecipeId(id) || progress.crafted[forging._id]) continue;
    if (!unlockedRecipes(progress).includes(id)) continue;
    if (Object.values(progress.crafted).includes(id)) continue;
    if (missingFor(progress.inventory, id).length > 0) continue;
    progress = addItems(
      progress,
      RECIPES[id].ingredients.map((i) => ({ id: i.material, count: -i.count })),
    );
    progress = {
      ...progress,
      crafted: { ...progress.crafted, [forging._id]: id },
    };
    forged.push({ forging, recipe: id });
  }
  return { progress, forged };
}

// One row per unlocked recipe, for the forge in Ting. "missing" means a
// published Smiing waits for materials.
export function recipeStates(p: Progress, forgings: Forging[]): RecipeState[] {
  return unlockedRecipes(p).map((id) => {
    const missing = missingFor(p.inventory, id);
    if (Object.values(p.crafted).includes(id))
      return { id, state: "done", missing: [] };
    const published = forgings.some((f) => f.recipe === id);
    return {
      id,
      state: published && missing.length > 0 ? "missing" : "todo",
      missing,
    };
  });
}
