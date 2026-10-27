import { clampForgeLevel } from "../rules";
import type { Chapter, Progress, QuestContext, QuestState } from "./types";

// Quests unlock one after another. On top of that, a chapter can wait for its
// calendar date: chapter N opens (N - 1) weeks after NEXT_PUBLIC_CALENDAR_START.
// Without that variable the calendar is ignored (handy while building).
const CALENDAR_START = process.env.NEXT_PUBLIC_CALENDAR_START;

export function chapterOpensAt(chapter: Chapter): Date | undefined {
  if (!CALENDAR_START) return undefined;
  const start = new Date(`${CALENDAR_START}T00:00:00`);
  if (Number.isNaN(start.getTime())) return undefined;
  return new Date(start.getTime() + (chapter.number - 1) * 7 * 864e5);
}

export type QuestBoard = {
  states: QuestState[];
  active: QuestState | null; // the next thing to do
  completedCount: number;
  total: number;
};

// `devUnlock` (?dev=quests) opens everything for testing, ignoring order and dates.
export function evaluateQuests(
  chapters: Chapter[],
  ctx: QuestContext,
  now: Date,
  devUnlock = false,
): QuestBoard {
  const states: QuestState[] = [];
  let previousDone = true;

  for (const chapter of chapters) {
    const opensAt = chapterOpensAt(chapter);
    const dateOpen = devUnlock || !opensAt || opensAt <= now;
    for (const quest of chapter.quests) {
      const result = quest.check(ctx);
      const done = Boolean(ctx.progress.completed[quest.id]);
      const unlocked = devUnlock || (previousDone && dateOpen);
      states.push({
        quest,
        chapter,
        status: done ? "done" : unlocked ? "active" : "locked",
        result,
        opensAt: !done && previousDone && !dateOpen ? opensAt : undefined,
      });
      previousDone = done;
    }
  }

  return {
    states,
    active: states.find((s) => s.status === "active") ?? null,
    completedCount: states.filter((s) => s.status === "done").length,
    total: states.length,
  };
}

// The forge starts at level 1 and grows with every quest that rewards it.
export function forgeLevelFor(chapters: Chapter[], progress: Progress): number {
  let level = 1;
  for (const chapter of chapters)
    for (const quest of chapter.quests)
      if (progress.completed[quest.id] && quest.reward) level += quest.reward.forgeLevel;
  return clampForgeLevel(level);
}
