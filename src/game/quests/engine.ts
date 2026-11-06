import { clampForgeLevel } from "../rules";
import type { Chapter, Progress, QuestContext, QuestState } from "./types";

// Quests unlock one after another. Each chapter opens weekly from
// NEXT_PUBLIC_CALENDAR_START (30 November). Without it, dates are ignored.
const CALENDAR_START = process.env.NEXT_PUBLIC_CALENDAR_START;

export function chapterOpensAt(chapter: Chapter): Date | undefined {
  if (!CALENDAR_START) return undefined;
  const start = new Date(`${CALENDAR_START}T00:00:00`);
  if (Number.isNaN(start.getTime())) return undefined;
  return new Date(start.getTime() + (chapter.number - 1) * 7 * 864e5);
}

export type QuestBoard = {
  states: QuestState[];
  // The next thing to do: offered (Brann hasn't handed it over yet) or active.
  current: QuestState | null;
  // The quest finished just before `current`, so Brann can react to it.
  previous: QuestState | null;
  // Bonus quests are optional and left out of both.
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
  let previousResolved = true;

  for (const chapter of chapters) {
    for (const quest of chapter.quests) {
      const opensAt = chapterOpensAt(chapter);
      const dateOpen = devUnlock || !opensAt || opensAt <= now;
      const result = quest.check(ctx);
      const done = Boolean(ctx.progress.completed[quest.id]);
      const skipped = Boolean(ctx.progress.skipped[quest.id]);
      const unlocked = devUnlock || (previousResolved && dateOpen);
      const briefed = Boolean(ctx.progress.briefed[quest.id]);
      states.push({
        quest,
        chapter,
        status: done ? "done" : skipped ? "skipped" : !unlocked ? "locked" : briefed ? "active" : "offered",
        result,
        opensAt: !done && !skipped && previousResolved && !dateOpen ? opensAt : undefined,
      });
      // Skipping advances the story but does not count as completion. Bonuses
      // remain optional and never hold back the next quest.
      if (!quest.bonus) previousResolved = done || skipped;
    }
  }

  const index = states.findIndex((s) => s.status === "active" || s.status === "offered");
  return {
    states,
    current: index >= 0 ? states[index] : null,
    previous: index > 0 && states[index - 1].status === "done" ? states[index - 1] : null,
    completedCount: states.filter((s) => s.status === "done" && !s.quest.bonus).length,
    total: states.filter((s) => !s.quest.bonus).length,
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
