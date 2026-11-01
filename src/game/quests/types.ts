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
  introSeen: boolean; // the opening has been shown
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
  door: number; // which calendar door (luke) this is; door N opens on day N
  title: string;
  intro: string[]; // what Brann says when he hands it over, one short page each
  goal: string; // one line for the tracker: what, not how
  where?: string; // where the work happens: a file or a place, not the answer
  hints: Hint[]; // revealed one at a time, from nudge to near-answer
  learn?: { label: string; url: string };
  // What the player just learned, in plain words. Shown when the quest is done
  // and collected in Brann's book.
  lesson: { title: string; text: string };
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

// offered: unlocked, but Brann hasn't handed it over yet. Its details stay
// hidden and it can't be completed until he has.
export type QuestStatus = "done" | "active" | "offered" | "locked";

export type QuestState = {
  quest: Quest;
  chapter: Chapter;
  status: QuestStatus;
  result: CheckResult;
  opensAt?: Date; // set when the calendar is what keeps it locked
};
