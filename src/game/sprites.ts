// A small, safe sprite registry. Sanity can only *select* a spriteId from this
// known set — it can never point at an arbitrary file or run code. Unknown or
// missing ids fall back to a per-kind sprite, and finally a generic one, so
// a brand new item is always representable in the game.
//
// Sprites are 16×16 frames from Kenney's CC0 Tiny Dungeon / Town / Farm / Ski sheets
// (public/assets). The same definition is drawn by Phaser in the world and by
// CSS in the HUD, so an item looks identical in the knight's hand and in a slot.

export type SpriteCategory = "weapon" | "material" | "potion" | "creature";
export type ItemKind = Exclude<SpriteCategory, "creature">;
export type SpriteSheet =
  "dungeon" | "town" | "farm" | "ski" | "cave" | "caveDeep";

export type SpriteDef = {
  sheet: SpriteSheet;
  frame: number;
};

export const TILE = 16;

export const SHEETS: Record<
  SpriteSheet,
  { url: string; cols: number; rows: number }
> = {
  dungeon: { url: "/assets/kenney/tiny-dungeon.png", cols: 12, rows: 11 },
  // Tiny Town with snow palette-swapped in (scripts/winterize-tiles.py).
  town: { url: "/assets/winter-town.png", cols: 12, rows: 11 },
  // Tiny Farm (sacks, crates, bread) and Tiny Ski (snow creatures, snowman).
  farm: { url: "/assets/kenney/tiny-farm.png", cols: 12, rows: 11 },
  ski: { url: "/assets/kenney/tiny-ski.png", cols: 12, rows: 11 },
  // Tiny Dungeon with icy floor and (deep) grey walls (scripts/winterize-tiles.py).
  cave: { url: "/assets/winter-cave.png", cols: 12, rows: 11 },
  caveDeep: { url: "/assets/winter-cave-deep.png", cols: 12, rows: 11 },
};

const d = (frame: number): SpriteDef => ({ sheet: "dungeon", frame });
const t = (frame: number): SpriteDef => ({ sheet: "town", frame });

const SPRITE_REGISTRY: Record<string, SpriteDef> = {
  // weapons
  "wooden-sword": d(107),
  sword: d(104),
  dagger: d(103),
  longsword: d(105),
  greatsword: d(106),
  axe: d(118),
  "hand-axe": d(119),
  hammer: d(117),
  spear: d(131),
  "staff-amethyst": d(129),
  "staff-frost": d(130),
  bow: t(118),
  pickaxe: t(115),
  // materials & gear
  "ice-cube": d(56),
  gem: d(56),
  potion: d(115),
  "potion-frost": d(116),
  "potion-green": d(114),
  shield: d(102),
  "round-shield": d(101),
  key: t(117),
  chest: d(89),
  barrel: d(82),
  // creatures
  dragon: d(110),
  snowman: d(121),
  wolf: d(124),
  rat: d(123),
  bat: d(120),
  spider: d(122),
  slime: d(108),
  ghost: d(121),
};

// Item roles are data, not inferred from the art. The picker uses this same
// allowlist, and the game can reject incompatible Sanity data independently
// of Studio validation. Tools such as a pickaxe are non-weapons here.
export const WEAPON_SPRITE_IDS = [
  "wooden-sword",
  "sword",
  "dagger",
  "longsword",
  "greatsword",
  "axe",
  "hand-axe",
  "hammer",
  "spear",
  "staff-amethyst",
  "staff-frost",
  "bow",
] as const;

const CREATURE_SPRITE_IDS = [
  "dragon",
  "snowman",
  "wolf",
  "rat",
  "bat",
  "spider",
  "slime",
  "ghost",
] as const;

const weaponSpriteIds = new Set<string>(WEAPON_SPRITE_IDS);
const creatureSpriteIds = new Set<string>(CREATURE_SPRITE_IDS);
export const OTHER_ITEM_SPRITE_IDS = Object.keys(SPRITE_REGISTRY).filter(
  (id) => !weaponSpriteIds.has(id) && !creatureSpriteIds.has(id),
);

export const ITEM_SPRITE_IDS_BY_KIND: Record<ItemKind, readonly string[]> = {
  weapon: WEAPON_SPRITE_IDS,
  material: OTHER_ITEM_SPRITE_IDS,
  potion: OTHER_ITEM_SPRITE_IDS,
};

export function spriteIdsForItemKind(kind: unknown): readonly string[] {
  if (typeof kind !== "string" || !Object.hasOwn(ITEM_SPRITE_IDS_BY_KIND, kind))
    return [];
  return ITEM_SPRITE_IDS_BY_KIND[kind as ItemKind];
}

export function isSpriteAllowedForKind(
  spriteId: string | null | undefined,
  kind: unknown,
): boolean {
  return !spriteId || spriteIdsForItemKind(kind).includes(spriteId);
}

const CATEGORY_FALLBACK: Record<SpriteCategory, SpriteDef> = {
  weapon: d(103),
  material: d(89),
  potion: d(113),
  creature: d(108),
};

const DEFAULT_SPRITE: SpriteDef = d(113);

// Resolve a sprite for an item, always returning *something* renderable.
export function resolveSprite(
  spriteId: string | null | undefined,
  kind: string | null | undefined,
): SpriteDef {
  if (spriteId && SPRITE_REGISTRY[spriteId]) {
    return SPRITE_REGISTRY[spriteId];
  }
  if (kind && kind in CATEGORY_FALLBACK) {
    return CATEGORY_FALLBACK[kind as SpriteCategory];
  }
  return DEFAULT_SPRITE;
}

// Known but incompatible art falls back to the item's kind. Unknown IDs retain
// the existing per-kind fallback behavior.
export function resolveItemSprite(
  spriteId: string | null | undefined,
  kind: string | null | undefined,
): SpriteDef {
  if (hasKnownSprite(spriteId) && !isSpriteAllowedForKind(spriteId, kind))
    return resolveSprite(undefined, kind);
  return resolveSprite(spriteId, kind);
}

// True when the game has a dedicated sprite for this id (used to hint the player
// that an unknown spriteId fell back to a generic icon).
export function hasKnownSprite(spriteId: string | null | undefined): boolean {
  return Boolean(spriteId && SPRITE_REGISTRY[spriteId]);
}

export const KNOWN_SPRITE_IDS = Object.keys(SPRITE_REGISTRY);

export const CAVE_SHEETS: SpriteSheet[] = ["cave", "caveDeep"];
export const VILLAGE_SHEETS = (Object.keys(SHEETS) as SpriteSheet[]).filter(
  (k) => !CAVE_SHEETS.includes(k),
);
