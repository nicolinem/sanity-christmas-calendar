import { CHAPTERS } from "./chapters";
import { chapterOpensAt, type QuestBoard } from "./engine";
import type { Progress } from "./types";
import { QUEST_SITES } from "../village";

export type WeekSummary = {
  optional: { title: string; place: string } | null; // an unfinished optional luke
  number: number;
  title: string;
  doors: number; // core doors in the week
  pages: number; // pages written in the book this week (bonus included)
  hints: number; // hints revealed for the week's doors
  finishedAt: Date | null; // when the last door of the week was finished
  friday: Date | null; // when the solutions arrive
  next: {
    number: number;
    title: string;
    opensAt: Date | null;
    topics: string[];
  } | null;
};

// Whether a finished week's summary is still to be shown: never seen, or seen
// when the week had fewer core doors than it has now.
export function weekNeedsSummary(
  seen: true | number | undefined,
  doors: number,
): boolean {
  if (seen === undefined) return true;
  return typeof seen === "number" && seen < doors;
}

// Weeks where every core door is done, in calendar order.
export function finishedWeeks(board: QuestBoard): number[] {
  const weeks: number[] = [];
  for (const chapter of CHAPTERS) {
    const core = board.states.filter(
      (s) => s.chapter.number === chapter.number && !s.quest.bonus,
    );
    if (core.length > 0 && core.every((s) => s.status === "done"))
      weeks.push(chapter.number);
  }
  return weeks;
}

// The Friday of the week a chapter opens in (solutions day in the story).
export function fridayOf(opens: Date): Date {
  const friday = new Date(opens);
  friday.setDate(opens.getDate() + ((5 - opens.getDay() + 7) % 7));
  return friday;
}

export function weekSummary(
  board: QuestBoard,
  week: number,
  progress: Pick<Progress, "completed" | "hints">,
): WeekSummary | null {
  const chapter = CHAPTERS.find((c) => c.number === week);
  if (!chapter) return null;
  const states = board.states.filter((s) => s.chapter.number === week);
  const done = states.filter((s) => s.status === "done");
  const times = done
    .map((s) => progress.completed[s.quest.id])
    .filter(Boolean)
    .map((at) => new Date(at))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const opens = chapterOpensAt(chapter);
  const nextChapter = CHAPTERS.find((c) => c.number === week + 1);
  const nextStates = board.states.filter((s) => s.chapter.number === week + 1);
  const open = states.find((s) => s.quest.bonus && s.status !== "done");
  return {
    optional: open
      ? {
          title: open.quest.title,
          place: QUEST_SITES[open.quest.villageSite ?? "forge"].label.toLowerCase(),
        }
      : null,
    number: week,
    title: chapter.title,
    doors: states.filter((s) => !s.quest.bonus).length,
    pages: done.length,
    hints: states.reduce((n, s) => n + (progress.hints[s.quest.id] ?? 0), 0),
    finishedAt: times.at(-1) ?? null,
    friday: opens ? fridayOf(opens) : null,
    next: nextChapter
      ? {
          number: nextChapter.number,
          title: nextChapter.title,
          opensAt: chapterOpensAt(nextChapter) ?? null,
          topics: nextStates.length
            ? nextStates.map((s) => s.quest.title)
            : (nextChapter.teaser ?? []),
        }
      : null,
  };
}

// Wordle-style text for the team channel: how far, how, never what. No emoji,
// no task names, so it can't spoil anything.
export function shareText(summary: WeekSummary, forgeLevel: number): string {
  const lights = Array.from({ length: summary.doors }, () => "■").join(" ");
  const day = summary.finishedAt
    ? summary.finishedAt.toLocaleDateString("nb-NO", { weekday: "long" })
    : null;
  const hints =
    summary.hints === 0
      ? "uten hint"
      : summary.hints === 1
        ? "1 hint brukt"
        : `${summary.hints} hint brukt`;
  return [
    `Julekalenderen · Uke ${summary.number} · ${summary.title}`,
    `${lights}  ${summary.doors} av ${summary.doors} luker`,
    `Nivå ${forgeLevel}${day ? ` · ferdig ${day}` : ""} · ${hints}`,
  ].join("\n");
}
