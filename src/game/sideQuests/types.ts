// Side quests: small, optional wishes from people in the village
// (docs/plan-sideoppdrag.md). They have their own engine and their own place
// in Progress (`side`), and never touch the lukes or `completed`.

import type { Reward } from "../reward";
import type { SpriteSheet } from "../sprites";
import type { CheckResult, Hint, QuestContext } from "../quests/types";
import type { NpcId } from "../village";

// People outside NPCS come with the quiet areas (phase B): «fiskeren»,
// «barnet». NPCS stays the people who hand out lukes.
export type SideNpcId = "fisher" | "child";
export type GiverId = NpcId | SideNpcId;

// A point you walk to and press E. The same idea as «overraskelser» later.
export type SideSpot = {
  id: string;
  area: "bygda"; // later: "skogkanten", "grotta", … (plan-utforsking.md)
  x: number; // feet position, px
  y: number;
  prompt: string; // «Se i snøen»
  prop?: { sheet: SpriteSheet; frame: number }; // shown while the step is active
};

// QuestContext plus what only side quests need (S5, phase S2).
export type SideContext = QuestContext & {
  ownObservations?: { _id: string; witness?: string; place?: string }[] | null;
};

export type SideStep =
  | { kind: "find"; spot: string; label: string }
  | { kind: "talk"; to: GiverId; line: string; label: string }
  | {
      kind: "studio"; // made or changed in the player's own Studio
      label: string;
      check: (ctx: SideContext) => CheckResult;
    };
// Later: { kind: "defeat"; enemy: string; count: number } (phase C).

export type SideRequires = {
  luke?: string[]; // at least one of these lukes is completed (tracks differ)
  side?: string[]; // every one of these side quests is delivered
  chapter?: number; // this chapter has opened (chapterOpensAt)
};

export type SideQuest = {
  id: string; // never the same as a luke id (tested)
  title: string;
  giver: GiverId;
  kind: "world" | "sanity";
  topic?: string; // the Sanity term practised, as in Quest.topic
  requires: SideRequires;
  ask: string[]; // what the giver says; each page at most two sentences
  goal: string; // one line for the journal
  steps: SideStep[]; // in order; handing it in to the giver comes after the last
  thanks: string; // said when you deliver
  reward: Reward;
  hint?: Hint; // one hint, not three: these are optional
};

// available: the giver has it for you. active: taken, a step is in progress.
// ready: every step is done, go back to the giver. done: delivered.
export type SideStatus = "locked" | "available" | "active" | "ready" | "done";

export type SideState = {
  quest: SideQuest;
  status: SideStatus;
  step: number; // the step in progress; steps.length once ready or done
  result?: CheckResult; // the studio step in progress, when there is one
};
