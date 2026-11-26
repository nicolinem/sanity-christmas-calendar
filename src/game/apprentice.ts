import type { GameItemView } from "./items";

export const APPRENTICE_ITEM_ID = "item-brann-anvil-hammer";

export const BRANN_HAMMER = {
  _id: APPRENTICE_ITEM_ID,
  _type: "item" as const,
  name: "Brann sin hammer",
  kind: "weapon",
  description:
    "En solid smiehammer som Brann bruker til å forme våpen for vinteren.",
  sprite: "hammer",
};

export const APPRENTICE_MISTAKE = {
  name: "Bran sin hemmer",
  description: "banan banan helt feil",
  sprite: "hand-axe",
};

// Sanity keeps history for 3 days on the Free plan. A hammer seeded longer ago
// may have lost its right revision, so the route writes both again. Not when
// it's already right, or while the player has a draft from the last two days.
const FRESH_MS = 2 * 24 * 60 * 60 * 1000;
type RawHammer = {
  _updatedAt?: string;
  name?: string;
  description?: string;
  sprite?: string;
} | null;
const isRightHammer = (doc: RawHammer) =>
  doc?.name === BRANN_HAMMER.name &&
  doc.description === BRANN_HAMMER.description &&
  doc.sprite === BRANN_HAMMER.sprite;
const ageOf = (doc: RawHammer, now: number) =>
  now - Date.parse(doc?._updatedAt ?? "") || Infinity;
export function needsFreshHistory(
  published: RawHammer,
  draft: RawHammer,
  now: number,
): boolean {
  if (!published || isRightHammer(published) || isRightHammer(draft))
    return false;
  if (draft && ageOf(draft, now) < FRESH_MS) return false;
  return ageOf(published, now) >= FRESH_MS;
}

export const isRestoredHammer = (item: GameItemView | undefined) =>
  item?.id === APPRENTICE_ITEM_ID &&
  item.name === BRANN_HAMMER.name &&
  item.description === BRANN_HAMMER.description &&
  item.spriteId === BRANN_HAMMER.sprite;
