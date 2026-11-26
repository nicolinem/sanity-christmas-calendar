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

import { useEffect, useRef, useSyncExternalStore } from "react";
import { set, unset, useFormValue, type StringInputProps } from "sanity";
import { DocumentIcon } from "@sanity/icons/Document";
import SpriteImage from "../../components/SpriteImage";
import { SpritePicker } from "../studio/SpritePicker";
import { PROGRESS_PROJECT, storageKey } from "../../game/quests/progress";
import {
  spriteAfterKindChange,
  spriteIdsForItemKind,
} from "../../game/sprites";
import { unlockedRecipes } from "../../game/recipes";
import type { QuestTrack, SolvedTask } from "../../game/quests/types";
import { TASK_ICONS, type TaskIconName } from "./taskIcons";

type Solved = Record<string, SolvedTask>;

let lastRaw: string | null | undefined;
let last: Solved = {};
let lastTrack: QuestTrack = "technical";
let lastBriefed: Record<string, boolean> = {};
let lastChests: Record<string, true> = {};

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
    lastBriefed = parsed.briefed || {};
    lastChests = parsed.chests || {};
  } catch {
    last = {};
    lastTrack = "technical";
    lastBriefed = {};
    lastChests = {};
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

// Recipes found in the cave, for the Smiing's reference list. None without a
// browser or storage.
export function unlockedRecipeIds(): string[] {
  if (typeof window === "undefined") return [];
  read();
  return unlockedRecipes({ chests: lastChests });
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useMorningRush(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      read();
      return (
        lastTrack === "nonTechnical" && Boolean(lastBriefed["morning-rush"])
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
//
// Before that, the plain list only shows sprites that fit the item's kind,
// and picking Potion or Material gives a sprite to start from (it can be
// changed). Only a kind changed while editing does that: opening an existing
// item never changes it.
export function ItemSpriteInput(props: StringInputProps) {
  const solved = useSolved(DRAWING_BOARD);
  const kind = useFormValue(["kind"]);
  const { value, onChange } = props;
  const lastKind = useRef(kind);
  useEffect(() => {
    if (kind === lastKind.current) return;
    lastKind.current = kind;
    const next = spriteAfterKindChange(kind, value);
    if (next !== undefined) onChange(next === null ? unset() : set(next));
  }, [kind, value, onChange]);

  if (solved) return <SpritePicker {...props} />;
  const fitting = spriteIdsForItemKind(kind);
  if (!fitting.length) return props.renderDefault(props);
  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: { ...props.schemaType.options, list: [...fitting] },
    },
  });
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
