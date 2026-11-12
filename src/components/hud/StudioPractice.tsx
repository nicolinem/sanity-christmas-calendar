import type { QuestState } from "@/game/quests/types";
import { openStudio } from "./studioPane";

export default function StudioPractice({
  state,
  codePassed,
  onLeave,
}: {
  state: QuestState;
  codePassed: boolean;
  onLeave: () => void;
}) {
  if (!codePassed || !state.quest.studioPractice) return null;

  return (
    <div className="studio-practice">
      <p>Se resultatet i Studio hvis du vil.</p>
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
      </div>
    </div>
  );
}
