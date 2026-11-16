"use client";

import { useEffect, useRef, useState } from "react";

import type { QuestCelebration as Celebration } from "@/game/bridge";
import { IconCheck } from "./icons";
import SpriteIcon from "./SpriteIcon";
import { NPCS } from "@/game/village";

type Props = Celebration & {
  onClose: () => void;
  onOpenLog: () => void;
  onReadPage?: () => void; // the finished door's page in the journal
};

export default function QuestCelebration({
  door,
  bonus,
  title,
  lesson,
  objectives,
  level,
  nextDoor,
  nextGiver,
  onClose,
  onOpenLog,
  onReadPage,
}: Props) {
  const giver = NPCS[nextGiver ?? "brann"];
  const closeRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        const buttons =
          actionsRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const index = Array.from(buttons).indexOf(
          document.activeElement as HTMLButtonElement,
        );
        event.preventDefault();
        buttons[
          (index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length
        ]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, unlocked]);

  return (
    <div className="quest-celebration-backdrop" onClick={onClose}>
      <section
        className="quest-celebration frame frame--wood"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-celebration-heading"
        onClick={(event) => event.stopPropagation()}
      >
        {unlocked && (
          <div className="quest-celebration-doorway" aria-hidden="true">
            <span className="quest-celebration-light" />
            <span className="quest-celebration-door quest-celebration-door--left" />
            <span className="quest-celebration-door quest-celebration-door--right" />
          </div>
        )}
        <div
          key={unlocked ? "next" : "done"}
          className={`quest-celebration-copy${unlocked ? "" : " quest-celebration-copy--done"}`}
        >
          <p className="quest-celebration-kicker">
            {unlocked ? `Luke ${nextDoor}` : bonus ? "☆ Frivillig" : `Luke ${door}`}{" "}
            {unlocked ? "er åpnet" : "er fullført"}
          </p>
          <h2 id="quest-celebration-heading">
            {unlocked ? "Ny luke!" : "Gratulerer!"}
          </h2>
          <p className="quest-celebration-title">
            {unlocked ? `Neste oppgave venter hos ${giver.name}` : title}
          </p>
          {unlocked && (
            <div className="quest-celebration-guide">
              <span
                className="quest-celebration-guide-portrait"
                role="img"
                aria-label={giver.title ? `${giver.name}, ${giver.title}` : giver.name}
              >
                <SpriteIcon sprite={giver.sprite} scale={4} />
              </span>
            </div>
          )}
          {!unlocked && objectives && objectives.length > 0 && (
            <ul
              className="quest-celebration-checklist"
              aria-label="Krysset av i journalen"
            >
              {objectives.map((objective) => (
                <li key={objective}>
                  <IconCheck size={14} /> {objective}
                </li>
              ))}
            </ul>
          )}
          {unlocked ? (
            <p className="quest-celebration-note">
              Snakk med {giver.name} {giver.at} (E) for å få oppgaven. Den nye
              luka venter også i journalen.
            </p>
          ) : (
            <ul className="quest-celebration-traces" aria-label="Dette er nytt">
              <li>
                <span
                  className="quest-celebration-trace-icon is-lit"
                  aria-hidden="true"
                >
                  <SpriteIcon sprite={{ sheet: "town", frame: 84 }} scale={2} />
                </span>
                <span>{bonus ? "☆ Frivillig" : `Luke ${door}`} lyser i journalen</span>
              </li>
              {level && (
                <li className="quest-celebration-reward">
                  <span
                    className="quest-celebration-trace-icon"
                    aria-hidden="true"
                  >
                    <span className="quest-celebration-pips">
                      {Array.from({ length: 4 }, (_, i) => (
                        <span
                          key={i}
                          className={i < level.number ? "is-on" : undefined}
                        />
                      ))}
                    </span>
                  </span>
                  <span>
                    Nivå {level.number}! Våpnene dine gjør nå{" "}
                    {level.damage} skade.
                  </span>
                </li>
              )}
              <li>
                <span
                  className="quest-celebration-trace-icon"
                  aria-hidden="true"
                >
                  <span className="quest-celebration-page" />
                </span>
                <span>Ny side i boka: {lesson}</span>
              </li>
            </ul>
          )}
          <div className="quest-celebration-actions" ref={actionsRef}>
            <button
              ref={closeRef}
              type="button"
              className="btn btn--amber"
              onClick={
                nextDoor && !unlocked ? () => setUnlocked(true) : onClose
              }
            >
              {nextDoor && !unlocked ? "Se neste luke" : "Tilbake til bygda"}
            </button>
            {!unlocked && onReadPage && (
              <button type="button" className="btn" onClick={onReadPage}>
                Les siden
              </button>
            )}
            {unlocked && (
              <button type="button" className="btn" onClick={onOpenLog}>
                Åpne journalen
              </button>
            )}
          </div>
          <p className="quest-celebration-dismiss">Trykk Esc for å lukke</p>
        </div>
      </section>
    </div>
  );
}
