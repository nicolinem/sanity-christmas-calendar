import type { DoorMarker } from "../bridge";
import { BLACKSMITH, DOOR_ANCHORS, placeDoors } from "../village";
import type { QuestBoard } from "./engine";

// This week's doors, for the village and the map: locked ones too, so the
// player sees the whole week. A door without a place hangs at the forge.
export function weekDoors(board: QuestBoard): DoorMarker[] {
  const open = board.states.filter((s) => s.status !== "locked");
  const week = board.current?.chapter.number ?? open.at(-1)?.chapter.number;
  if (week === undefined) return [];
  return board.states
    .filter((s) => s.chapter.number === week)
    .map((s) => ({
      id: s.quest.id,
      door: s.quest.door,
      site: s.quest.villageSite ?? "forge",
      status:
        s.status === "done"
          ? "done"
          : s.status === "locked"
            ? "locked"
            : "open",
    }));
}

// Where the next step is, in world px: Brann while he still has to hand the
// door over, then the door's own window. Null when nothing is waiting.
export function nextStepPoint(
  board: QuestBoard,
  doors: DoorMarker[],
): { x: number; y: number } | null {
  const current = board.current;
  if (!current) return null;
  if (current.status === "offered")
    return { x: BLACKSMITH.x, y: BLACKSMITH.y - 16 };
  const placed = placeDoors(doors).find((d) => d.id === current.quest.id);
  if (placed) return { x: placed.x, y: placed.y - 8 };
  const anchor = DOOR_ANCHORS[current.quest.villageSite ?? "forge"];
  return { x: anchor.x, y: anchor.y - 8 };
}
