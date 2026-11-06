"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { bridge } from "@/game/bridge";
import type { GameItemView } from "@/game/items";
import { forgedPower } from "@/game/rules";
import { CHAPTERS } from "@/game/quests/chapters";
import { evaluateQuests, forgeLevelFor } from "@/game/quests/engine";
import {
  EMPTY_PROGRESS,
  PROGRESS_PROJECT as PROJECT,
  readProgress,
  resetProgress,
  subscribeProgress,
  updateProgress,
} from "@/game/quests/progress";
import type { CodeCheck, QuestContext, SolvedTask } from "@/game/quests/types";
import { plainText } from "./richText";
import { pushToast } from "./Toasts";

const noSubscribe = () => () => {};

// The player's saved progress and the forge level it earns. Separate from the
// quest board because item power depends on the forge level, and the board
// depends on the items.
export function useProgress() {
  const progress = useSyncExternalStore(subscribeProgress, () => readProgress(PROJECT), () => EMPTY_PROGRESS);
  const forgeLevel = forgeLevelFor(CHAPTERS, progress);

  const metBrann = useCallback((questId?: string) => {
    updateProgress(PROJECT, (p) =>
      p.metBlacksmith && (!questId || p.briefed[questId])
        ? p
        : { ...p, metBlacksmith: true, briefed: questId ? { ...p.briefed, [questId]: true } : p.briefed },
    );
  }, []);

  const reset = useCallback(() => resetProgress(PROJECT), []);

  const skipQuest = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) =>
      p.completed[questId] || p.skipped[questId]
        ? p
        : { ...p, skipped: { ...p.skipped, [questId]: new Date().toISOString() } },
    );
  }, []);

  const resumeQuest = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) => {
      if (!p.skipped[questId]) return p;
      const skipped = { ...p.skipped };
      delete skipped[questId];
      return { ...p, skipped };
    });
  }, []);

  const markIntroSeen = useCallback(() => {
    updateProgress(PROJECT, (p) => (p.introSeen ? p : { ...p, introSeen: true }));
  }, []);

  const revealHint = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) => ({ ...p, hints: { ...p.hints, [questId]: (p.hints[questId] ?? 0) + 1 } }));
  }, []);

  // The code window passed every example. Like quests, never taken back.
  const solveTask = useCallback((questId: string, how: Omit<SolvedTask, "at">) => {
    updateProgress(PROJECT, (p) =>
      p.solved[questId] ? p : { ...p, solved: { ...p.solved, [questId]: { ...how, at: new Date().toISOString() } } },
    );
  }, []);

  // Remember every element the player has struck the wraith with (quests and,
  // later, the rune book read this).
  useEffect(
    () =>
      bridge.on("hit", ({ element }) => {
        if (element && !readProgress(PROJECT).struck[element])
          updateProgress(PROJECT, (p) => ({ ...p, struck: { ...p.struck, [element]: true } }));
      }),
    [],
  );

  // Dev panel: pretend every quest before `questId` is done (and the wraith
  // beaten), so any quest can be tested without playing up to it.
  const jumpTo = useCallback((questId: string, briefed: boolean) => {
    const order = CHAPTERS.flatMap((c) => c.quests.map((q) => q.id));
    // "__end" means: everything is done.
    const before = questId === "__end" ? order : order.slice(0, Math.max(0, order.indexOf(questId)));
    const now = new Date().toISOString();
    updateProgress(PROJECT, (p) => ({
      ...p,
      introSeen: true,
      metBlacksmith: true,
      wraithDefeated: before.length > 0 || p.wraithDefeated,
      completed: Object.fromEntries(before.map((id) => [id, now])),
      skipped: {},
      briefed: Object.fromEntries([...before, ...(briefed ? [questId] : [])].map((id) => [id, true as const])),
    }));
  }, []);

  return { progress, forgeLevel, metBrann, reset, revealHint, solveTask, skipQuest, resumeQuest, markIntroSeen, jumpTo };
}

type BoardInput = {
  items: GameItemView[];
  codeChecks: Record<string, CodeCheck>;
  sanityConfigured: boolean | null;
  unpublishedDrafts?: number; // weapons saved but not published (from /api/items)
  wraithDefeatedNow: boolean;
  progress: ReturnType<typeof useProgress>["progress"];
};

// Evaluates every quest against the current game state and makes completions
// stick: once a check passes for an unlocked quest it's recorded for good.
export function useQuestBoard({
  items,
  codeChecks,
  sanityConfigured,
  unpublishedDrafts,
  wraithDefeatedNow,
  progress,
}: BoardInput) {
  const devUnlock = useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get("dev") === "quests",
    () => false,
  );

  const board = useMemo(
    () => {
      const ctx: QuestContext = { items, progress, codeChecks, sanityConfigured, unpublishedDrafts };
      return evaluateQuests(CHAPTERS, ctx, new Date(), devUnlock);
    },
    [items, progress, codeChecks, sanityConfigured, unpublishedDrafts, devUnlock],
  );

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
      (s) => s.status === "active" && s.result.done && !saved.completed[s.quest.id],
    );
    if (finished.length === 0) return;

    const before = forgeLevelFor(CHAPTERS, saved);
    const now = new Date().toISOString();
    updateProgress(PROJECT, (p) => {
      const completed = { ...p.completed };
      for (const s of finished) completed[s.quest.id] = now;
      return { ...p, completed };
    });
    for (const s of finished) {
      pushToast({ title: `Luke ${s.quest.door} ferdig`, body: s.quest.title, tone: "quest" });
      pushToast({ title: `Lærdom: ${plainText(s.quest.lesson.title)}`, body: "Står under Lærdommer i kalenderen (J).", tone: "lesson" });
    }

    const after = forgeLevelFor(CHAPTERS, readProgress(PROJECT));
    if (after > before) {
      pushToast({
        title: `Nivå ${after}: våpnene blir sterkere`,
        body: `Alle våpnene dine gjør nå ${forgedPower(after).damage} skade.`,
        tone: "forge",
      });
      bridge.emit("forgeLevelUp", after);
    }
  }, [board]);

  return board;
}
