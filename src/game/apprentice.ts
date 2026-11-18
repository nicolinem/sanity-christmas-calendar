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

export const isRestoredHammer = (item: GameItemView | undefined) =>
  item?.id === APPRENTICE_ITEM_ID &&
  item.name === BRANN_HAMMER.name &&
  item.description === BRANN_HAMMER.description &&
  item.spriteId === BRANN_HAMMER.sprite;
