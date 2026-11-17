import type { DoorMarker } from "../bridge";
import { DOOR_ANCHORS, placeDoors } from "../village";
import { giverOf } from "./label";
import type { QuestBoard } from "./engine";

// This week's doors, for the village and the map: locked ones too, so the
// player sees the whole week. A door without a place hangs at its giver.
export function weekDoors(board: QuestBoard): DoorMarker[] {
  const open = board.states.filter((s) => s.status !== "locked");
  const week = board.current?.chapter.number ?? open.at(-1)?.chapter.number;
  if (week === undefined) return [];
  // An optional luke shows only once it's open, with its own symbol.
  return (
    board.states
      .filter(
        (s) =>
          s.chapter.number === week &&
          !(s.quest.bonus && s.status === "locked"),
      )
      // Optional lukes last, after the week's numbered ones.
      .sort(
        (a, b) =>
          Number(Boolean(a.quest.bonus)) - Number(Boolean(b.quest.bonus)),
      )
      .map((s) => ({
        id: s.quest.id,
        door: s.quest.door,
        ...(s.quest.bonus ? { bonus: true as const } : {}),
        // A luke without its own place hangs where its giver stands.
        site: s.quest.villageSite ?? giverOf(s.quest).site,
        status:
          s.status === "done"
            ? "done"
            : s.status === "locked"
              ? "locked"
              : "open",
      }))
  );
}

// Where the next step is, in world px: the giver while the door still has to
// be handed over, then the door's own window. Null when nothing is waiting.
export function nextStepPoint(
  board: QuestBoard,
  doors: DoorMarker[],
): { x: number; y: number } | null {
  const current = board.current;
  if (!current) return null;
  if (current.status === "offered" && !current.pickup) {
    const giver = giverOf(current.quest);
    return { x: giver.x, y: giver.y - 16 };
  }
  // A door without its own place is done at a desk (code window, Studio):
  // nothing in the village to walk to, so no arrow.
  if (
    !current.quest.villageSite ||
    current.quest.villageSite === "forge" ||
    (current.quest.villageSite === "bakerySign" && !current.pickup)
  )
    return null;
  const placed = placeDoors(doors).find((d) => d.id === current.quest.id);
  if (placed) return { x: placed.x, y: placed.y - 8 };
  const anchor = DOOR_ANCHORS[current.quest.villageSite ?? "forge"];
  return { x: anchor.x, y: anchor.y - 8 };
}
