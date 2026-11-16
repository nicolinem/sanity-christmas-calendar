import type { GameItemView } from "@/game/items";
import { ELEMENTS } from "@/game/magic";

const KIND_LABEL = {
  weapon: "Våpen",
  material: "Materiale",
  potion: "Drikk",
} as const;

type Props = {
  item: GameItemView;
  equipped: boolean;
};

export default function ItemDetails({ item, equipped }: Props) {
  const weapon = item.kind === "weapon";

  return (
    <div className="item-details">
      <p className="tooltip-name">{item.name}</p>
      <p className="tooltip-stat">
        {item.kind ? KIND_LABEL[item.kind] : "Ukjent type"}
        {item.power && (
          <span className="tooltip-dmg">{item.power.damage} skade</span>
        )}
      </p>
      {item.magic.kind === "element" && (
        <p className={`tooltip-element el-${item.magic.element}`}>
          Navnet bærer {ELEMENTS[item.magic.element].title.toLowerCase()}
        </p>
      )}
      {item.magic.kind === "fizzle" && (
        <p className="tooltip-element el-fizzle">
          To elementer i ett navn: magien fuser ut
        </p>
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
        <p className="tooltip-warn">
          Ukjent sprite «{item.spriteId}», viser en reserve
        </p>
      )}
      {item.spriteId && item.knownSprite && !item.spriteMatchesKind && (
        <p className="tooltip-warn">
          Sprite «{item.spriteId}» passer ikke til denne typen; viser en reserve
        </p>
      )}
      {weapon && (
        <p className="tooltip-hint">
          {equipped ? "I hånda" : "Klikk for å ta i hånda"}
        </p>
      )}
    </div>
  );
}
