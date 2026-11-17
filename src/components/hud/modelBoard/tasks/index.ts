import type { BoardTask } from "@/game/modelBoard/modelBoard";

// Tasks are added with the quests that use them. Keeping the registry here lets
// the board window stay generic, like the code window's WINDOW_TASKS.
export const BOARD_TASKS: Record<string, BoardTask> = {};
