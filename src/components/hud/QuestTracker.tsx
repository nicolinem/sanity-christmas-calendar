"use client";

import { useState } from "react";
import type { QuestBoard } from "@/game/quests/engine";
import { QUEST_SITES } from "@/game/village";
import { IconCheck } from "./icons";
import { renderText } from "./richText";

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
export default function QuestTracker({
  board,
  forgeLevel,
  metBrann,
  compact,
  onOpenLog,
}: Props) {
  const [open, setOpen] = useState(!compact);
  const current = board.current;
  const waiting = !current
    ? board.states.find((s) => s.status === "locked" && s.opensAt)
    : undefined;
  const offered = current?.status === "offered";
  const place =
    current?.quest.villageSite && QUEST_SITES[current.quest.villageSite].label;
  const hasVillageDestination =
    current?.quest.villageSite && current.quest.villageSite !== "forge";

  const title = !current
    ? "Ferdig for nå"
    : offered
      ? "Snakk med Brann"
      : current.quest.title;

  return (
    <section className="tracker frame frame--slate" aria-label="Dagens luke">
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
                ? "Ny luke er åpen. Gå til Brann ved smia"
                : "Gå til Brann ved smia"}{" "}
              <kbd>E</kbd>
            </p>
          )}
          {current && !offered && (
            <>
              {hasVillageDestination && place && (
                <p className="tracker-note">
                  Valgfritt sted: {place}. Se Kart i journalen (J).
                </p>
              )}
              <p className="tracker-goal">{renderText(current.quest.goal)}</p>
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
