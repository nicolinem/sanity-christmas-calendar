"use client";

import type { GameItemView } from "@/game/items";
import { isUsableWeapon } from "@/game/items";
import SpriteIcon from "./SpriteIcon";
import { ENEMY_NAME, type CombatState } from "./useCombat";

type Props = {
  combat: CombatState;
  weapon: GameItemView | null;
};

// A slim strip above the hotbar while the knight is near the wraith, so the
// fight itself stays visible. The HP bar is segmented, one pip per 3 HP.
export default function EncounterPanel({ combat, weapon }: Props) {
  const { hp, maxHp, log, defeated, attack, reset } = combat;
  const pips = Math.ceil(maxHp / 3);
  const filled = Math.ceil(hp / 3);
  const usable = isUsableWeapon(weapon);

  return (
    <section className="encounter frame frame--frost" aria-label={`Kjemp mot ${ENEMY_NAME.toLowerCase()}`}>
      <div className={`encounter-portrait${defeated ? " is-defeated" : ""}`}>
        <SpriteIcon sprite={{ sheet: "dungeon", frame: 121 }} scale={2} />
      </div>

      <div className="encounter-main">
        <p className="encounter-head">
          <span className="encounter-name">{ENEMY_NAME}</span>
          <span className="encounter-hp">
            {hp}/{maxHp}
          </span>
        </p>
        <div className="hp" role="meter" aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp} aria-label="Draugens health">
          {Array.from({ length: pips }, (_, i) => (
            <span key={i} className={i < filled ? "on" : undefined} />
          ))}
        </div>
        <p className="encounter-line" aria-live="polite">
          {log[0] ??
            (weapon ? (
              <>
                {weapon.name}, <span className={usable ? "dmg" : "dmg dmg--none"}>
                  {usable ? `${weapon.power?.damage} skade` : "ingen skade"}
                </span>
              </>
            ) : (
              "Ingenting i hånda"
            ))}
        </p>
      </div>

      <div className="encounter-actions">
        {defeated ? (
          <button type="button" className="btn btn--amber" onClick={reset}>
            Ny kamp
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--amber" onClick={attack}>
              Angrip <kbd>Mellomrom</kbd>
            </button>
            <button type="button" className="btn btn--quiet" onClick={reset} title="Start kampen på nytt">
              Start på nytt
            </button>
          </>
        )}
      </div>
    </section>
  );
}
