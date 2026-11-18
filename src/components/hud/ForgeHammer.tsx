import type { GameItemView } from "@/game/items";
import SpriteIcon from "./SpriteIcon";

export default function ForgeHammer({
  hammer,
}: {
  hammer: GameItemView | undefined;
}) {
  if (!hammer) return null;
  return (
    <aside
      className="forge-hammer frame frame--wood"
      aria-label="Hammeren på veggen"
    >
      <SpriteIcon sprite={hammer.sprite} scale={3} />
      <span>
        <strong>{hammer.name}</strong>
        {hammer.description}
      </span>
    </aside>
  );
}
