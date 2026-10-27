"use client";

import { useState } from "react";
import type { QuestBoard } from "@/game/quests/engine";
import { IconCheck } from "./icons";

type Props = {
  board: QuestBoard;
  forgeLevel: number;
  metBrann: boolean;
  compact: boolean;
  onOpenLog: () => void;
};

// The always-on corner of the quest log: the one thing to do next, and how far
// the player has come. A quest Brann hasn't handed over yet stays a mystery
// here: you learn what it is by talking to him.
export default function QuestTracker({ board, forgeLevel, metBrann, compact, onOpenLog }: Props) {
  const [open, setOpen] = useState(!compact);
  const current = board.current;
  const waiting = !current ? board.states.find((s) => s.status === "locked" && s.opensAt) : undefined;
  const offered = current?.status === "offered";

  const title = !current
    ? "Ferdig for nå"
    : offered
      ? metBrann
        ? "Brann har en ny oppgave"
        : "Noen venter ved smia"
      : current.quest.title;

  return (
    <section className="tracker frame frame--slate" aria-label="Oppdrag">
      <button type="button" className="tracker-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="tracker-week">{current ? `Kapittel ${current.chapter.number}` : "Oppdrag"}</span>
        <span className="tracker-title">{title}</span>
      </button>

      {open && (
        <>
          {current && offered && (
            <p className="tracker-goal">
              Gå til smia og snakk med Brann <kbd>E</kbd>
            </p>
          )}
          {current && !offered && (
            <>
              <p className="tracker-goal">{renderCode(current.quest.goal)}</p>
              {current.result.objectives && (
                <ul className="tracker-list">
                  {current.result.objectives.map((o) => (
                    <li key={o.label} className={o.done ? "is-done" : undefined}>
                      <span className="tracker-box">{o.done && <IconCheck size={12} />}</span>
                      {o.label}
                    </li>
                  ))}
                </ul>
              )}
              {(current.result.message || current.quest.checkedBy === "code") && (
                <p className="tracker-note">
                  {renderCode(
                    current.result.message ?? "Sjekkes fra koden din: kjør `npm run quest` når du er klar.",
                  )}
                </p>
              )}
            </>
          )}
          {!current && (
            <p className="tracker-goal">
              {waiting?.opensAt
                ? `Neste oppgave kommer ${waiting.opensAt.toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}.`
                : "Brann har ikke mer til deg ennå. Nye oppgaver kommer med kalenderen."}
            </p>
          )}
          <div className="tracker-foot">
            <span className="tracker-meta">
              {board.completedCount}/{board.total} oppdrag, smienivå {forgeLevel}
            </span>
            <button type="button" className="tracker-log" onClick={onOpenLog}>
              <kbd>J</kbd> Oppdragslogg
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
