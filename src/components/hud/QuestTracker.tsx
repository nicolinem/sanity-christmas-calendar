"use client";

import { useState } from "react";
import type { QuestBoard } from "@/game/quests/engine";
import { IconCheck } from "./icons";

type Props = {
  board: QuestBoard;
  forgeLevel: number;
  compact: boolean;
  onOpenLog: () => void;
};

// The always-on corner of the quest log: the one thing to do next, and how far
// the player has come. Everything else lives in the quest log (J).
export default function QuestTracker({ board, forgeLevel, compact, onOpenLog }: Props) {
  const [open, setOpen] = useState(!compact);
  const active = board.active;
  const waiting = !active ? board.states.find((s) => s.status === "locked" && s.opensAt) : undefined;

  return (
    <section className="tracker frame frame--slate" aria-label="Quest">
      <button type="button" className="tracker-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="tracker-week">{active ? `Chapter ${active.chapter.number}` : "Quests"}</span>
        <span className="tracker-title">{active ? active.quest.title : "All done for now"}</span>
      </button>

      {open && (
        <>
          {active ? (
            <>
              <p className="tracker-goal">{renderCode(active.quest.goal)}</p>
              {active.result.objectives && (
                <ul className="tracker-list">
                  {active.result.objectives.map((o) => (
                    <li key={o.label} className={o.done ? "is-done" : undefined}>
                      <span className="tracker-box">{o.done && <IconCheck size={12} />}</span>
                      {o.label}
                    </li>
                  ))}
                </ul>
              )}
              {(active.result.message || active.quest.checkedBy === "code") && (
                <p className="tracker-note">
                  {renderCode(active.result.message ?? "Checked from your code: run `npm run quest` when it's ready.")}
                </p>
              )}
            </>
          ) : (
            <p className="tracker-goal">
              {waiting?.opensAt
                ? `The next task arrives ${waiting.opensAt.toLocaleDateString(undefined, { day: "numeric", month: "long" })}.`
                : "Brann has nothing more for you yet. New tasks arrive with the calendar."}
            </p>
          )}
          <div className="tracker-foot">
            <span className="tracker-meta">
              {board.completedCount}/{board.total} quests, forge level {forgeLevel}
            </span>
            <button type="button" className="tracker-log" onClick={onOpenLog}>
              <kbd>J</kbd> Quest log
            </button>
          </div>
        </>
      )}
    </section>
  );
}

// Quest text marks code with backticks; show it as code.
export function renderCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
  );
}
