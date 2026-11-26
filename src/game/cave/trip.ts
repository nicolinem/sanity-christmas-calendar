import { addItems, MATERIALS, type MaterialId } from "../materials";
import type { Progress } from "../quests/types";

// Adds to the trip's finds, rounding down and never going below zero
// (same rule as addItems).
export function addToTrip(
  progress: Progress,
  item: string,
  count: number,
): Progress {
  const trip = {
    ...progress.trip,
    [item]: Math.max(0, Math.floor((progress.trip[item] ?? 0) + count)),
  };
  return { ...progress, trip };
}

// Safe return: the trip's finds join the inventory and the trip ends.
export function bankTrip(progress: Progress): Progress {
  return dropTrip(secureTrip(progress));
}

// Resting place: the trip's finds are banked, but the player stays in the cave.
export function secureTrip(progress: Progress): Progress {
  const banked = addItems(
    progress,
    Object.entries(progress.trip).map(([id, count]) => ({ id, count })),
  );
  return { ...banked, trip: {} };
}

// Fainting: the trip's finds are lost, everything else stays.
export function dropTrip(progress: Progress): Progress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { inCave, ...rest } = progress;
  return { ...rest, trip: {} };
}

// The cave's materials as the bag shows them: what is safe and what is still
// on this trip, in MATERIALS order. Materials with neither are left out.
export function caveFinds(
  inventory: Record<string, number>,
  trip: Record<string, number>,
): { id: MaterialId; safe: number; trip: number }[] {
  return (Object.keys(MATERIALS) as MaterialId[])
    .map((id) => ({ id, safe: inventory[id] ?? 0, trip: trip[id] ?? 0 }))
    .filter((row) => row.safe > 0 || row.trip > 0);
}

// «1 isskår og 2 gammel malm»: a trip's finds in words, or "" for none.
export function findsText(trip: Record<string, number>): string {
  const parts = caveFinds({}, trip).map(
    ({ id, trip: count }) => `${count} ${MATERIALS[id].name.toLowerCase()}`,
  );
  return parts.length < 2
    ? (parts[0] ?? "")
    : `${parts.slice(0, -1).join(", ")} og ${parts.at(-1)}`;
}
