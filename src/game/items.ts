import type { SanityItem } from "@/sanity/queries";
import { resolveSprite, hasKnownSprite, type SpriteDef } from "./sprites";
import { forgedPower, type Power } from "./rules";
import { readName, type NameMagic } from "./magic";

export type ItemKind = "weapon" | "material" | "potion";

// The game-side view of an item: the raw content plus a resolved sprite, the
// power the rules grant it, and a `source` so the UI can tell Sanity-created
// content from the built-in baseline that keeps the game playable.
export type GameItemView = {
  id: string;
  name: string;
  kind: ItemKind | null; // null when the document has no (or an unknown) kind
  power: Power | null; // what a weapon hits for; null for non-weapons
  magic: NameMagic; // the element a weapon's name carries (src/game/magic.ts)
  description: string | null;
  forgedAt: string | null;
  spriteId: string | null;
  sprite: SpriteDef;
  knownSprite: boolean;
  source: "sanity" | "builtin";
};

const KINDS: readonly string[] = ["weapon", "material", "potion"];

// Sanity weapons hit as hard as the forge allows. Built-ins carry their own,
// hand-tuned damage instead.
export function toGameItem(raw: SanityItem, forgeLevel: number): GameItemView {
  return build(raw, "sanity", forgedPower(forgeLevel));
}

function builtin(raw: SanityItem, damage: number | null): GameItemView {
  return build(raw, "builtin", damage == null ? null : { damage });
}

function build(
  raw: SanityItem,
  source: GameItemView["source"],
  weaponPower: Power | null,
): GameItemView {
  const kind = KINDS.includes(raw.kind ?? "") ? (raw.kind as ItemKind) : null;
  const name = raw.name?.trim() || "Nameless thing";
  return {
    id: raw.id,
    name,
    kind,
    power: kind === "weapon" ? weaponPower : null,
    magic: kind === "weapon" && source === "sanity" ? readName(name) : { kind: "none" },
    description: raw.description,
    forgedAt: raw.forgedAt ?? null,
    spriteId: raw.spriteId,
    sprite: resolveSprite(raw.spriteId, kind),
    knownSprite: hasKnownSprite(raw.spriteId),
    source,
  };
}

// Always-available baseline so the knight is never defenceless and combat works
// even before anyone has published a weapon. "Bare Fists" is a built-in weapon.
export const BUILTIN_ITEMS: GameItemView[] = [
  builtin(
    {
      id: "builtin-fists",
      name: "Bare Fists",
      kind: "weapon",
      spriteId: null,
      description: "No weapon equipped. Forge something better in Sanity!",
    },
    1,
  ),
];

// Extra demo items shown only when Sanity isn't configured yet, so a fresh
// clone still has something to look at (and still demonstrates sprite fallback).
export const DEMO_ITEMS: GameItemView[] = [
  builtin(
    {
      id: "demo-wooden-sword",
      name: "Wooden Sword",
      kind: "weapon",
      spriteId: "wooden-sword",
      description: "A sturdy training blade.",
    },
    3,
  ),
  builtin(
    {
      id: "demo-ice-cube",
      name: "Ice Cube",
      kind: "material",
      spriteId: "ice-cube",
      description: "Cold. Mysterious. No special power… yet.",
    },
    null,
  ),
];

export function isUsableWeapon(item: GameItemView | null): boolean {
  return Boolean(
    item && item.kind === "weapon" && (item.power?.damage ?? 0) > 0,
  );
}
