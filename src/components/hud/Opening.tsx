"use client";

import { useEffect } from "react";

type Props = { onStart: () => void };

// The first thing a new player sees: three lines of story over the village,
// then straight into the game. Any key or a click starts; it never shows again
// (progress.introSeen).
export default function Opening({ onStart }: Props) {
  useEffect(() => {
    const start = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      onStart();
    };
    window.addEventListener("keydown", start);
    return () => window.removeEventListener("keydown", start);
  }, [onStart]);

  return (
    <div className="opening" role="dialog" aria-label="Velkommen til Sanity-julekalenderen" onClick={onStart}>
      <div className="opening-text">
        <p className="opening-title">Sanity-julekalenderen</p>
        <p>24 luker med små Sanity-oppgaver.</p>
        <p>Du løser dem i din egen Sanity Studio, og ser resultatet her i spillet.</p>
        <p>Smeden Brann gir deg dagens luke.</p>
        <p className="opening-start">
          Trykk en tast for å begynne <span className="opening-cursor" aria-hidden />
        </p>
      </div>
    </div>
  );
}
