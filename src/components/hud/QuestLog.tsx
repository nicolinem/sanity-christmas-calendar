"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/game/quests/chapters";
import { chapterOpensAt, type QuestBoard } from "@/game/quests/engine";
import type { Progress, QuestState } from "@/game/quests/types";
import type { QuestSiteId } from "@/game/village";
import { forgedPower, MAX_FORGE_LEVEL } from "@/game/rules";
import { IconCheck } from "./icons";
import GoalPreview from "./goalPreviews";
import { renderText } from "./richText";
import VillageMap from "./VillageMap";
import StudioPractice from "./StudioPractice";
import QuestHint from "./QuestHint";
import QuestBook from "./QuestBook";
import SpriteIcon from "./SpriteIcon";

const dateLabel = (date: Date) =>
  date.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });

type Props = {
  board: QuestBoard;
  initialTab?: "quests" | "map" | "book";
  initialQuestId?: string;
  forgeLevel: number;
  hintsShown: Record<string, number>;
  solvedTasks: Progress["solved"];
  completedAt: Progress["completed"];
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
  solvedTasks,
  completedAt,
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
  const initialSelected = board.states.find((s) => s.quest.id === selectedId);
  const [week, setWeek] = useState(
    initialSelected?.chapter.number ?? CHAPTERS[0].number,
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const selected =
    board.states.find((s) => s.quest.id === selectedId) ?? board.states[0];

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
              Uka
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
            <button
              type="button"
              role="tab"
              aria-selected={tab === "book"}
              className={`log-tab${tab === "book" ? " is-on" : ""}`}
              onClick={() => setTab("book")}
            >
              Boka
            </button>
          </div>
          <p
            className="log-forge"
            title="Smia blir sterkere når du fullfører luker"
          >
            <span className="log-forge-label">Smia nivå {forgeLevel}</span>
            <span className="log-forge-pips" aria-hidden="true">
              {Array.from({ length: MAX_FORGE_LEVEL }, (_, i) => (
                <span
                  key={i}
                  className={i < forgeLevel ? "is-on" : undefined}
                />
              ))}
            </span>
            <span className="log-forge-damage">
              {forgedPower(forgeLevel).damage} skade
            </span>
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
          <div className="log-quests">
            <WeekTabs
              board={board}
              week={week}
              onPick={(number) => {
                setWeek(number);
                const first =
                  board.states.find(
                    (s) =>
                      s.chapter.number === number &&
                      (s.status === "active" || s.status === "offered"),
                  ) ?? board.states.find((s) => s.chapter.number === number);
                if (first) setSelectedId(first.quest.id);
              }}
            />
            <WeekBody
              board={board}
              week={week}
              selected={selected}
              completedAt={completedAt}
              onSelect={setSelectedId}
              detail={
                selected && selected.chapter.number === week ? (
                  <QuestDetail
                    state={selected}
                    completedAt={completedAt[selected.quest.id]}
                    shown={hintsShown[selected.quest.id] ?? 0}
                    onMoreHint={() => onRevealHint(selected.quest.id)}
                    onOpenCode={() => onOpenCode(selected.quest.id)}
                    onGoToBrann={() => onTravelToSite("forge")}
                    codePassed={Boolean(solvedTasks[selected.quest.id])}
                    onClose={onClose}
                  />
                ) : null
              }
            />
          </div>
        ) : tab === "map" ? (
          <div className="log-map-panel">
            <VillageMap
              board={board}
              onTravel={onTravelToSite}
              onOpenQuest={(questId) => {
                setSelectedId(questId);
                const target = board.states.find((s) => s.quest.id === questId);
                if (target) setWeek(target.chapter.number);
                setTab("quests");
              }}
            />
          </div>
        ) : (
          <QuestBook
            board={board}
            completedAt={completedAt}
            initialQuestId={initialQuestId}
            onClose={onClose}
          />
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
              ? "Klikk igjen for å nullstille fremgang og kodesvar"
              : "Nullstill fremgang"}
          </button>
        </footer>
      </section>
    </div>
  );
}

// A door's window: dark until it opens, outlined while it's open, lit when
// it's done. The same Kenney window the houses use, so the journal and the
// village speak the same language.
function Lantern({ status }: { status: QuestState["status"] }) {
  return (
    <span className={`log-lantern is-${status}`} aria-hidden="true">
      <SpriteIcon sprite={{ sheet: "town", frame: 84 }} scale={2} />
      {status === "offered" && <span className="log-lantern-mark">!</span>}
    </span>
  );
}

const weekday = (date: Date) =>
  date.toLocaleDateString("nb-NO", { weekday: "short" }).replace(".", "");

function rowStatus(
  state: QuestState,
  week: QuestState[],
  completedAt: Progress["completed"],
) {
  if (state.status === "done") {
    const at = completedAt[state.quest.id];
    const date = at ? new Date(at) : null;
    return date && !Number.isNaN(date.getTime())
      ? `fullført ${weekday(date)}`
      : "fullført";
  }
  if (state.status === "active") return "pågår";
  if (state.status === "offered") return "venter hos Brann";
  if (state.opensAt) return `åpner ${dateLabel(state.opensAt)}`;
  const before = week[week.indexOf(state) - 1];
  return before ? `etter luke ${before.quest.door}` : "låst";
}

// Solutions arrive on the Friday of each week (the baker, in the story).
function fridayLine(chapter: (typeof CHAPTERS)[number]) {
  const opens = chapterOpensAt(chapter);
  if (!opens) return "Fredag: løsningene for uka kommer.";
  const friday = new Date(opens);
  friday.setDate(opens.getDate() + ((5 - opens.getDay() + 7) % 7));
  return `Fredag ${dateLabel(friday)}: løsningene for uka kommer.`;
}

// One button per week: its number, a light per core door (lit when done), a
// star for the bonus, or a lock with the opening date while it's closed.
function WeekTabs({
  board,
  week,
  onPick,
}: {
  board: QuestBoard;
  week: number;
  onPick: (number: number) => void;
}) {
  return (
    <div className="log-weeks" role="group" aria-label="Uker">
      {CHAPTERS.map((chapter) => {
        const states = board.states.filter(
          (s) => s.chapter.number === chapter.number,
        );
        const core = states.filter((s) => !s.quest.bonus);
        const bonus = states.filter((s) => s.quest.bonus);
        const done = core.filter((s) => s.status === "done").length;
        const open = states.some((s) => s.status !== "locked");
        const complete = core.length > 0 && done === core.length;
        const opensAt = chapterOpensAt(chapter);
        return (
          <button
            key={chapter.number}
            type="button"
            aria-pressed={week === chapter.number}
            className={`log-week${week === chapter.number ? " is-on" : ""}${open ? "" : " is-closed"}${complete ? " is-complete" : ""}`}
            onClick={() => onPick(chapter.number)}
          >
            <span className="log-week-name">Uke {chapter.number}</span>
            {open ? (
              <span
                className="log-week-lights"
                aria-label={`${done} av ${core.length} ferdig`}
              >
                {core.map((s) => (
                  <span
                    key={s.quest.id}
                    className={`log-light${s.status === "done" ? " is-lit" : ""}`}
                  />
                ))}
                {bonus.map((s) => (
                  <span
                    key={s.quest.id}
                    className={`log-star${s.status === "done" ? " is-lit" : ""}`}
                    aria-hidden="true"
                  >
                    {s.status === "done" ? "★" : "☆"}
                  </span>
                ))}
              </span>
            ) : (
              <span className="log-week-when">
                {opensAt ? `Åpner ${dateLabel(opensAt)}` : "Kommer"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// The selected week: its doors on the left, the chosen door on the right. A
// week that isn't open yet shows what it will teach instead.
function WeekBody({
  board,
  week,
  selected,
  completedAt,
  onSelect,
  detail,
}: {
  board: QuestBoard;
  week: number;
  selected: QuestState | undefined;
  completedAt: Progress["completed"];
  onSelect: (questId: string) => void;
  detail: React.ReactNode;
}) {
  const chapter = CHAPTERS.find((c) => c.number === week) ?? CHAPTERS[0];
  const states = board.states.filter((s) => s.chapter.number === week);
  const core = states.filter((s) => !s.quest.bonus);
  const done = core.filter((s) => s.status === "done").length;
  const open = states.some((s) => s.status !== "locked");
  const opensAt = chapterOpensAt(chapter);

  if (!open) {
    const topics = states.length
      ? states.map((s) => s.quest.title)
      : (chapter.teaser ?? []);
    return (
      <div className="log-week-closed">
        <p className="log-week-kicker">Uke {chapter.number}</p>
        <h3 className="log-quest-title">{chapter.title}</h3>
        <p className="log-locked">
          {opensAt
            ? `Lukene åpner mandag ${dateLabel(opensAt)}.`
            : "Lukene åpner når kalenderen kommer så langt."}{" "}
          Dette skal du lære:
        </p>
        <ul className="log-teasers">
          {topics.map((name) => (
            <li key={name}>{renderText(name)}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="log-body">
      <nav className="log-list" aria-label={`Luker i uke ${chapter.number}`}>
        <p className="log-chapter-title">
          {chapter.title} · {done} av {core.length} ferdig
        </p>
        <ul className="log-chapter-list">
          {states.map((s) => (
            <li key={s.quest.id}>
              <button
                type="button"
                className={`log-quest is-${s.status}${s === selected ? " is-selected" : ""}`}
                onClick={() => onSelect(s.quest.id)}
                aria-current={s === selected ? "true" : undefined}
              >
                <Lantern status={s.status} />
                <span className="log-quest-name">
                  <span className="log-quest-door">
                    Luke {s.quest.door} · {rowStatus(s, states, completedAt)}
                  </span>
                  {s.status === "offered" ? "Snakk med Brann" : s.quest.title}
                  {s.quest.bonus && (
                    <span className="log-bonus"> ☆ Bonus · valgfri</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="log-friday">{fridayLine(chapter)}</p>
      </nav>
      {detail}
    </div>
  );
}

function QuestDetail({
  state,
  completedAt,
  shown,
  onMoreHint,
  onOpenCode,
  onGoToBrann,
  codePassed,
  onClose,
}: {
  state: QuestState;
  completedAt?: string;
  shown: number;
  onMoreHint: () => void;
  onOpenCode: () => void;
  onGoToBrann: () => void;
  codePassed: boolean;
  onClose: () => void;
}) {
  const { quest, status, result } = state;

  if (status === "offered") {
    return (
      <article className="log-detail">
        <div className="log-brann">
          <span
            className="log-brann-portrait"
            role="img"
            aria-label="Brann, smeden"
          >
            <SpriteIcon sprite={{ sheet: "dungeon", frame: 86 }} scale={4} />
          </span>
          <div>
            <p className="log-week-kicker">
              Luke {quest.door}
              {quest.bonus && " · ☆ Bonus · valgfri"}
            </p>
            <h3 className="log-quest-title">Brann har en ny luke til deg</h3>
            <p className="log-locked">
              Snakk med ham ved smia, så forteller han hva du skal gjøre.
            </p>
            <button
              type="button"
              className="btn btn--amber log-code"
              onClick={onGoToBrann}
            >
              Gå til Brann
            </button>
          </div>
        </div>
      </article>
    );
  }

  if (status === "locked") {
    return (
      <article className="log-detail">
        <p className="log-week-kicker">Luke {quest.door}</p>
        <h3 className="log-quest-title">
          {quest.title}
          {quest.bonus && <span className="log-bonus">☆ Bonus · valgfri</span>}
        </h3>
        <p className="log-locked">
          {state.opensAt
            ? `Åpner ${dateLabel(state.opensAt)}.`
            : "Åpner når du har fullført luken før."}
        </p>
      </article>
    );
  }

  if (status === "done") {
    const finished = completedAt ? new Date(completedAt) : null;
    return (
      <article className="log-detail log-detail--done">
        <div className="log-stamp" aria-label="Fullført">
          <IconCheck size={14} />
          Fullført
          {finished && !Number.isNaN(finished.getTime())
            ? ` ${dateLabel(finished)}`
            : ""}
        </div>
        <p className="log-week-kicker">
          Luke {quest.door}
          {quest.bonus && " · ☆ Bonus"}
        </p>
        <h3 className="log-quest-title">{quest.title}</h3>
        <div className="log-lesson log-lesson--inline">
          <p className="log-lesson-quest">Det du lærte</p>
          <h4 className="log-lesson-title">{renderText(quest.lesson.title)}</h4>
          <p className="log-lesson-text">{renderText(quest.lesson.text)}</p>
        </div>
        {result.objectives && (
          <ul className="tracker-list log-done-list">
            {result.objectives.map((o) => (
              <li key={o.label} className="is-done">
                <span className="tracker-box">
                  <IconCheck size={12} />
                </span>
                {o.label}
              </li>
            ))}
          </ul>
        )}
        <div className="log-done-actions">
          {quest.checkedBy === "window" && (
            <button
              type="button"
              className="btn btn--quiet"
              onClick={onOpenCode}
            >
              Se koden igjen
            </button>
          )}
          {quest.learn && (
            <a
              className="log-learn"
              href={quest.learn.url}
              target="_blank"
              rel="noreferrer"
            >
              Les mer: {quest.learn.label}
            </a>
          )}
        </div>
        <StudioPractice
          state={state}
          codePassed={codePassed}
          onLeave={onClose}
        />
      </article>
    );
  }

  return (
    <article className="log-detail">
      <p className="log-week-kicker log-week-kicker--active">
        Luke {quest.door} · pågår
        {quest.bonus && " · ☆ Bonus · valgfri"}
      </p>
      <h3 className="log-quest-title">{quest.title}</h3>
      <p className="log-intro">
        «{renderText(quest.intro[quest.intro.length - 1])}»
      </p>
      <p className="log-goal">{renderText(quest.goal)}</p>
      <GoalPreview quest={quest} />
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
      {result.message && (
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
          Åpne kodevinduet
        </button>
      )}
      <StudioPractice state={state} codePassed={codePassed} onLeave={onClose} />
      {quest.hints.length > 0 && (
        <div className="log-hints">
          {quest.hints.slice(0, shown).map((hint, i) => (
            <QuestHint key={i} hint={hint} number={i + 1} />
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

      {quest.learn && (
        <a
          className="log-learn"
          href={quest.learn.url}
          target="_blank"
          rel="noreferrer"
        >
          Les mer: {quest.learn.label}
        </a>
      )}
    </article>
  );
}
