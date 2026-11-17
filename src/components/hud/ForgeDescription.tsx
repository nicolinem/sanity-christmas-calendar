import type { GameItemView } from "@/game/items";
import SpriteIcon from "./SpriteIcon";

const firstSentence = (text: string) =>
  text.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? text.trim();

export default function ForgeDescription({
  weapon,
}: {
  weapon: GameItemView | undefined;
}) {
  return (
    <aside
      className="forge-description frame frame--wood"
      aria-label="Tavla i smia"
    >
      <SpriteIcon sprite={{ sheet: "town", frame: 83 }} scale={2} />
      <span>
        <strong>{weapon?.name ?? "Våpenet ditt"}</strong>
        {weapon?.description?.trim()
          ? firstSentence(weapon.description)
          : "Ingen publisert beskrivelse ennå."}
      </span>
    </aside>
  );
}
