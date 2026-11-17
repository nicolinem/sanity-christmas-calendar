import { NPCS, type Npc } from "../village";

// What a luke is called in the UI: its number, or «☆ Frivillig» for the
// optional one, which has no place in the week's count.
export function lukeName(quest: { door: number; bonus?: true }): string {
  return quest.bonus ? "☆ Frivillig" : `Luke ${quest.door}`;
}

// The week's numbered lukes first, the optional ones after.
export function coreFirst<T extends { quest: { bonus?: true } }>(
  states: T[],
): T[] {
  return [...states].sort(
    (a, b) => Number(Boolean(a.quest.bonus)) - Number(Boolean(b.quest.bonus)),
  );
}

// Who hands a luke over: its giver, or Brann.
export function giverOf(quest: { giver?: Npc["id"] }): Npc {
  return NPCS[quest.giver ?? "brann"];
}
