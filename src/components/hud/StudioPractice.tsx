import { useId } from "react";
import type { QuestState } from "@/game/quests/types";
import { renderText } from "./richText";
import { openStudio } from "./studioPane";

export default function StudioPractice({
  state,
  codePassed,
  onConfirm,
  onLeave,
}: {
  state: QuestState;
  codePassed: boolean;
  onConfirm: () => void;
  onLeave: () => void;
}) {
  const noteId = useId();
  if (state.status !== "active" || !state.quest.studioPractice) return null;

  return (
    <div className="studio-practice">
      <p><strong>Prøv det i Studio</strong></p>
      <p>{renderText(state.quest.studioPractice)}</p>
      <p id={noteId} className="tracker-note">
        {codePassed
          ? "Bekreft når du har prøvd det. Dette er din egen bekreftelse; spillet vurderer ikke Studio automatisk."
          : "Oppfyll kriteriene i kodevinduet først. Deretter kan du prøve og bekrefte i Studio."}
      </p>
      <div className="dialogue-actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            openStudio();
            onLeave();
          }}
        >
          Åpne Sanity Studio
        </button>
        <button
          type="button"
          className="btn btn--amber"
          disabled={!codePassed}
          aria-describedby={noteId}
          onClick={onConfirm}
        >
          Jeg har prøvd dette i Studio
        </button>
      </div>
    </div>
  );
}