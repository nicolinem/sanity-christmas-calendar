"use client";

import { useEffect, useRef } from "react";

type Props = { door: number; title: string; onClose: () => void };

export default function QuestCelebration({ door, title, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="quest-celebration-backdrop" onClick={onClose}>
      <section
        className="quest-celebration frame frame--wood"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-celebration-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="quest-celebration-doorway" aria-hidden="true">
          <span className="quest-celebration-light" />
          <span className="quest-celebration-door quest-celebration-door--left" />
          <span className="quest-celebration-door quest-celebration-door--right" />
        </div>
        <div className="quest-celebration-copy">
          <p className="quest-celebration-kicker">Luke {door} er åpnet</p>
          <h2 id="quest-celebration-heading">Gratulerer!</h2>
          <p className="quest-celebration-title">{title}</p>
          <p className="quest-celebration-note">Du har åpnet en ny luke i Frostholm.</p>
          <button ref={closeRef} type="button" className="btn btn--amber" onClick={onClose}>
            Fortsett
          </button>
          <p className="quest-celebration-dismiss">Trykk Esc for å lukke</p>
        </div>
      </section>
    </div>
  );
}
