import { previewTask } from "./preview";
import { validationTask } from "./validation";
import { drawingBoardTask } from "./drawingBoard";
import { trailTask } from "./groqTrail";
import { structureTask } from "./structureLists";
import { questionsTask } from "./archiveQuestions";
import { whoPointsHereTask } from "./whoPointsHere";
import { bakerTemplateTask } from "./bakerTemplate";
import { bakerForgeTask } from "./bakerForge";
import { bakerFunctionTask } from "./bakerFunction";
import type { WindowTask } from "./types";

// The code window's tasks, by quest id. A quest with `checkedBy: "window"`
// needs an entry here.
export const WINDOW_TASKS: Record<string, WindowTask> = {
  [previewTask.id]: previewTask,
  [validationTask.id]: validationTask,
  [drawingBoardTask.id]: drawingBoardTask,
  [trailTask.id]: trailTask,
  [structureTask.id]: structureTask,
  [questionsTask.id]: questionsTask,
  [whoPointsHereTask.id]: whoPointsHereTask,
  [bakerTemplateTask.id]: bakerTemplateTask,
  [bakerForgeTask.id]: bakerForgeTask,
  [bakerFunctionTask.id]: bakerFunctionTask,
};

export type { Reference, Requirement, Verdict, WindowTask } from "./types";
