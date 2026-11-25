"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { FEATURES } from "@/game/features";
import { CHAPTERS } from "@/game/quests/chapters";
import { chaptersForTrack } from "@/game/quests/engine";
import {
  PROGRESS_PROJECT as PROJECT,
  updateProgress,
} from "@/game/quests/progress";
import type { Progress } from "@/game/quests/types";
import { SIDE_QUESTS, SIDE_SPOTS } from "@/game/sideQuests/data";
import {
  acceptSide,
  advanceSide,
  deliverSide,
  evaluateSideQuests,
} from "@/game/sideQuests/engine";
import { NPCS, type NpcId } from "@/game/village";
import { pushToast } from "./Toasts";
import type {
  GiverId,
  SideContext,
  SideSpot,
  SideState,
} from "@/game/sideQuests/types";

// The side quests as the game sees them now, and the three things a player
// does with one: take it, find the next spot, hand it in. With the feature
// off there are none, so nothing in the village or the HUD changes.
export function useSideQuests(
  ctx: Omit<SideContext, "progress"> & { progress: Progress },
  devUnlock: boolean,
) {
  const { progress } = ctx;
  const chapters = useMemo(
    () => chaptersForTrack(CHAPTERS, progress.track),
    [progress.track],
  );
  const states = useMemo(
    () =>
      FEATURES.sideQuests
        ? evaluateSideQuests(SIDE_QUESTS, chapters, ctx, new Date(), devUnlock)
        : [],
    // ctx is rebuilt every render; these are the parts the checks read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapters, progress, ctx.items, ctx.ownObservations, devUnlock],
  );

  // Something made in Studio passed the check: say so at once, so the player
  // knows to go back. Find steps say it themselves when the spot is found.
  // The first evaluation only sets the baseline, so a reload stays quiet.
  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = new Map(states.map((s) => [s.quest.id, s.status]));
    if (!before) return;
    for (const s of states) {
      const last = s.quest.steps[s.quest.steps.length - 1];
      if (
        s.status === "ready" &&
        before.get(s.quest.id) === "active" &&
        last?.kind === "studio"
      ) {
        const giver = NPCS[s.quest.giver as NpcId];
        pushToast({
          title: `Klart: ${s.quest.title}`,
          body: giver ? `Gå til ${giver.name} og lever.` : undefined,
          tone: "lesson",
        });
      }
    }
  }, [states]);

  // What a person has for you: something to hand in first, then something in
  // progress, then something new.
  const forGiver = useCallback(
    (giver: GiverId): SideState | undefined =>
      states.find((s) => s.quest.giver === giver && s.status === "ready") ??
      states.find((s) => s.quest.giver === giver && s.status === "active") ??
      states.find((s) => s.quest.giver === giver && s.status === "available"),
    [states],
  );

  // The spots to show in the village: not yet found, on a taken quest.
  const spots = useMemo(() => {
    const open = new Set<string>();
    for (const s of states)
      if (s.status === "active")
        for (const step of s.quest.steps.slice(s.step))
          if (step.kind === "find") open.add(step.spot);
    return SIDE_SPOTS.filter((spot) => open.has(spot.id));
  }, [states]);

  // The quest and step a spot belongs to right now, if it's the next one.
  const atSpot = useCallback(
    (spotId: string): { state: SideState; spot: SideSpot } | undefined => {
      const state = states.find((s) => {
        const step = s.quest.steps[s.step];
        return (
          s.status === "active" && step?.kind === "find" && step.spot === spotId
        );
      });
      const spot = SIDE_SPOTS.find((x) => x.id === spotId);
      return state && spot ? { state, spot } : undefined;
    },
    [states],
  );

  const accept = useCallback((questId: string) => {
    updateProgress(PROJECT, (p) =>
      acceptSide(p, questId, new Date().toISOString()),
    );
  }, []);

  const advance = useCallback((state: SideState) => {
    updateProgress(PROJECT, (p) => advanceSide(p, state.quest, state.step));
  }, []);

  const deliver = useCallback((state: SideState) => {
    updateProgress(PROJECT, (p) =>
      deliverSide(p, state, new Date().toISOString()),
    );
  }, []);

  return { states, forGiver, spots, atSpot, accept, advance, deliver };
}

export type SideQuests = ReturnType<typeof useSideQuests>;
