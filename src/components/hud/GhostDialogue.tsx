"use client";

import FigureCanvas from "../figure/FigureCanvas";
import type { GhostInput } from "@/game/ghosts";
import type { PickedLine } from "@/game/ghostLines";

type Props = {
  speaker: GhostInput;
  line: PickedLine;
  onMore: () => void; // another line (also E)
  onClose: () => void;
};

// Talking to another player's ghost: one line at a time, with their own word
// in colour. Everything is plain text, never HTML.
export default function GhostDialogue({
  speaker,
  line,
  onMore,
  onClose,
}: Props) {
  return (
    <section
      className="dialogue frame frame--wood"
      role="dialog"
      aria-label={speaker.name}
    >
      <div className="dialogue-portrait frame frame--inset">
        <FigureCanvas choice={speaker.figure} scale={4} label={speaker.name} />
      </div>
      <div className="dialogue-body">
        <p className="dialogue-name">{speaker.name}</p>
        <div className="dialogue-speech" aria-live="polite">
          {line.parts.map((part, i) =>
            part.word ? (
              <strong key={i} className="ghost-word">
                {part.text}
              </strong>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </div>
        <div className="dialogue-actions">
          <button type="button" className="btn btn--amber" onClick={onMore}>
            Si noe mer <kbd>E</kbd>
          </button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Ha det <kbd>Esc</kbd>
          </button>
        </div>
      </div>
    </section>
  );
}
