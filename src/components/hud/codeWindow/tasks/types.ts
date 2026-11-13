import type { ComponentType, ReactNode } from "react";
import type { SolvedTask } from "@/game/quests/types";
import type { ImportHelp, Modules } from "../runCode";

// One task for the code window, one file per task in this folder. The window
// itself knows nothing about the task: it runs `starter` against `modules`,
// asks `judge` what the code does, and lets `Result` draw it. To add a task,
// write a file like preview.tsx and list it in index.ts under its quest id.

export type Requirement = { label: string; done: boolean; message?: string };

// What the task made of the player's code. `data` is the task's own, read only
// by its `Result` (the preview task puts the document rows there).
export type Verdict<Data = unknown> = {
  requirements: Requirement[];
  done: boolean;
  error?: string; // a task callback failed; show it beside the player's code
  solvedAs?: Omit<SolvedTask, "at">; // what the Studio needs to switch on our version
  data?: Data;
};

// A file the starter imports, shown read-only in its own tab. The source is
// the real file, so it never drifts from what the Studio uses.
export type Reference = {
  file: string;
  path?: string; // where it lives in the repo; left out for data that isn't a file
  source: string;
  about: string;
  examples: { code: string; shows: ReactNode }[];
};

// Where to go on in the repo once the task is solved.
export type Extend = {
  file: string; // the repo file where our version lives
  marker: string; // the `QUEST` comment to look for there
  idea: string; // one thing to try on your own, in plain words
};

export type WindowTask = {
  id: string; // the quest id
  file: string; // the name on the player's tab
  starter: string;
  modules: Modules; // what the player's `import` lines can reach
  importHelp?: ImportHelp;
  // May be async (a task that asks a fake client questions). The window keeps
  // only the answer to the latest keystroke.
  judge: (exports: Record<string, unknown>) => Verdict | Promise<Verdict>;
  // The panel beside the code: what the player's code does, drawn the way the
  // Studio would. `verdict` is null until the code has run once.
  resultTitle: string;
  Result: ComponentType<{ verdict: Verdict | null }>;
  ours: string; // our version of the code, shown once solved
  references: Reference[];
  extend?: Extend; // left out when there's no repo file to go on in
  // false: nothing switches on in the Studio (a GROQ answer, say), so the
  // window doesn't claim it does.
  studioCode?: false;
};
