"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GameItemView } from "@/game/items";
import type { QuestState } from "@/game/quests/types";
import type { QuestBoard } from "@/game/quests/engine";
import { NPCS, QUEST_SITES, type NpcId, type QuestSiteId } from "@/game/village";
import { giverOf, lukeName } from "@/game/quests/label";
import SpriteIcon from "./SpriteIcon";
import GoalPreview from "./goalPreviews";
import { IconQuill } from "./icons";
import { renderText } from "./richText";
import { openStudio } from "./studioPane";

type Props = {
  npc: NpcId; // who the player is talking to
  board: QuestBoard;
  forged: GameItemView | undefined;
  sanityConfigured: boolean | null;
  fetchFailed: boolean; // configured, but the project couldn't be read
  unclaimed: boolean; // made by `npm run setup` and not claimed yet
  refreshing: boolean;
  checked: boolean; // the player has asked the forge at least once
  onCheck: () => void;
  onTravelToSite: (siteId: QuestSiteId) => void;
  onOpenCode: (questId: string) => void;
  onClose: () => void;
};

const FIRST_QUEST = "the-broken-forge";

// The giver (Brann, Arkivaren or Bakeren) introduces the task and points
// toward its place in the village. Anyone else just says who to talk to. The
// location is optional; the quest log and code window are available anywhere.
// The pages stay fixed during a conversation; GameClient remounts on new quests.
export default function ForgeDialogue(props: Props) {
  const { board, forged, sanityConfigured } = props;
  const speaker = NPCS[props.npc];
  const giver = board.current ? giverOf(board.current.quest) : NPCS.brann;
  // Someone else's luke: say who has a new one, or that it's already yours.
  const elsewhere = Boolean(board.current) && giver.id !== speaker.id;
  const waitingAtGiver =
    board.current?.status === "offered" && !board.current.pickup;
  const [pages] = useState<ReactNode[]>(() =>
    !elsewhere
      ? buildPages(board, forged, sanityConfigured)
      : waitingAtGiver
        ? [
            <>
              {giver.name} har en ny luke til deg. Du finner {giver.name}{" "}
              {giver.at}.
            </>,
          ]
        : [
            <>
              Jeg har ingen luke til deg akkurat nå. Det du jobber med, står i
              journalen (J).
            </>,
          ],
  );
  const [page, setPage] = useState(0);
  const last = page >= pages.length - 1;
  const continueRef = useRef<HTMLButtonElement>(null);
  const studioRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (last
      ? (studioRef.current ??
        bodyRef.current?.querySelector<HTMLButtonElement>("button"))
      : continueRef.current
    )?.focus({
      preventScroll: true,
    });
  }, [last, page]);

  // Enter turns the page. Capture phase keeps it from also triggering the game key handler.
  useEffect(() => {
    if (last) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (
        e.key === "Enter" &&
        (e.target as HTMLElement)?.closest?.("button, a")
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setPage((p) => p + 1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [last]);

  const current = board.current;

  return (
    <section
      className="dialogue frame frame--wood"
      role="dialog"
      aria-label={speaker.title ? `${speaker.name}, ${speaker.title}` : speaker.name}
    >
      <div className="dialogue-portrait frame frame--inset">
        <SpriteIcon sprite={speaker.sprite} scale={4} />
      </div>
      <div ref={bodyRef} className="dialogue-body">
        <p className="dialogue-name">
          {speaker.name}
          {speaker.title && `, ${speaker.title}`}
          {current && !elsewhere && sanityConfigured !== false && (
            <>
              {" "}
              <span className="dialogue-task">{lukeName(current.quest)}</span>
            </>
          )}
          {pages.length > 1 && (
            <>
              {" "}
              <span className="dialogue-page">
                {page + 1}/{pages.length}
              </span>
            </>
          )}
        </p>
        <div className="dialogue-speech" aria-live="polite">
          {pages[page]}
        </div>
        {last && current && !elsewhere && sanityConfigured !== false && (
          <div className="dialogue-picture">
            <GoalPreview quest={current.quest} />
          </div>
        )}

        {last && elsewhere ? (
          <div className="dialogue-actions">
            {waitingAtGiver && (
              <button
                type="button"
                className="btn btn--amber"
                onClick={() => props.onTravelToSite(giver.site)}
              >
                Gå til {giver.name}
              </button>
            )}
            <button
              type="button"
              className="btn btn--quiet"
              onClick={props.onClose}
            >
              Gå <kbd>Esc</kbd>
            </button>
          </div>
        ) : last ? (
          <Details {...props} studioRef={studioRef} />
        ) : (
          <div className="dialogue-actions">
            <button
              ref={continueRef}
              type="button"
              className="btn btn--amber"
              onClick={() => setPage((p) => p + 1)}
            >
              Fortsett <kbd>Enter</kbd>
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={props.onClose}
            >
              Gå <kbd>Esc</kbd>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function buildPages(
  board: QuestBoard,
  forged: GameItemView | undefined,
  sanityConfigured: boolean | null,
): ReactNode[] {
  if (sanityConfigured === false) {
    return [
      <>
        Spillet er ikke koblet til et Sanity-prosjekt ennå, så du får bare
        øvingsutstyr. Kjør <code>npm run setup</code> i repoet, og kom tilbake.
      </>,
    ];
  }
  const { current, previous } = board;
  // Only the one who gave the finished luke praises it.
  const reaction =
    previous &&
    current?.status === "offered" &&
    giverOf(previous.quest).id === giverOf(current.quest).id
      ? [<Reaction key="r" state={previous} />]
      : [];
  if (!current) {
    return [
      ...reaction,
      <>
        Det var alle lukene som er åpne nå. Se det du har gjort i journalen (J),
        og kom tilbake når neste luke åpner.
      </>,
    ];
  }
  const place = current.quest.villageSite
    ? QUEST_SITES[current.quest.villageSite].label.toLowerCase()
    : undefined;
  const placePhrase =
    current.quest.villageSite === "noticeboard"
      ? "på oppslagstavla"
      : place && current.quest.villageSite !== "forge"
        ? `ved ${place}`
        : undefined;
  const introPages = current.quest.intro.map((text, index) => (
    <>
      {renderText(text)}
      {index === current.quest.intro.length - 1 && placePhrase && (
        <>
          {" "}
          Oppgaven ligger {placePhrase}. Gå dit og hent den, så kan du jobbe med
          den hvor du vil.
        </>
      )}
    </>
  ));
  // Explained, but not picked up yet: a short reminder of where it waits.
  if (current.pickup && placePhrase) {
    return [
      ...reaction,
      <>
        Oppgaven ligger {placePhrase}. Gå dit og trykk E for å hente den.
        Etterpå kan du jobbe med den hvor du vil.
      </>,
    ];
  }
  if (current.status === "offered") {
    return [...reaction, ...introPages];
  }
  // Already handed over: a short reminder.
  if (current.quest.id === FIRST_QUEST) {
    return [
      forged ? (
        <>
          <strong>{forged.name}</strong> er klart, og gjør{" "}
          {forged.power?.damage ?? 0} skade. Nå gjenstår bare snømonsteret øst
          for brønnen.
        </>
      ) : (
        <>{current.quest.intro[current.quest.intro.length - 1]}</>
      ),
    ];
  }
  return [
    <>
      Vi er ikke ferdige med {lukeName(current.quest).toLowerCase()} ennå.{" "}
      {renderText(current.quest.goal)}{" "}
      {placePhrase && <>Oppgaven ligger {placePhrase}. </>}
      Se hva som gjenstår i journalen (J).
    </>,
  ];
}

// The giver on the quest you just finished, and what it taught you.
function Reaction({ state }: { state: QuestState }) {
  return (
    <>
      {state.quest.outro?.map((line) => (
        <span key={line}>{renderText(line)} </span>
      ))}
      {lukeName(state.quest)} er krysset ut i journalen. Det du lærte:
      <span className="dialogue-lesson">
        <span className="dialogue-lesson-title">
          {renderText(state.quest.lesson.title)}
        </span>
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
  onTravelToSite,
  onOpenCode,
  onClose,
  studioRef,
}: Props & { studioRef: React.RefObject<HTMLButtonElement | null> }) {
  const current = board.current;
  const firstForging = current?.quest.id === FIRST_QUEST && !forged;
  // Waiting at its place: send the player there to pick it up.
  const remoteSite = current?.pickup;
  // Written in the game's code window, not in the Studio or the repo.
  const inWindow =
    current?.quest.checkedBy === "window" && sanityConfigured !== false;

  return (
    <>
      {firstForging && sanityConfigured !== false && (
        <ol className="dialogue-steps">
          <li>
            Åpne Sanity Studio og lag et nytt <span className="term">Item</span>
            -dokument
          </li>
          <li>
            Velg <span className="term">Weapon</span>, gi det et navn og en
            sprite
          </li>
          <li>
            Trykk <span className="term">Publish</span>, og se våpenet dukke opp
            i spillet
          </li>
        </ol>
      )}

      {fetchFailed && !refreshing && (
        <p className="dialogue-feedback" role="status">
          Spillet når ikke Sanity-prosjektet ditt. Er{" "}
          <span className="term">dataset</span>-et privat, kan ikke spillet lese
          det. Kjør <code>npm run setup</code> for å sjekke.
        </p>
      )}

      {firstForging &&
        checked &&
        !refreshing &&
        !fetchFailed &&
        sanityConfigured !== false && (
          <p className="dialogue-feedback" role="status">
            Ingen våpen ennå. Bare publiserte våpen kommer med, ikke{" "}
            <span className="term">drafts</span>.
          </p>
        )}

      {unclaimed && firstForging && (
        <p className="dialogue-hint">
          Første gang i Studio? Åpne innloggingslenken som{" "}
          <code>npm run setup</code> skrev ut. Kjør den på nytt for å se lenken.
          Studio husker deg etterpå.
        </p>
      )}

      <div className="dialogue-actions">
        {remoteSite && current ? (
          <button
            ref={studioRef}
            type="button"
            className="btn btn--amber"
            onClick={() => onTravelToSite(remoteSite)}
          >
            Gå til {QUEST_SITES[remoteSite].label.toLowerCase()}
          </button>
        ) : inWindow && current ? (
          <button
            ref={studioRef}
            type="button"
            className="btn btn--amber"
            onClick={() => onOpenCode(current.quest.id)}
          >
            Åpne kodevinduet
          </button>
        ) : current ? (
          <>
            <button
              ref={studioRef}
              type="button"
              className="btn btn--amber"
              onClick={openStudio}
            >
              <IconQuill />
              Åpne Sanity Studio
            </button>
            <button
              type="button"
              className="btn"
              onClick={onCheck}
              disabled={refreshing}
            >
              {refreshing ? "Sjekker…" : "Sjekk på nytt"}
            </button>
          </>
        ) : null}
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Gå <kbd>Esc</kbd>
        </button>
      </div>
    </>
  );
}
