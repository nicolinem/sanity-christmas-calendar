"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { bridge } from "@/game/bridge";
import type { GameItemView } from "@/game/items";
import { forgedPower } from "@/game/rules";
import { CHAPTERS } from "@/game/quests/chapters";
import {
  chaptersForTrack,
  evaluateQuests,
  forgeLevelFor,
} from "@/game/quests/engine";
import {
  EMPTY_PROGRESS,
  PROGRESS_PROJECT as PROJECT,
  readProgress,
  resetProgress,
  subscribeProgress,
  updateProgress,
} from "@/game/quests/progress";
import type {
  CodeCheck,
  QuestContext,
  QuestTrack,
  SolvedTask,
} from "@/game/quests/types";
import { plainText } from "./richText";

const noSubscribe = () => () => {};

// The player's saved progress and the forge level it earns. Separate from the
// quest board because item power depends on the forge level, and the board
// depends on the items.
export function useProgress() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => readProgress(PROJECT),
    () => EMPTY_PROGRESS,
  );
  const chapters = useMemo(
    () => chaptersForTrack(CHAPTERS, progress.track),
    [progress.track],
  );
  const forgeLevel = forgeLevelFor(chapters, progress);

  const metBrann = useCallback((questId?: string) => {
    updateProgress(PROJECT, (p) =>
      p.metBlacksmith && (!questId || p.briefed[questId])
        ? p
        : {
            ...p,
            metBlacksmith: true,
            briefed: questId ? { ...p.briefed, [questId]: true } : p.briefed,
          },
    );
  }, []);

  const reset = useCallback(() => resetProgress(PROJECT), []);

  const markIntroSeen = useCallback(() => {
    updateProgress(PROJECT, (p) =>
      p.introSeen ? p : { ...p, introSeen: true },
    );
  }, []);

  // Picked up at its place in the village; from now on it's worked on anywhere.
  const fetchQuest = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) =>
      p.fetched?.[questId]
        ? p
        : { ...p, fetched: { ...p.fetched, [questId]: true } },
    );
  }, []);

  // The week summary shows once per week; the journal can open it again.
  const markWeekSeen = useCallback((week: number, doors: number) => {
    updateProgress(PROJECT, (p) =>
      p.weeksSeen?.[week] === doors
        ? p
        : { ...p, weeksSeen: { ...p.weeksSeen, [week]: doors } },
    );
  }, []);

  const revealHint = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) => ({
      ...p,
      hints: { ...p.hints, [questId]: (p.hints[questId] ?? 0) + 1 },
    }));
  }, []);

  // The code window passed every example. Like quests, never taken back.
  const solveTask = useCallback(
    (questId: string, how: Omit<SolvedTask, "at">) => {
      updateProgress(PROJECT, (p) =>
        p.solved[questId]
          ? p
          : {
              ...p,
              solved: {
                ...p.solved,
                [questId]: { ...how, at: new Date().toISOString() },
              },
            },
      );
    },
    [],
  );

  // Remember every element the player has struck the wraith with (quests and,
  // later, the rune book read this).
  useEffect(
    () =>
      bridge.on("hit", ({ element }) => {
        if (element && !readProgress(PROJECT).struck[element])
          updateProgress(PROJECT, (p) => ({
            ...p,
            struck: { ...p.struck, [element]: true },
          }));
      }),
    [],
  );

  // Dev panel: pretend every quest before `questId` is done (and the wraith
  // beaten), so any quest can be tested without playing up to it.
  const jumpTo = useCallback((questId: string, briefed: boolean) => {
    updateProgress(PROJECT, (p) => {
      const order = chaptersForTrack(CHAPTERS, p.track).flatMap((c) =>
        c.quests.map((q) => q.id),
      );
      if (questId !== "__end" && !order.includes(questId)) return p;
      // "__end" means: everything in the selected track is done.
      const before =
        questId === "__end" ? order : order.slice(0, order.indexOf(questId));
      const now = new Date().toISOString();
      const completed = { ...p.completed };
      const briefings = { ...p.briefed };
      for (const id of order) {
        delete completed[id];
        delete briefings[id];
      }
      for (const id of before) {
        completed[id] = now;
        briefings[id] = true;
      }
      if (briefed && questId !== "__end") briefings[questId] = true;
      // "…som gitt" means ready to work on, so it's picked up too.
      const fetched = { ...p.fetched };
      if (briefed && questId !== "__end") fetched[questId] = true;
      return {
        ...p,
        fetched,
        introSeen: true,
        metBlacksmith: true,
        wraithDefeated: before.length > 0 || p.wraithDefeated,
        completed,
        briefed: briefings,
      };
    });
  }, []);

  // Dev panel: switch between the technical and non-technical track.
  const setTrack = useCallback((track: QuestTrack) => {
    updateProgress(PROJECT, (p) => ({ ...p, track, trackChosen: true }));
  }, []);

  // Dev panel: finish one quest as if its check passed, nothing else changes.
  const completeQuest = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) => ({
      ...p,
      introSeen: true,
      metBlacksmith: true,
      completed: { ...p.completed, [questId]: new Date().toISOString() },
      briefed: { ...p.briefed, [questId]: true },
      fetched: { ...p.fetched, [questId]: true },
    }));
  }, []);

  return {
    progress,
    forgeLevel,
    metBrann,
    reset,
    revealHint,
    solveTask,
    markIntroSeen,
    markWeekSeen,
    fetchQuest,
    jumpTo,
    completeQuest,
    setTrack,
  };
}

type BoardInput = {
  items: GameItemView[];
  codeChecks: Record<string, CodeCheck>;
  codeQuestId?: string | null;
  sanityConfigured: boolean | null;
  unpublishedDrafts?: number; // weapons saved but not published (from /api/items)
  archive?: QuestContext["archive"];
  archiveCases?: QuestContext["archiveCases"];
  wraithDefeatedNow: boolean;
  progress: ReturnType<typeof useProgress>["progress"];
};

// Evaluates every quest against the current game state and makes completions
// stick. A passed code task waits until its window is closed before completion.
export function useQuestBoard({
  items,
  codeChecks,
  codeQuestId,
  sanityConfigured,
  unpublishedDrafts,
  archive = null,
  archiveCases = null,
  wraithDefeatedNow,
  progress,
}: BoardInput) {
  const devUnlock = useSyncExternalStore(
    noSubscribe,
    () =>
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("dev"),
    () => false,
  );

  const chapters = useMemo(
    () => chaptersForTrack(CHAPTERS, progress.track),
    [progress.track],
  );
  const board = useMemo(() => {
    const ctx: QuestContext = {
      items,
      progress,
      codeChecks,
      sanityConfigured,
      unpublishedDrafts,
      archive,
      archiveCases,
    };
    return evaluateQuests(chapters, ctx, new Date(), devUnlock);
  }, [
    chapters,
    items,
    progress,
    codeChecks,
    sanityConfigured,
    unpublishedDrafts,
    archive,
    archiveCases,
    devUnlock,
  ]);

  // The first win over the wraith counts forever, even after a rematch reset.
  useEffect(() => {
    if (wraithDefeatedNow && !progress.wraithDefeated)
      updateProgress(PROJECT, (p) => ({ ...p, wraithDefeated: true }));
  }, [wraithDefeatedNow, progress.wraithDefeated]);

  useEffect(() => {
    // Read the store, not the render's snapshot, so a repeated effect run
    // (React strict mode) doesn't celebrate the same quest twice.
    const saved = readProgress(PROJECT);
    const finished = board.states.filter(
      (s) =>
        s.status === "active" &&
        s.result.done &&
        !saved.completed[s.quest.id] &&
        s.quest.id !== codeQuestId,
    );
    if (finished.length === 0) return;

    const before = forgeLevelFor(chapters, saved);
    const now = new Date().toISOString();
    updateProgress(PROJECT, (p) => {
      const completed = { ...p.completed };
      for (const s of finished) completed[s.quest.id] = now;
      return { ...p, completed };
    });
    const updated = readProgress(PROJECT);
    const after = forgeLevelFor(chapters, updated);
    const next = evaluateQuests(
      chapters,
      {
        items,
        progress: updated,
        codeChecks,
        sanityConfigured,
        unpublishedDrafts,
        archive,
        archiveCases,
      },
      new Date(),
      devUnlock,
    ).current;
    for (const [index, s] of finished.entries()) {
      bridge.emit("questCelebration", {
        questId: s.quest.id,
        door: s.quest.door,
        title: s.quest.title,
        lesson: plainText(s.quest.lesson.title),
        objectives: s.result.objectives
          ?.filter((o) => o.done)
          .map((o) => o.label),
        // Only a core door is "the next luke"; the optional one waits quietly,
        // and the week summary mentions it.
        nextDoor:
          index === finished.length - 1 &&
          next &&
          !next.quest.bonus &&
          next.status !== "locked"
            ? next.quest.door
            : undefined,
        nextGiver: next ? (next.quest.giver ?? "brann") : undefined,
        level:
          index === finished.length - 1 && after > before
            ? { number: after, damage: forgedPower(after).damage }
            : undefined,
      });
    }

    if (after > before) {
      bridge.emit("forgeLevelUp", after);
    }
  }, [
    board,
    codeQuestId,
    chapters,
    items,
    codeChecks,
    sanityConfigured,
    unpublishedDrafts,
    archive,
    archiveCases,
    devUnlock,
  ]);

  return board;
}
