import { addItems } from "../materials";
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
  const banked = addItems(
    progress,
    Object.entries(progress.trip).map(([id, count]) => ({ id, count })),
  );
  return dropTrip(banked);
}

// Fainting: the trip's finds are lost, everything else stays.
export function dropTrip(progress: Progress): Progress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { inCave, ...rest } = progress;
  return { ...rest, trip: {} };
}
