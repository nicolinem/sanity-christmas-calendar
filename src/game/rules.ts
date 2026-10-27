// Game rules. Sanity describes what an item is (its name, kind, sprite); this
// file decides what it can do. Nothing here is editable from the Studio, so
// there is no number to inflate: every forged weapon hits as hard as Brann's
// forge allows, and the forge grows as the player completes quests.
//
// What makes one weapon better than another is its name: the element it
// carries matters against some foes (name magic, coming in phase 2).
//
// No imports from Phaser or React, so the Studio can read this too.

// Damage a forged weapon deals at each forge level, before combat variance.
export const FORGE_DAMAGE = [4, 6, 8, 10] as const;

export const MAX_FORGE_LEVEL = FORGE_DAMAGE.length;

export function clampForgeLevel(level: number) {
  return Math.min(MAX_FORGE_LEVEL, Math.max(1, Math.floor(level)));
}

export type Power = {
  damage: number; // what combat uses
};

// How hard a weapon forged in Sanity hits at the given forge level.
export function forgedPower(forgeLevel: number): Power {
  return { damage: FORGE_DAMAGE[clampForgeLevel(forgeLevel) - 1] };
}
