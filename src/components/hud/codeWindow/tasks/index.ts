import { previewTask } from "./preview";
import { validationTask } from "./validation";
import type { WindowTask } from "./types";

// The code window's tasks, by quest id. A quest with `checkedBy: "window"`
// needs an entry here.
export const WINDOW_TASKS: Record<string, WindowTask> = {
  [previewTask.id]: previewTask,
  [validationTask.id]: validationTask,
};

export type { Reference, Requirement, Verdict, WindowTask } from "./types";
