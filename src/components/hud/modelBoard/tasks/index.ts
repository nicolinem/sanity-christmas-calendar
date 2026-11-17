import type { BoardTask } from "@/game/modelBoard/modelBoard";
import { archiveModelTask } from "./archiveModel";
import { bakerModelTask } from "./bakerModel";

// Tasks are added with the quests that use them. Keeping the registry here lets
// the board window stay generic, like the code window's WINDOW_TASKS.
export const BOARD_TASKS: Record<string, BoardTask> = {
  [archiveModelTask.id]: archiveModelTask,
  [bakerModelTask.id]: bakerModelTask,
};
