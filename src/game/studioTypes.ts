import { FEATURES } from "./features";
import { openQuestIds } from "./quests/engine";
import type { Chapter, Progress } from "./quests/types";
import { SIDE_QUESTS } from "./sideQuests/data";
import { sideQuestOpen } from "./sideQuests/engine";

// The Studio shows Item from the start. Every other document type waits for
// the first luke or side quest that uses it, so week 1 is only about Item.
// Once a type has shown, it stays (Progress.studioTypes).
//
// Relative imports on purpose: the Studio reads this too.
export const STUDIO_TYPE_OPENERS = {
  // Week 2, both tracks: the first Arkivaren luke, and «Det Kari så».
  observation: ["follow-the-trail", "archive-model", "kari-saw"],
  place: ["follow-the-trail", "archive-model", "kari-saw"],
  witness: ["follow-the-trail", "archive-model", "kari-saw"],
  // Non-technical luke 6, the saksmappe.
  case: ["case-file"],
  // Week 3, both tracks: the first Bakeren luke.
  bakeryOrder: ["baker-template", "baker-model"],
  // Non-technical luke 8, and technical luke 11, whose function writes to it.
  bakerySign: ["baker-sign", "baker-function"],
} as const satisfies Record<string, readonly string[]>;

export type LockedStudioType = keyof typeof STUDIO_TYPE_OPENERS;

export function isLockedStudioType(type: string): type is LockedStudioType {
  return Object.hasOwn(STUDIO_TYPE_OPENERS, type);
}

// The types whose luke or side quest is open now, in the player's track.
// `ignoreDates` (?dev) treats every date as come, but lukes still open in order.
export function studioTypesOpen(
  chapters: Chapter[],
  progress: Progress,
  now: Date,
  ignoreDates = false,
): LockedStudioType[] {
  const lukes = openQuestIds(chapters, progress.completed, now, ignoreDates);
  const side = new Set(
    FEATURES.sideQuests
      ? SIDE_QUESTS.filter((q) =>
          sideQuestOpen(q, progress, chapters, now),
        ).map((q) => q.id)
      : [],
  );
  return (Object.keys(STUDIO_TYPE_OPENERS) as LockedStudioType[]).filter(
    (type) =>
      STUDIO_TYPE_OPENERS[type].some((id) => lukes.has(id) || side.has(id)),
  );
}
