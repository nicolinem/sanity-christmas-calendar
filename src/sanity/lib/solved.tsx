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
import { DocumentIcon } from "@sanity/icons/Document";
import SpriteImage from "../../components/SpriteImage";
import { PROGRESS_PROJECT, storageKey } from "../../game/quests/progress";
import type { SolvedTask } from "../../game/quests/types";
import { TASK_ICONS, type TaskIconName } from "./taskIcons";

type Solved = Record<string, SolvedTask>;

let lastRaw: string | null | undefined;
let last: Solved = {};

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
    last = (raw && JSON.parse(raw).solved) || {};
  } catch {
    last = {};
  }
  return last;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useSolved(questId: string): SolvedTask | undefined {
  return useSyncExternalStore(subscribe, () => read()[questId], () => undefined);
}

// The same switch for code that isn't React, like a validation function. Not
// solved when storage is blocked or there's no browser (the Studio's server).
export function isSolved(questId: string): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(read()[questId]);
}

// --- Luke 2: icon and preview ----------------------------------------------------

const LEDGER = "branns-ledger";

// The icon the player picked in the code window, or the plain document icon.
export function ItemIcon(props: React.SVGProps<SVGSVGElement>) {
  const solved = useSolved(LEDGER);
  const Icon = TASK_ICONS[solved?.icon as TaskIconName] ?? DocumentIcon;
  return <Icon {...props} />;
}

// The item's own sprite in the document list, once Luke 2 is solved.
export function ItemMedia({ spriteId, kind }: { spriteId?: string; kind?: string }) {
  const solved = useSolved(LEDGER);
  return solved ? <SpriteImage spriteId={spriteId} kind={kind} /> : <ItemIcon />;
}
