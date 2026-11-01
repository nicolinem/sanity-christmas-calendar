"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GameItemView } from "@/game/items";
import type { QuestState } from "@/game/quests/types";
import type { QuestBoard } from "@/game/quests/engine";
import SpriteIcon from "./SpriteIcon";
import { IconQuill } from "./icons";
import { renderText } from "./richText";
import { openStudio } from "./studioPane";

type Props = {
  board: QuestBoard;
  forged: GameItemView | undefined;
  sanityConfigured: boolean | null;
  fetchFailed: boolean; // configured, but the project couldn't be read
  unclaimed: boolean; // made by `npm run setup` and not claimed yet
  refreshing: boolean;
  checked: boolean; // the player has asked the forge at least once
  onCheck: () => void;
  onOpenLog: () => void;
  hintsShown: number; // hints revealed so far for the current quest
  onRevealHint: (questId: string) => void;
  onClose: () => void;
};

const FIRST_QUEST = "the-broken-forge";

// Talking to Brann is where Sanity enters the story: he can't forge anything,
// but the player can, in the Studio. He speaks in short
// pages: a word about what you just did, then the next task. The pages are
// fixed when the conversation starts, so handing over a quest (which flips it
// from offered to active) doesn't change what he's in the middle of saying.
// GameClient remounts this component when the current quest changes.
export default function ForgeDialogue(props: Props) {
  const { board, forged, sanityConfigured } = props;
  const [pages] = useState(() => buildPages(board, forged, sanityConfigured));
  const [page, setPage] = useState(0);
  const last = page >= pages.length - 1;
  const continueRef = useRef<HTMLButtonElement>(null);
  const studioRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (last ? studioRef.current : continueRef.current)?.focus({ preventScroll: true });
  }, [last, page]);

  // E or Enter turns the page. Capture phase, so GameClient's "E closes the
  // dialogue" only applies on the last page.
  useEffect(() => {
    if (last) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "E" && e.key !== "Enter") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setPage((p) => p + 1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [last]);

  const current = board.current;

  return (
    <section className="dialogue frame frame--wood" role="dialog" aria-label="Brann, smeden">
      <div className="dialogue-portrait frame frame--inset">
        <SpriteIcon sprite={{ sheet: "dungeon", frame: 86 }} scale={4} />
      </div>
      <div className="dialogue-body">
        <p className="dialogue-name">
          Brann, smeden
          {current && sanityConfigured !== false && <span className="dialogue-task">Luke {current.quest.door}</span>}
          {pages.length > 1 && (
            <span className="dialogue-page">
              {page + 1}/{pages.length}
            </span>
          )}
        </p>
        <div className="dialogue-speech" aria-live="polite">
          {pages[page]}
        </div>

        {last ? (
          <Details {...props} studioRef={studioRef} />
        ) : (
          <div className="dialogue-actions">
            <button ref={continueRef} type="button" className="btn btn--amber" onClick={() => setPage((p) => p + 1)}>
              Fortsett <kbd>E</kbd>
            </button>
            <button type="button" className="btn btn--quiet" onClick={props.onClose}>
              Gå <kbd>Esc</kbd>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function buildPages(board: QuestBoard, forged: GameItemView | undefined, sanityConfigured: boolean | null): ReactNode[] {
  if (sanityConfigured === false) {
    return [
      <>
        Spillet er ikke koblet til et Sanity-prosjekt ennå, så du får bare øvingsutstyr. Kjør <code>npm run setup</code>{" "}
        i repoet, og kom tilbake.
      </>,
    ];
  }
  const { current, previous } = board;
  const reaction = previous ? [<Reaction key="r" state={previous} />] : [];
  if (!current) {
    return [...reaction, <>Det var alle lukene som er åpne nå. Kom tilbake når neste luke åpner.</>];
  }
  if (current.status === "offered") {
    return [...reaction, ...current.quest.intro.map((text) => <>{text}</>)];
  }
  // Already handed over: a short reminder.
  if (current.quest.id === FIRST_QUEST) {
    return [
      forged ? (
        <>
          <strong>{forged.name}</strong> er klart, og gjør {forged.power?.damage ?? 0} skade. Nå gjenstår bare
          snømonsteret øst for brønnen.
        </>
      ) : (
        <>{current.quest.intro[current.quest.intro.length - 1]}</>
      ),
    ];
  }
  return [
    <>
      Luke {current.quest.door}: {current.quest.title}. {renderText(current.quest.goal)}
    </>,
  ];
}

// Brann on the quest you just finished, and what it taught you.
function Reaction({ state }: { state: QuestState }) {
  return (
    <>
      Bra, luke {state.quest.door} er ferdig! Det du lærte:
      <span className="dialogue-lesson">
        <span className="dialogue-lesson-title">{renderText(state.quest.lesson.title)}</span>
        {renderText(state.quest.lesson.text)}
      </span>
    </>
  );
}

// The last page: what to do now, and the buttons to do it.
function Details({
  board,
  forged,
  sanityConfigured,
  fetchFailed,
  unclaimed,
  refreshing,
  checked,
  onCheck,
  onOpenLog,
  hintsShown,
  onRevealHint,
  onClose,
  studioRef,
}: Props & { studioRef: React.RefObject<HTMLButtonElement | null> }) {
  const current = board.current;
  const onboarding = !current || current.quest.id === FIRST_QUEST;
  const firstForging = onboarding && !forged;

  return (
    <>
      {firstForging && sanityConfigured !== false && (
        <ol className="dialogue-steps">
          <li>
            Åpne Sanity Studio og lag et nytt <span className="term">Item</span>-dokument
          </li>
          <li>
            Velg <span className="term">Weapon</span>, gi det et navn og en sprite
          </li>
          <li>
            Trykk <span className="term">Publish</span>, og se våpenet dukke opp i spillet
          </li>
        </ol>
      )}

      {fetchFailed && !refreshing && (
        <p className="dialogue-feedback" role="status">
          Spillet når ikke Sanity-prosjektet ditt. Er <span className="term">dataset</span>-et privat, kan ikke spillet lese det. Kjør{" "}
          <code>npm run setup</code> for å sjekke.
        </p>
      )}

      {firstForging && checked && !refreshing && !fetchFailed && sanityConfigured !== false && (
        <p className="dialogue-feedback" role="status">
          Ingen våpen ennå. Bare publiserte våpen kommer med, ikke <span className="term">drafts</span>.
        </p>
      )}

      {unclaimed && firstForging && (
        <p className="dialogue-hint">
          Første gang i Studio? Åpne innloggingslenken som <code>npm run setup</code> skrev ut. Kjør den på nytt
          for å se lenken. Studio husker deg etterpå.
        </p>
      )}

      {!onboarding && current && sanityConfigured !== false && (
        <TaskNotes state={current} hintsShown={hintsShown} onRevealHint={onRevealHint} refreshing={refreshing} />
      )}

      <div className="dialogue-actions">
        <button ref={studioRef} type="button" className="btn btn--amber" onClick={openStudio}>
          <IconQuill />
          Åpne Sanity Studio
        </button>
        <button type="button" className="btn" onClick={onCheck} disabled={refreshing}>
          {refreshing ? "Sjekker…" : "Sjekk på nytt"}
        </button>
        {!onboarding && (
          <button type="button" className="btn" onClick={onOpenLog}>
            Kalender <kbd>J</kbd>
          </button>
        )}
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Gå <kbd>Esc</kbd>
        </button>
      </div>
    </>
  );
}

// Under Brann's words: where to work, how he'll check it, his latest verdict,
// and hints the player can reveal one by one (shared with the quest log).
function TaskNotes({
  state,
  hintsShown,
  onRevealHint,
  refreshing,
}: {
  state: QuestState;
  hintsShown: number;
  onRevealHint: (questId: string) => void;
  refreshing: boolean;
}) {
  const { quest, result } = state;
  const hints = quest.hints.slice(0, hintsShown);
  return (
    <div className="dialogue-notes">
      {quest.where && (
        <p className="dialogue-note">
          <span className="dialogue-note-label">Hvor du jobber</span> {renderText(quest.where)}
        </p>
      )}
      {quest.checkedBy === "code" && (
        <p className="dialogue-note">
          <span className="dialogue-note-label">Slik sjekkes det</span> kjør <code>npm run quest</code> i terminalen,
          og trykk «Sjekk på nytt».
        </p>
      )}
      {result.message && !refreshing && !result.done && (
        <p className="dialogue-feedback" role="status">
          <span className="dialogue-note-label">Status</span> {renderText(result.message)}
        </p>
      )}
      {hints.map((hint, i) => (
        <p key={i} className="dialogue-note dialogue-hint-line">
          <span className="dialogue-note-label">Hint {i + 1}</span> {renderText(hint.text)}
          {hint.link && (
            <>
              {" "}
              <a className="log-hint-link" href={hint.link.url} target="_blank" rel="noreferrer">
                {hint.link.label}
              </a>
            </>
          )}
        </p>
      ))}
      {hintsShown < quest.hints.length && (
        <button type="button" className="dialogue-more-hint" onClick={() => onRevealHint(quest.id)}>
          {hintsShown === 0 ? "Trenger du et hint?" : "Et hint til"}
        </button>
      )}
    </div>
  );
}
