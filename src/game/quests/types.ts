import type { GameItemView } from "../items";
import type { Element } from "../magic";

// Facts the player has earned. Stored per Sanity project in the browser
// (progress.ts) and never taken back: deleting a sword doesn't undo a quest.
export type Progress = {
  metBlacksmith: boolean;
  wraithDefeated: boolean;
  completed: Record<string, string>; // quest id → ISO time it was completed
  briefed: Record<string, true>; // quests Brann has already explained
  hints: Record<string, number>; // how many hints the player has revealed per quest
  struck: Partial<Record<Element, true>>; // elements the player has hit the wraith with
};

// Result of `npm run quest` for quests that can only be judged from code.
export type CodeCheck = { done: boolean; message?: string; checkedAt?: string };

export type QuestContext = {
  items: GameItemView[];
  progress: Progress;
  codeChecks: Record<string, CodeCheck>;
  sanityConfigured: boolean | null;
};

export type Objective = { label: string; done: boolean };

export type CheckResult = {
  done: boolean;
  objectives?: Objective[];
  message?: string; // what's still missing, in Brann's world
};

// A nudge, optionally with the exact docs page (or section) that explains it,
// so a stuck player can always find the answer without it being spelled out.
export type Hint = { text: string; link?: { label: string; url: string } };

export type Quest = {
  id: string;
  title: string;
  intro: string; // what Brann says when he hands it over
  goal: string; // one line for the tracker: what, not how
  where?: string; // where the work happens: a file or a place, not the answer
  hints: Hint[]; // revealed one at a time, from nudge to near-answer
  learn?: { label: string; url: string };
  checkedBy: "game" | "code";
  reward?: { forgeLevel: number };
  check: (ctx: QuestContext) => CheckResult;
};

export type Chapter = {
  number: number;
  title: string;
  quests: Quest[];
  teaser?: string[]; // quest names shown while the chapter isn't built or open yet
};

export type QuestStatus = "done" | "active" | "locked";

export type QuestState = {
  quest: Quest;
  chapter: Chapter;
  status: QuestStatus;
  result: CheckResult;
  opensAt?: Date; // set when the calendar is what keeps it locked
};
