// Code tasks solved in the game's code window switch on our own version of the
// same code here in the Studio. The player's code never runs in the Studio, so
// it can't break it.
//
// The game keeps progress in localStorage (src/game/quests/progress.ts). The
// embedded Studio is on the same origin, so it reads the same record, and the
// `storage` event tells it the moment a task is solved in the game.
//
// Relative imports on purpose: the Sanity CLI bundles the schema without the
// "@/" alias.

import { useSyncExternalStore } from "react";
import type { StringInputProps } from "sanity";
import { DocumentIcon } from "@sanity/icons/Document";
import SpriteImage from "../../components/SpriteImage";
import { SpritePicker } from "../studio/SpritePicker";
import { PROGRESS_PROJECT, storageKey } from "../../game/quests/progress";
import type { QuestTrack, SolvedTask } from "../../game/quests/types";
import { TASK_ICONS, type TaskIconName } from "./taskIcons";

type Solved = Record<string, SolvedTask>;

let lastRaw: string | null | undefined;
let last: Solved = {};
let lastTrack: QuestTrack = "technical";
let lastCompleted: Record<string, string> = {};

function read(): Solved {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey(PROGRESS_PROJECT));
  } catch {
    // Storage blocked: nothing is solved, the Studio works as before.
  }
  if (raw === lastRaw) return last;
  lastRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    last = parsed.solved || {};
    lastTrack = parsed.track === "nonTechnical" ? "nonTechnical" : "technical";
    lastCompleted = parsed.completed || {};
  } catch {
    last = {};
    lastTrack = "technical";
    lastCompleted = {};
  }
  return last;
}

// The track the player chose in the game. The Studio gives the non-technical
// track the tools its tasks need, without a code task in front of them.
export function isTrack(track: QuestTrack): boolean {
  if (typeof window === "undefined") return false;
  read();
  return lastTrack === track;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useBakeryReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      read();
      return (
        lastTrack === "nonTechnical" && Boolean(lastCompleted["baker-sign"])
      );
    },
    () => false,
  );
}

export function useSolved(questId: string): SolvedTask | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read()[questId],
    () => undefined,
  );
}

// The same switch for code that isn't React, like a validation function. Not
// solved when storage is blocked or there's no browser (the Studio's server).
export function isSolved(questId: string): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(read()[questId]);
}

// --- Luke 2: icon and preview ----------------------------------------------------

const LEDGER = "branns-ledger";
const DRAWING_BOARD = "the-drawing-board";

// The game task activates our working version; it never writes learner code
// into the schema or the repository.
export function ItemSpriteInput(props: StringInputProps) {
  const solved = useSolved(DRAWING_BOARD);
  return solved ? <SpritePicker {...props} /> : props.renderDefault(props);
}

// The icon the player picked in the code window, or the plain document icon.
export function ItemIcon(props: React.SVGProps<SVGSVGElement>) {
  const solved = useSolved(LEDGER);
  const Icon = TASK_ICONS[solved?.icon as TaskIconName] ?? DocumentIcon;
  return <Icon {...props} />;
}

// The item's own sprite in the document list, once Luke 2 is solved.
export function ItemMedia({
  spriteId,
  kind,
}: {
  spriteId?: string;
  kind?: string;
}) {
  const solved = useSolved(LEDGER);
  return solved ? (
    <SpriteImage spriteId={spriteId} kind={kind} />
  ) : (
    <ItemIcon />
  );
}
