import type { OwnArchiveDoc, OwnCase } from "../archive";
import type { BakeryOrder, BakerySign } from "../bakery";
import type { GameItemView } from "../items";
import type { Element } from "../magic";
import type { NpcId, QuestSiteId } from "../village";

export type QuestTrack = "technical" | "nonTechnical";

// Facts the player has earned. Stored per Sanity project in the browser
// (progress.ts), backed up in the player's own project, and never taken back: deleting a sword doesn't undo a quest.
export type Progress = {
  track: QuestTrack;
  trackChosen: boolean; // player has completed track choice (legacy saves migrate to true)
  shareProfile: boolean; // explicit opt-in before name, figure and milestones are shared
  sharePrompted: boolean; // returning players have answered the one-time sharing question
  shareHints: boolean; // when sharing: show how many hints were used per luke (on by default)
  metBlacksmith: boolean;
  wraithDefeated: boolean;
  completed: Record<string, string>; // quest id → ISO time it was completed
  weaponDescriptionItemId?: string;
  weaponDescriptionBefore?: string | null;
  bakeryOrderId?: string; // published order that completed the first Bakery door
  briefed: Record<string, true>; // quests Brann has already explained
  fetched: Record<string, true>; // quests picked up at their place in the village
  hints: Record<string, number>; // how many hints the player has revealed per quest
  struck: Partial<Record<Element, true>>; // elements the player has hit the wraith with
  introSeen: boolean; // the opening has been shown
  solved: Record<string, SolvedTask>; // tasks solved in the code window (quest id → how)
  // Week numbers whose summary has been shown, with how many core doors the
  // week had then (true in older saves). A week that grows shows it again.
  weeksSeen: Record<string, true | number>;
  // Gear choices whose new-unlock badge the player has already seen.
  seenGear: Record<string, true>;
  // The player's own figure (src/game/figure.ts). Left out: the knight.
  figure?: Record<string, string>;
  // The player's chosen display name, shown on the community page.
  name?: string;
  // Side quests the player has taken (src/game/sideQuests): when, the step
  // in progress, and when delivered. Never in `completed`, which the
  // community server only accepts luke ids in.
  side: Record<string, SideRecord>;
  // Spots found once: side quest steps now, «overraskelser» later.
  found: Record<string, true>;
  // Cave bosses beaten (boss id) and chests opened (e.g. "cave-5"). Facts;
  // XP and gear are worked out from them.
  bosses: Record<string, true>;
  chests: Record<string, true>;
  // XP from ordinary monsters. Lukes and side quests are counted from the
  // facts above (src/game/xp.ts), so only this has to be stored.
  xp: number;
  // Materials from the cave: material id → count (src/game/materials.ts).
  inventory: Record<string, number>;
  // Forgings used: the Smiing's _id → the recipe it was forged from
  // (src/game/forge.ts). Each id is used once.
  crafted: Record<string, string>;
  // The deepest cave floor the player has reached (src/game/cave/floors.ts).
  deepest: number;
  // Finds from the current cave trip, banked into inventory on a safe return.
  trip: Record<string, number>;
  // Set while the player is in the cave; absent otherwise.
  inCave?: true;
  // When this record last changed, and when this game began (set by «Nytt
  // spill»; absent for the first game). The backup in Sanity uses both to
  // merge two copies (progressMerge.ts).
  savedAt?: string;
  startedAt?: string;
  // When the figure and name, and the sharing choice, were last set, so an
  // older copy can't bring a removed figure back or switch sharing on again.
  lookAt?: string;
  shareAt?: string;
};

export type SideRecord = { at: string; step: number; done?: string };

// A task solved in the game's code window. The Studio reads this and switches
// on our own version of the same code (src/sanity/lib/solved.tsx).
export type SolvedTask = { at: string; icon?: string };

// A pass/fail a quest can read from outside the game's own data. Only the dev
// panel sets it today; the engine tests use it as a simple switch.
export type CodeCheck = { done: boolean; message?: string; checkedAt?: string };

export type QuestContext = {
  items: GameItemView[];
  progress: Progress;
  codeChecks: Record<string, CodeCheck>;
  sanityConfigured: boolean | null;
  unpublishedDrafts?: number; // weapons saved but not published (from /api/items)
  // Arkivarens observasjoner in the player's own project (uke 2, non-technical
  // track), published versions only. null until the game has asked.
  archive?: OwnArchiveDoc[] | null;
  archiveCases?: OwnCase[] | null; // published `case` documents, same source
  archiveCaseDrafts?: boolean;
  bakeryOrders?: BakeryOrder[] | null; // published orders from the player's project
  bakerySign?: BakerySign | null; // published skilt only
};

export type Objective = { label: string; done: boolean };

export type CheckResult = {
  done: boolean;
  goal?: string;
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
  topic?: string; // the Sanity concept, separate from the in-world problem
  intro: string[]; // what Brann says when he hands it over, one short page each
  outro?: string[]; // optional giver's lines after completing the door
  goal: string; // one line for the tracker: what, not how
  // «Dette lager du» and «Hvorfor»: the concrete thing the player builds and
  // where it shows up, and why it matters. Shown in the dialogue and journal.
  explain: { what: string; why: string };
  // How to do it, step by step. Part of the task text (dialogue and journal),
  // not hints: hints are for when the steps aren't enough.
  steps?: string[];
  where?: string; // where the work happens: a file or a place, not the answer
  // Optional steps to try the result in the real Studio after solving the code.
  studioPractice?: string;
  villageSite?: QuestSiteId; // where the player finds this task in Frostholm
  giver?: NpcId; // who hands it over; Brann when left out
  asksNpc?: NpcId; // who the player must ask for information
  // "Slik blir det": a Før / Etter picture of the goal, with a short caption
  // under each. The pictures are React, so they live in a registry keyed by
  // quest id (src/components/hud/goalPreviews.tsx); only the captions are here.
  goalPreview?: { before: string; after: string };
  hints: Hint[]; // revealed one at a time, from nudge to near-answer
  learn?: { label: string; url: string };
  // What the player just learned, in plain words. Shown when the quest is done
  // and collected in Brann's book.
  lesson: { title: string; text: string; atWork?: string };
  // game: the game sees it in your content. window: you write it in the game's
  // code window, which checks it. board: the model board checks it. code: no
  // quest uses it now; it's kept for the engine tests.
  checkedBy: "game" | "code" | "window" | "board";
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
  // What has happened in the village this week, said by the giver before the
  // week's first luke (both tracks). One short page each.
  opening?: string[];
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
