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
export const FORGE_DAMAGE = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

export const MAX_FORGE_LEVEL = FORGE_DAMAGE.length;

export const MAX_LEVEL = 10;

// The cap for level from luke quests when FEATURES.rpg is off.
export const LUKE_LEVEL_CAP = 4;

export const XP_PER_LUKE = 100;
export const XP_PER_BONUS_LUKE = 50;

// Total XP needed to reach a level: each level needs 100 more than the last.
export function totalXpForLevel(level: number) {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number) {
  const safe = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  let level = 1;
  while (level < MAX_LEVEL && totalXpForLevel(level + 1) <= safe) level++;
  return level;
}

export function xpProgress(xp: number) {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return { level, into: 0, needed: 0 };
  const safe = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  const base = totalXpForLevel(level);
  return {
    level,
    into: safe - base,
    needed: totalXpForLevel(level + 1) - base,
  };
}

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
