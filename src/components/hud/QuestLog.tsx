"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/game/quests/chapters";
import type { QuestBoard } from "@/game/quests/engine";
import type { QuestState } from "@/game/quests/types";
import type { QuestSiteId } from "@/game/village";
import { forgedPower } from "@/game/rules";
import { IconCheck } from "./icons";
import GoalPreview from "./goalPreviews";
import { renderText } from "./richText";
import VillageMap from "./VillageMap";

type Props = {
  board: QuestBoard;
  initialTab?: "quests" | "map" | "book";
  initialQuestId?: string;
  forgeLevel: number;
  hintsShown: Record<string, number>;
  onRevealHint: (questId: string) => void;
  onOpenCode: (questId: string) => void;
  onTravelToSite: (siteId: QuestSiteId) => void;
  onClose: () => void;
  onReset: () => void;
};

type Tab = "quests" | "map" | "book";

// The calendar: every door by week, what's done, what's next, and the layered
// hints. Lessons collects what each finished door taught. Weeks that aren't
// built yet only show their topics, as a taste of what's coming.
export default function QuestLog({
  board,
  initialTab = "quests",
  initialQuestId,
  forgeLevel,
  hintsShown,
  onRevealHint,
  onOpenCode,
  onTravelToSite,
  onClose,
  onReset,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedId, setSelectedId] = useState(
    initialQuestId ?? board.current?.quest.id ?? board.states[0]?.quest.id,
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const selected =
    board.states.find((s) => s.quest.id === selectedId) ?? board.states[0];
  const lessons = board.states.filter((s) => s.status === "done");

  return (
    <div className="log-backdrop" onClick={onClose}>
      <section
        className="log frame frame--slate"
        role="dialog"
        aria-modal="true"
        aria-label="Kalender"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="log-head">
          <div className="log-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "quests"}
              className={`log-tab${tab === "quests" ? " is-on" : ""}`}
              onClick={() => setTab("quests")}
            >
              Luker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "book"}
              className={`log-tab${tab === "book" ? " is-on" : ""}`}
              onClick={() => setTab("book")}
            >
              Lærdommer
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "map"}
              className={`log-tab${tab === "map" ? " is-on" : ""}`}
              onClick={() => setTab("map")}
            >
              Kart
            </button>
          </div>
          <p className="log-meta">
            Nivå {forgeLevel}: våpnene gjør {forgedPower(forgeLevel).damage}{" "}
            skade
          </p>
          <button
            ref={closeRef}
            type="button"
            className="btn btn--quiet"
            onClick={onClose}
          >
            Lukk <kbd>Esc</kbd>
          </button>
        </header>

        {tab === "quests" ? (
          <div className="log-body">
            <nav className="log-list" aria-label="Luker">
              {CHAPTERS.map((chapter) => {
                const states = board.states.filter(
                  (s) => s.chapter.number === chapter.number,
                );
                return (
                  <div key={chapter.number} className="log-chapter">
                    <p className="log-chapter-title">
                      Uke {chapter.number}: {chapter.title}
                    </p>
                    <ul>
                      {states.map((s) => (
                        <li key={s.quest.id}>
                          <button
                            type="button"
                            className={`log-quest is-${s.status}${s === selected ? " is-selected" : ""}`}
                            onClick={() => setSelectedId(s.quest.id)}
                            aria-current={s === selected ? "true" : undefined}
                          >
                            <span className="tracker-box">
                              {s.status === "done" && <IconCheck size={12} />}
                            </span>
                            <span>
                              Luke {s.quest.door}:{" "}
                              {s.status === "offered"
                                ? "snakk med Brann"
                                : s.quest.title}
                              {s.quest.bonus && (
                                <span className="log-bonus">
                                  {" "}
                                  ☆ Bonus · valgfri
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                      {states.length === 0 &&
                        chapter.teaser?.map((name) => (
                          <li key={name} className="log-quest is-teaser">
                            <span className="tracker-box" />
                            {name}
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              })}
            </nav>

            {selected && (
              <QuestDetail
                state={selected}
                shown={hintsShown[selected.quest.id] ?? 0}
                onMoreHint={() => onRevealHint(selected.quest.id)}
                onOpenCode={() => onOpenCode(selected.quest.id)}
              />
            )}
          </div>
        ) : tab === "map" ? (
          <div className="log-map-panel">
            <VillageMap
              board={board}
              selectedId={selected?.quest.id}
              onSelect={setSelectedId}
              onTravel={onTravelToSite}
              onOpenQuest={(questId) => {
                setSelectedId(questId);
                setTab("quests");
              }}
            />
          </div>
        ) : (
          <div className="log-book">
            {lessons.length === 0 ? (
              <p className="log-locked">
                Her samles det du lærer. Fullfør en luke for å få den første.
              </p>
            ) : (
              lessons.map((s) => (
                <article key={s.quest.id} className="log-lesson">
                  <p className="log-lesson-quest">
                    Luke {s.quest.door}: {s.quest.title}
                  </p>
                  <h3 className="log-lesson-title">
                    {renderText(s.quest.lesson.title)}
                  </h3>
                  <p className="log-lesson-text">
                    {renderText(s.quest.lesson.text)}
                  </p>
                  {s.quest.learn && (
                    <a
                      className="log-learn"
                      href={s.quest.learn.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Les mer: {s.quest.learn.label}
                    </a>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        <footer className="log-foot">
          <button
            type="button"
            className="btn btn--quiet log-reset"
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              onReset();
              setConfirmReset(false);
            }}
            onBlur={() => setConfirmReset(false)}
          >
            {confirmReset
              ? "Klikk igjen for å slette fremgangen din"
              : "Nullstill fremgang"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function QuestDetail({
  state,
  shown,
  onMoreHint,
  onOpenCode,
}: {
  state: QuestState;
  shown: number;
  onMoreHint: () => void;
  onOpenCode: () => void;
}) {
  const { quest, status, result } = state;

  if (status === "locked" || status === "offered") {
    return (
      <article className="log-detail">
        <h3 className="log-quest-title">
          Luke {quest.door}
          {status === "offered" ? "" : `: ${quest.title}`}
          {quest.bonus && <span className="log-bonus">☆ Bonus · valgfri</span>}
        </h3>
        <p className="log-locked">
          {status === "offered"
            ? "Luken er åpen. Snakk med Brann ved smia for å få oppgaven."
            : state.opensAt
              ? `Åpner ${state.opensAt.toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}.`
              : "Fullfør luken før for å åpne denne."}
        </p>
      </article>
    );
  }

  return (
    <article className="log-detail">
      <h3 className="log-quest-title">
        Luke {quest.door}: {quest.title}
        {quest.bonus && <span className="log-bonus">☆ Bonus · valgfri</span>}
        {status === "done" && <span className="log-done">Ferdig</span>}
      </h3>
      <p className="log-intro">
        «{renderText(quest.intro[quest.intro.length - 1])}»
      </p>
      <p className="log-goal">{renderText(quest.goal)}</p>
      {status !== "done" && <GoalPreview quest={quest} />}
      {quest.where && (
        <p className="log-where">
          <span className="log-where-label">Hvor du jobber</span>{" "}
          {renderText(quest.where)}
        </p>
      )}

      {result.objectives && (
        <ul className="tracker-list">
          {result.objectives.map((o) => (
            <li key={o.label} className={o.done ? "is-done" : undefined}>
              <span className="tracker-box">
                {o.done && <IconCheck size={12} />}
              </span>
              {o.label}
            </li>
          ))}
        </ul>
      )}
      {status !== "done" && result.message && (
        <p className="tracker-note">{renderText(result.message)}</p>
      )}

      <p className="log-checked">
        {quest.checkedBy === "code" ? (
          <>
            Når det virker: kjør <code>npm run quest</code> i terminalen, og
            trykk «Sjekk på nytt».
          </>
        ) : quest.checkedBy === "window" ? (
          "Kodevinduet prøver koden din mens du skriver."
        ) : (
          "Spillet merker dette av seg selv."
        )}
        {quest.reward && " Belønning: våpnene dine blir sterkere."}
      </p>
      {quest.checkedBy === "window" && (
        <button
          type="button"
          className="btn btn--amber log-code"
          onClick={onOpenCode}
        >
          {status === "done" ? "Se koden igjen" : "Åpne kodevinduet"}
        </button>
      )}
      {quest.hints.length > 0 && status !== "done" && (
        <div className="log-hints">
          {quest.hints.slice(0, shown).map((hint, i) => (
            <p key={i} className="log-hint">
              <span className="log-hint-n">Hint {i + 1}</span>{" "}
              {renderText(hint.text)}
              {hint.link && (
                <>
                  {" "}
                  <a
                    className="log-hint-link"
                    href={hint.link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {hint.link.label}
                  </a>
                </>
              )}
            </p>
          ))}
          {shown < quest.hints.length && (
            <button
              type="button"
              className="btn btn--quiet"
              onClick={onMoreHint}
            >
              {shown === 0 ? "Vis et hint" : "Vis et hint til"}
            </button>
          )}
        </div>
      )}

      {status === "done" ? (
        <div className="log-lesson log-lesson--inline">
          <h4 className="log-lesson-title">
            Lærdom: {renderText(quest.lesson.title)}
          </h4>
          <p className="log-lesson-text">{renderText(quest.lesson.text)}</p>
        </div>
      ) : (
        quest.learn && (
          <a
            className="log-learn"
            href={quest.learn.url}
            target="_blank"
            rel="noreferrer"
          >
            Les mer: {quest.learn.label}
          </a>
        )
      )}
    </article>
  );
}
