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
    <div className="opening" role="dialog" aria-label="Velkommen til Frostholm" onClick={onStart}>
      <div className="opening-text">
        <p className="opening-title">Frostholm</p>
        <p>Den lengste natta har lagt seg over bygda.</p>
        <p>Ilden i smia sloknet, og hvert eneste blad sprakk av frosten.</p>
        <p>Smeden Brann venter på noen som kan hjelpe ham.</p>
        <p className="opening-start">
          Trykk en tast for å begynne <span className="opening-cursor" aria-hidden />
        </p>
      </div>
    </div>
  );
}
