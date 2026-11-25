// The side quest engine. Unlike the lukes (quests/engine.ts) there is no
// order, several can be in progress at once, and a quest whose steps are all
// done waits to be handed in ("ready"). Pure: no DOM, React or Phaser.

import { chapterOpensAt } from "../quests/engine";
import type { Chapter, Progress } from "../quests/types";
import type {
  GiverId,
  SideContext,
  SideQuest,
  SideRequires,
  SideState,
} from "./types";

function met(
  requires: SideRequires,
  progress: Progress,
  chapters: Chapter[],
  now: Date,
): boolean {
  if (requires.luke && !requires.luke.some((id) => progress.completed[id]))
    return false;
  if (requires.side && !requires.side.every((id) => progress.side?.[id]?.done))
    return false;
  if (requires.chapter !== undefined) {
    const chapter = chapters.find((c) => c.number === requires.chapter);
    const opens = chapter ? chapterOpensAt(chapter, now) : undefined;
    if (opens && opens > now) return false;
  }
  return true;
}

// A saved step that isn't a whole number in range counts as the first step.
function savedStep(raw: unknown, steps: number): number {
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 0
    ? Math.min(raw, steps)
    : 0;
}

// `devUnlock` (?dev) makes every untaken quest available, like the lukes.
export function evaluateSideQuests(
  quests: SideQuest[],
  chapters: Chapter[],
  ctx: SideContext,
  now: Date,
  devUnlock = false,
): SideState[] {
  return quests.map((quest): SideState => {
    const record = ctx.progress.side?.[quest.id];
    const last = quest.steps.length;
    if (record?.done) return { quest, status: "done", step: last };
    if (!record)
      return {
        quest,
        status:
          devUnlock || met(quest.requires, ctx.progress, chapters, now)
            ? "available"
            : "locked",
        step: 0,
      };
    // Taken: find and talk steps move on when the player presses E (saved);
    // studio steps pass for as long as their check does.
    for (let step = savedStep(record.step, last); step < last; step++) {
      const current = quest.steps[step];
      if (current.kind !== "studio") return { quest, status: "active", step };
      const result = current.check(ctx);
      if (!result.done) return { quest, status: "active", step, result };
    }
    return { quest, status: "ready", step: last };
  });
}

// Who shows which marker: «?» to hand something in, «!» to take something.
// `blocked` are people the lukes need right now; they get no marker at all.
export function sideMarkers(
  states: SideState[],
  blocked: Iterable<GiverId>,
): Partial<Record<GiverId, "!" | "?">> {
  const skip = new Set(blocked);
  const markers: Partial<Record<GiverId, "!" | "?">> = {};
  for (const { quest, status } of states) {
    if (skip.has(quest.giver)) continue;
    if (status === "ready") markers[quest.giver] = "?";
    else if (status === "available") markers[quest.giver] ??= "!";
  }
  return markers;
}

// Each step and whether it's done, for the journal: steps before the one in
// progress are done, and every step is done once the quest is ready.
export function sideObjectives(
  state: SideState,
): { label: string; done: boolean }[] {
  const all = state.status === "ready" || state.status === "done";
  return state.quest.steps.map((step, i) => ({
    label: step.label,
    done: all || (state.status === "active" && i < state.step),
  }));
}

// --- changes to Progress: each returns the same object when nothing changes --

export function acceptSide(
  progress: Progress,
  questId: string,
  at: string,
): Progress {
  if (progress.side?.[questId]) return progress;
  return {
    ...progress,
    side: { ...progress.side, [questId]: { at, step: 0 } },
  };
}

// The player pressed E at a find or talk step. Only the step in progress
// moves on; a find step also remembers the spot.
export function advanceSide(
  progress: Progress,
  quest: SideQuest,
  step: number,
): Progress {
  const record = progress.side?.[quest.id];
  const current = quest.steps[step];
  if (!record || record.done || !current || current.kind === "studio")
    return progress;
  if (savedStep(record.step, quest.steps.length) !== step) return progress;
  return {
    ...progress,
    side: { ...progress.side, [quest.id]: { ...record, step: step + 1 } },
    found:
      current.kind === "find"
        ? { ...progress.found, [current.spot]: true }
        : progress.found,
  };
}

// Handing it in to the giver. Only a ready quest can be delivered.
export function deliverSide(
  progress: Progress,
  state: SideState,
  at: string,
): Progress {
  const record = progress.side?.[state.quest.id];
  if (state.status !== "ready" || !record || record.done) return progress;
  return {
    ...progress,
    side: {
      ...progress.side,
      [state.quest.id]: { ...record, step: state.step, done: at },
    },
  };
}
