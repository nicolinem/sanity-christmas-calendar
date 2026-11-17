"use client";

import { useCallback, useState } from "react";
import { bridge } from "@/game/bridge";
import type { GameItemView } from "@/game/items";
import { isUsableWeapon } from "@/game/items";
import type { Element } from "@/game/magic";

export const ENEMY_NAME = "Snømonsteret";
export const ENEMY_MAX_HP = 30;
// What the wraith fears and shrugs off. The weapon's name decides its element.
export const ENEMY_WEAK_TO: Element = "fire";
export const ENEMY_IMMUNE_TO: Element = "frost";
const WEAK_MULTIPLIER = 1.5; // kept small: name magic is mostly for fun

// A minimal combat demo. The forge level decides how hard a blade hits, and the
// element its name carries (Sanity content!) can make the Frost Wraith shrink
// back or shrug it off. This is the "data affects gameplay" proof. Rules live
// here; the scene only plays the hit/whiff effects it is told about.
export function useCombat(weapon: GameItemView | null) {
  const [hp, setHp] = useState(ENEMY_MAX_HP);
  const [log, setLog] = useState<string[]>([]);

  const defeated = hp <= 0;

  const attack = useCallback(() => {
    if (hp <= 0) return;
    if (!isUsableWeapon(weapon) || !weapon) {
      setLog((l) => [
        `Du svinger ${weapon ? weapon.name : "ingenting"}… men det biter ikke. Ta et ordentlig våpen i hånda!`,
        ...l,
      ]);
      bridge.emit("whiff", undefined);
      return;
    }
    const base = weapon.power?.damage ?? 0; // set by the forge level, see rules.ts
    const element =
      weapon.magic.kind === "element" ? weapon.magic.element : null;
    const affinity =
      element === ENEMY_WEAK_TO
        ? "weak"
        : element === ENEMY_IMMUNE_TO
          ? "immune"
          : undefined;
    const rolled = base + Math.floor(Math.random() * 3); // tiny variance
    const dmg =
      affinity === "immune"
        ? 0
        : affinity === "weak"
          ? Math.round(rolled * WEAK_MULTIPLIER)
          : rolled;
    const next = Math.max(0, hp - dmg);
    setHp(next);
    const flavour = affinity === "weak" ? " Monsteret tåler ikke ild!" : "";
    setLog((l) => [
      affinity === "immune"
        ? `Frosten i ${weapon.name} biter ikke på ${ENEMY_NAME.toLowerCase()}.`
        : next <= 0
          ? `${weapon.name} treffer for ${dmg}!${flavour} ${ENEMY_NAME} er beseiret!`
          : `${weapon.name} treffer for ${dmg}.${flavour}`,
      ...l,
    ]);
    bridge.emit("hit", { damage: dmg, defeated: next <= 0, affinity, element });
  }, [hp, weapon]);

  const reset = useCallback(() => {
    setHp(ENEMY_MAX_HP);
    setLog([]);
  }, []);

  return { hp, maxHp: ENEMY_MAX_HP, log, defeated, attack, reset };
}

export type CombatState = ReturnType<typeof useCombat>;
