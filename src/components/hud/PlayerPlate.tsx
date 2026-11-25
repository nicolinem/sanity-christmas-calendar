"use client";

import { FEATURES } from "@/game/features";
import type { FigureChoice } from "@/game/figure";
import FigureCanvas from "../figure/FigureCanvas";
import { IconHeart } from "./icons";

type Props = {
  figure: FigureChoice;
  name: string;
  level: number;
  xp?: { into: number; needed: number };
  compact: boolean;
  hearts?: { hp: number; max: number };
  onOpen: () => void;
};

export default function PlayerPlate({
  figure,
  name,
  level,
  xp,
  compact,
  hearts,
  onOpen,
}: Props) {
  const count = hearts ? Math.floor(hearts.max / 2) : 0;
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
          {FEATURES.rpg && xp && (
            <span className="plate-xp" aria-hidden="true">
              <span
                className="plate-xp-fill"
                style={{
                  width: xp.needed ? `${(xp.into / xp.needed) * 100}%` : "100%",
                }}
              />
            </span>
          )}
          {hearts && (
            <span
              className="plate-hearts"
              role="img"
              aria-label={`Liv: ${String(hearts.hp / 2).replace(".", ",")} av ${hearts.max / 2} hjerter`}
            >
              {Array.from({ length: count }, (_, i) => (
                <IconHeart
                  key={i}
                  fill={
                    hearts.hp >= (i + 1) * 2
                      ? "full"
                      : hearts.hp === i * 2 + 1
                        ? "half"
                        : "empty"
                  }
                />
              ))}
            </span>
          )}
        </span>
      </button>
      <div className="tooltip frame frame--slate plate-tooltip" role="tooltip">
        <p className="tooltip-name">Figur og utseende</p>
        <p className="tooltip-desc">Bytt utseende og ta på det du har funnet</p>
      </div>
    </div>
  );
}
