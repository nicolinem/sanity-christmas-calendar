"use client";

import { useEffect, useRef, useState } from "react";
import type { GameItemView } from "@/game/items";
import { ELEMENTS } from "@/game/magic";

const KIND_LABEL = { weapon: "Våpen", material: "Materiale", potion: "Drikk" } as const;
import SpriteIcon from "./SpriteIcon";
import { IconRefresh } from "./icons";

type Props = {
  items: GameItemView[];
  equippedId: string | null;
  onEquip: (item: GameItemView) => void;
  onRefresh: () => void;
  refreshing: boolean;
  slots: number;
};

// The belt: every item the game knows about, as pixel slots. Weapons equip on
// click (or number keys). Items whose sprite id the game doesn't recognise still
// get a slot with a fallback sprite and say so in their tooltip — proof the
// world accepts unknown content. Overflow goes into the bag.
export default function Hotbar({ items, equippedId, onEquip, onRefresh, refreshing, slots }: Props) {
  const [bagOpen, setBagOpen] = useState(false);
  const bagRef = useRef<HTMLDivElement>(null);
  const belt = items.slice(0, slots);
  const bag = items.slice(slots);

  useEffect(() => {
    if (!bagOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !bagRef.current?.contains(e.target as Node))
        setBagOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [bagOpen]);

  return (
    <div className="hotbar frame frame--slate" role="toolbar" aria-label="Utstyr">
      <ul className="hotbar-slots">
        {belt.map((item, i) => (
          <li key={item.id}>
            <Slot item={item} hotkey={i + 1} equipped={item.id === equippedId} onEquip={onEquip} />
          </li>
        ))}
        {items.length === 0 && <li className="hotbar-empty">Sekken er tom</li>}
      </ul>

      {bag.length > 0 && (
        <div className="bag" ref={bagRef}>
          <button
            type="button"
            className="slot slot--tool"
            aria-expanded={bagOpen}
            onClick={() => setBagOpen((o) => !o)}
            title={`${bag.length} til i sekken`}
          >
            <SpriteIcon sprite={{ sheet: "town", frame: 107 }} />
            <span className="slot-count">+{bag.length}</span>
          </button>
          {bagOpen && (
            <div className="bag-panel frame frame--slate">
              <p className="bag-title">Sekken</p>
              <ul className="bag-grid">
                {bag.map((item) => (
                  <li key={item.id}>
                    <Slot item={item} equipped={item.id === equippedId} onEquip={onEquip} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="slot slot--tool"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label={refreshing ? "Henter gjenstander" : "Hent gjenstander på nytt"}
        title="Hent gjenstandene dine fra Sanity på nytt"
      >
        <IconRefresh spinning={refreshing} />
      </button>
    </div>
  );
}

function Slot({
  item,
  hotkey,
  equipped,
  onEquip,
}: {
  item: GameItemView;
  hotkey?: number;
  equipped: boolean;
  onEquip: (item: GameItemView) => void;
}) {
  const weapon = item.kind === "weapon";
  const power = item.power;
  const tipId = `tip-${item.id}`;
  return (
    <div className="slot-wrap">
      <button
        type="button"
        className={`slot${equipped ? " is-equipped" : ""}${weapon ? "" : " is-passive"}`}
        onClick={() => weapon && onEquip(item)}
        aria-disabled={!weapon}
        aria-pressed={weapon ? equipped : undefined}
        aria-label={item.name}
        aria-describedby={tipId}
      >
        <SpriteIcon sprite={item.sprite} />
        {hotkey && hotkey < 10 && <span className="slot-key">{hotkey}</span>}
        {item.source === "sanity" && <span className="slot-mark" />}
        {item.spriteId && !item.knownSprite && <span className="slot-fallback" />}
      </button>
      <div className="tooltip frame frame--slate" role="tooltip" id={tipId}>
        <p className="tooltip-name">{item.name}</p>
        <p className="tooltip-stat">
          {item.kind ? KIND_LABEL[item.kind] : "Ukjent type"}
          {power && <span className="tooltip-dmg">{power.damage} skade</span>}
        </p>
        {item.magic.kind === "element" && (
          <p className={`tooltip-element el-${item.magic.element}`}>
            Navnet bærer {ELEMENTS[item.magic.element].title.toLowerCase()}
          </p>
        )}
        {item.magic.kind === "fizzle" && (
          <p className="tooltip-element el-fizzle">To elementer i ett navn: magien fuser ut</p>
        )}
        {item.description && <p className="tooltip-desc">{item.description}</p>}
        <p className="tooltip-source">
          {item.source === "sanity" ? (
            <>
              <span className="slot-mark slot-mark--inline" /> Smidd i Sanity
            </>
          ) : (
            "Innebygd"
          )}
        </p>
        {item.spriteId && !item.knownSprite && (
          <p className="tooltip-warn">Ukjent sprite «{item.spriteId}», viser en reserve</p>
        )}
        {weapon && <p className="tooltip-hint">{equipped ? "I hånda" : "Klikk for å ta i hånda"}</p>}
      </div>
    </div>
  );
}
