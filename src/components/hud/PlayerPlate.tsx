"use client";

import { FEATURES } from "@/game/features";
import type { FigureChoice } from "@/game/figure";
import FigureCanvas from "../figure/FigureCanvas";

type Props = {
  figure: FigureChoice;
  name: string;
  level: number;
  compact: boolean;
  onOpen: () => void;
};

export default function PlayerPlate({
  figure,
  name,
  level,
  compact,
  onOpen,
}: Props) {
  return (
    <div className="plate-wrap">
      <button
        type="button"
        className={`plate${compact ? " is-compact" : ""}`}
        onClick={onOpen}
        aria-label="Figur og utseende (C)"
        title="Figur og utseende (C)"
      >
        <span className="plate-portrait">
          <FigureCanvas choice={figure} scale={3} />
        </span>
        <span className="plate-who">
          {name && <span className="plate-name">{name}</span>}
          {FEATURES.rpg && <span className="plate-level">Nivå {level}</span>}
        </span>
      </button>
      <div className="tooltip frame frame--slate plate-tooltip" role="tooltip">
        <p className="tooltip-name">Figur og utseende</p>
        <p className="tooltip-desc">Bytt utseende og ta på det du har funnet</p>
      </div>
    </div>
  );
}
