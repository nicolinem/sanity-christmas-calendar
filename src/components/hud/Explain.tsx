import type { Quest } from "@/game/quests/types";
import { renderText } from "./richText";

// «Dette lager du» and «Hvorfor»: what the player builds, and why it matters.
export default function Explain({ quest }: { quest: Quest }) {
  return (
    <div className="log-explain">
      <p>
        <span className="log-explain-label">Dette lager du</span>
        {renderText(quest.explain.what)}
      </p>
      <p>
        <span className="log-explain-label">Hvorfor</span>
        {renderText(quest.explain.why)}
      </p>
    </div>
  );
}
