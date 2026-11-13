"use client";

import { useState } from "react";
import type { QuestBoard } from "@/game/quests/engine";
import type { QuestSiteId } from "@/game/village";
import { IconCheck } from "./icons";
import { nextStep } from "./nextStep";
import { renderText } from "./richText";

type Props = {
  board: QuestBoard;
  forgeLevel: number;
  metBrann: boolean;
  compact: boolean;
  onOpenLog: () => void;
  onOpenQuest: (questId: string) => void; // the door's page in the journal
  onOpenCode: (questId: string) => void;
  onOpenStudio: () => void;
  onTravel: (site: QuestSiteId) => void;
  // A finished door whose celebration waits until the Studio pane closes.
  finished?: { door: number; title: string } | null;
  onShowCelebration?: () => void;
};

// The always-on corner of the quest log: the one thing to do next, and how far
// the player has come. A quest Brann hasn't handed over yet stays a mystery
// here: you learn what it is by talking to him.
export default function QuestTracker({
  board,
  forgeLevel,
  metBrann,
  compact,
  onOpenLog,
  onOpenQuest,
  onOpenCode,
  onOpenStudio,
  onTravel,
  finished,
  onShowCelebration,
}: Props) {
  const [open, setOpen] = useState(!compact);
  const current = board.current;
  const waiting = !current
    ? board.states.find((s) => s.status === "locked" && s.opensAt)
    : undefined;
  // Brann still has to hand it over (a door waiting to be picked up is known).
  const offered = current?.status === "offered" && !current.pickup;
  const step = nextStep(current);
  const runStep = () => {
    if (!step) return;
    if (step.kind === "brann") onTravel("forge");
    else if (step.kind === "code") onOpenCode(step.questId);
    else if (step.kind === "travel") onTravel(step.site);
    else if (step.kind === "studio") onOpenStudio();
    else onOpenQuest(step.questId);
  };

  // Every check passes: the door is about to be finished (the code window
  // finishes it when you leave it), so the corner turns gold.
  const ready =
    Boolean(finished) || (current?.status === "active" && current.result.done);

  if (finished) {
    return (
      <section
        className="tracker frame frame--slate is-ready"
        aria-label="Luke ferdig"
        aria-live="polite"
      >
        <div className="tracker-head">
          <span className="tracker-week">Luke {finished.door} er ferdig</span>
          <span className="tracker-title">{finished.title}</span>
        </div>
        <p className="tracker-goal">Luka lyser nå i journalen.</p>
        <div className="tracker-foot">
          <button
            type="button"
            className="btn btn--amber tracker-celebrate"
            onClick={onShowCelebration}
          >
            Se feiringen
          </button>
        </div>
      </section>
    );
  }

  const title = !current
    ? "Ferdig for nå"
    : offered
      ? "Snakk med Brann"
      : current.quest.title;

  return (
    <section
      className={`tracker frame frame--slate${ready ? " is-ready" : ""}`}
      aria-label="Dagens luke"
    >
      <button
        type="button"
        className="tracker-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tracker-week">
          {current ? `Luke ${current.quest.door}` : "Julekalenderen"}
          {current?.quest.bonus && " · ☆ Bonus · valgfri"}
        </span>
        <span className="tracker-title">{title}</span>
      </button>

      {open && (
        <>
          {current && offered && (
            <p className="tracker-goal">
              {metBrann
                ? "Ny luke er åpen. Brann forteller hva den handler om."
                : "Brann har noe til deg."}
            </p>
          )}
          {current && !offered && (
            <>
              <p className="tracker-goal">{renderText(current.quest.goal)}</p>
              {ready && (
                <p className="tracker-ready">
                  {current.quest.checkedBy === "window"
                    ? "Alle sjekker består. Lukk kodevinduet for å fullføre."
                    : "Alle sjekker består."}
                </p>
              )}
              {current.result.objectives && (
                <ul className="tracker-list">
                  {current.result.objectives.map((o) => (
                    <li
                      key={o.label}
                      className={o.done ? "is-done" : undefined}
                    >
                      <span className="tracker-box">
                        {o.done && <IconCheck size={12} />}
                      </span>
                      {o.label}
                    </li>
                  ))}
                </ul>
              )}
              {(current.result.message ||
                current.quest.checkedBy === "code") && (
                <p className="tracker-note">
                  {renderText(
                    current.result.message ??
                      "Kriteriene avgjøres av koden din: kjør `npm run quest` når du er klar.",
                  )}
                </p>
              )}
            </>
          )}
          {!current && (
            <p className="tracker-goal">
              {waiting?.opensAt
                ? `Neste luke åpner ${waiting.opensAt.toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}.`
                : "Ingen flere luker ennå. Nye kommer med kalenderen."}
            </p>
          )}
          {step && !ready && (
            <div className="tracker-step">
              <button
                type="button"
                className="btn btn--amber tracker-step-btn"
                onClick={runStep}
              >
                {step.label}
              </button>
            </div>
          )}
          <div className="tracker-foot">
            <span className="tracker-meta">
              {board.completedCount} av {board.total} luker, nivå {forgeLevel}
            </span>
            <button type="button" className="tracker-log" onClick={onOpenLog}>
              Kalender og journal
            </button>
          </div>
        </>
      )}
    </section>
  );
}
