"use client";

import type { ReactNode } from "react";
import type { GameItemView } from "@/game/items";
import SpriteIcon from "./SpriteIcon";
import { IconRefresh } from "./icons";
import ItemDetails from "./ItemDetails";

type Props = {
  plate: ReactNode;
  items: GameItemView[];
  equippedId: string | null;
  onEquip: (item: GameItemView) => void;
  onOpenBag: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  slots: number;
};

// The belt: every item the game knows about, as pixel slots. Weapons equip on
// click (or number keys). Items whose sprite id the game doesn't recognise still
// get a slot with a fallback sprite and say so in their tooltip — proof the
// world accepts unknown content. Overflow goes into the bag.
export default function Hotbar({
  plate,
  items,
  equippedId,
  onEquip,
  onOpenBag,
  onRefresh,
  refreshing,
  slots,
}: Props) {
  const belt = items.slice(0, slots);
  const bag = items.slice(slots);

  return (
    <div
      className="hotbar frame frame--slate"
      role="toolbar"
      aria-label="Utstyr"
    >
      {plate}
      <ul className="hotbar-slots">
        {belt.map((item, i) => (
          <li key={item.id}>
            <Slot
              item={item}
              hotkey={i + 1}
              equipped={item.id === equippedId}
              onEquip={onEquip}
            />
          </li>
        ))}
      </ul>

      <span className="hotbar-sep" aria-hidden="true" />
      <button
        type="button"
        className="slot slot--tool"
        onClick={onOpenBag}
        aria-label="Tingene dine (I)"
        title="Tingene dine (I)"
      >
        <SpriteIcon sprite={{ sheet: "town", frame: 107 }} />
        {bag.length > 0 && <span className="slot-count">+{bag.length}</span>}
      </button>

      <button
        type="button"
        className="slot slot--tool"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label={
          refreshing ? "Henter gjenstander" : "Hent gjenstander på nytt"
        }
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
        {item.spriteId && (!item.knownSprite || !item.spriteMatchesKind) && (
          <span className="slot-fallback" />
        )}
      </button>
      <div className="tooltip frame frame--slate" role="tooltip" id={tipId}>
        <ItemDetails item={item} equipped={equipped} />
      </div>
    </div>
  );
}
