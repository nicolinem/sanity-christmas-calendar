import type { GameItemView } from "../items";
import type { Element } from "../magic";
import type { QuestSiteId } from "../village";

export type QuestTrack = "technical" | "nonTechnical";

// Facts the player has earned. Stored per Sanity project in the browser
// (progress.ts) and never taken back: deleting a sword doesn't undo a quest.
export type Progress = {
  track: QuestTrack;
  metBlacksmith: boolean;
  wraithDefeated: boolean;
  completed: Record<string, string>; // quest id → ISO time it was completed
  briefed: Record<string, true>; // quests Brann has already explained
  fetched: Record<string, true>; // quests picked up at their place in the village
  hints: Record<string, number>; // how many hints the player has revealed per quest
  struck: Partial<Record<Element, true>>; // elements the player has hit the wraith with
  introSeen: boolean; // the opening has been shown
  solved: Record<string, SolvedTask>; // tasks solved in the code window (quest id → how)
  weeksSeen: Record<string, true>; // week numbers whose summary has been shown
};

// A task solved in the game's code window. The Studio reads this and switches
// on our own version of the same code (src/sanity/lib/solved.tsx).
export type SolvedTask = { at: string; icon?: string };

// Result of `npm run quest` for quests that can only be judged from code.
export type CodeCheck = { done: boolean; message?: string; checkedAt?: string };

export type QuestContext = {
  items: GameItemView[];
  progress: Progress;
  codeChecks: Record<string, CodeCheck>;
  sanityConfigured: boolean | null;
  unpublishedDrafts?: number; // weapons saved but not published (from /api/items)
};

export type Objective = { label: string; done: boolean };

export type CheckResult = {
  done: boolean;
  objectives?: Objective[];
  message?: string; // what's still missing, in Brann's world
};

// A nudge, optionally with the exact docs page (or section) that explains it,
// so a stuck player can always find the answer without it being spelled out.
export type Hint = {
  title?: string;
  text: string;
  steps?: string[];
  link?: { label: string; url: string };
};

export type Quest = {
  id: string;
  track?: QuestTrack; // omitted for quests shared by both tracks
  door: number; // display order for this door in the calendar
  title: string;
  intro: string[]; // what Brann says when he hands it over, one short page each
  goal: string; // one line for the tracker: what, not how
  where?: string; // where the work happens: a file or a place, not the answer
  // Optional steps to try the result in the real Studio after solving the code.
  studioPractice?: string;
  villageSite?: QuestSiteId; // where the player finds this task in Frostholm
  // "Slik blir det": a Før / Etter picture of the goal, with a short caption
  // under each. The pictures are React, so they live in a registry keyed by
  // quest id (src/components/hud/goalPreviews.tsx); only the captions are here.
  goalPreview?: { before: string; after: string };
  hints: Hint[]; // revealed one at a time, from nudge to near-answer
  learn?: { label: string; url: string };
  // What the player just learned, in plain words. Shown when the quest is done
  // and collected in Brann's book.
  lesson: { title: string; text: string };
  // game: the game sees it in your content. code: `npm run quest` judges your
  // files. window: you write it in the game's code window, which checks it.
  checkedBy: "game" | "code" | "window";
  // Optional: shown with a ☆ and left out of the "N av M" totals.
  bonus?: true;
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
  // Brann has explained it, but it waits at this place in the village. Walk
  // there once (E) to pick it up; after that it's worked on from anywhere.
  pickup?: QuestSiteId;
};
