import { previewTask } from "./preview";
import { validationTask } from "./validation";
import { drawingBoardTask } from "./drawingBoard";
import type { WindowTask } from "./types";

// The code window's tasks, by quest id. A quest with `checkedBy: "window"`
// needs an entry here.
export const WINDOW_TASKS: Record<string, WindowTask> = {
  [previewTask.id]: previewTask,
  [validationTask.id]: validationTask,
  [drawingBoardTask.id]: drawingBoardTask,
};

export type { Reference, Requirement, Verdict, WindowTask } from "./types";
