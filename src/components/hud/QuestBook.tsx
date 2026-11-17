"use client";

import { useState } from "react";
import { CHAPTERS } from "@/game/quests/chapters";
import { lukeName } from "@/game/quests/label";
import { chapterOpensAt, type QuestBoard } from "@/game/quests/engine";
import type { Progress, QuestState } from "@/game/quests/types";
import { plainText, renderText } from "./richText";
import SpriteIcon from "./SpriteIcon";
import { openStudio } from "./studioPane";

type Props = {
  board: QuestBoard;
  completedAt: Progress["completed"];
  initialQuestId?: string;
  onClose: () => void;
};

const dateLabel = (date: Date) =>
  date.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });

type Term = { word: string; questId: string };

// The Sanity words a player has met: every `code` and *term* in the lessons
// of finished doors, first appearance wins.
export function glossary(pages: QuestState[]): Term[] {
  const seen = new Map<string, Term>();
  for (const s of pages) {
    const { title, text } = s.quest.lesson;
    for (const match of `${title} ${text}`.matchAll(/`([^`]+)`|\*([^*]+)\*/g)) {
      const word = (match[1] ?? match[2]).trim();
      const key = word.toLowerCase();
      if (word.length > 24 || seen.has(key)) continue;
      seen.set(key, { word, questId: s.quest.id });
    }
  }
  return [...seen.values()];
}

// Brann's book: one parchment page per finished door, written when the door
// is done. Pages still to come stay blank, so the player sees how much is
// left without learning what's on them.
export default function QuestBook({
  board,
  completedAt,
  initialQuestId,
  onClose,
}: Props) {
  const pages = board.states.filter((s) => s.status === "done");
  const [selectedId, setSelectedId] = useState(
    pages.find((s) => s.quest.id === initialQuestId)?.quest.id ??
      pages.at(-1)?.quest.id,
  );
  const selected = pages.find((s) => s.quest.id === selectedId);
  const terms = glossary(pages);
  const total = board.states.length;

  return (
    <div className="book">
      <nav className="book-nav" aria-label="Sider i boka">
        <p className="book-count">
          {pages.length} av {total} sider skrevet
        </p>
        {CHAPTERS.map((chapter) => {
          const states = board.states.filter(
            (s) => s.chapter.number === chapter.number,
          );
          const opensAt = chapterOpensAt(chapter);
          const open = states.some((s) => s.status !== "locked");
          const blanks = states.length || chapter.teaser?.length || 0;
          return (
            <section key={chapter.number} className="book-week">
              <p className="book-week-title">
                Uke {chapter.number}
                {open
                  ? ` · ${chapter.title}`
                  : opensAt
                    ? ` · åpner ${dateLabel(opensAt)}`
                    : " · kommer"}
              </p>
              {open ? (
                <ul className="book-pages">
                  {states.map((s) => (
                    <li key={s.quest.id}>
                      {s.status === "done" ? (
                        <button
                          type="button"
                          className={`book-page${s === selected ? " is-selected" : ""}`}
                          aria-current={s === selected ? "true" : undefined}
                          onClick={() => setSelectedId(s.quest.id)}
                        >
                          {plainText(s.quest.lesson.title)}
                        </button>
                      ) : (
                        <span className="book-page is-blank">
                          {lukeName(s.quest)}
                          <br />
                          ikke skrevet
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="book-spines" aria-hidden="true">
                  {Array.from({ length: blanks }, (_, i) => (
                    <span key={i} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {terms.length > 0 && (
          <section className="book-glossary">
            <p className="book-week-title">Ordliste · {terms.length} ord</p>
            <div className="book-terms">
              {terms.map((t) => (
                <button
                  key={t.word}
                  type="button"
                  className="book-term"
                  title="Vis siden ordet kom fra"
                  onClick={() => setSelectedId(t.questId)}
                >
                  {t.word}
                </button>
              ))}
            </div>
          </section>
        )}
      </nav>

      {selected ? (
        <BookSpread
          state={selected}
          page={pages.indexOf(selected) + 1}
          completedAt={completedAt[selected.quest.id]}
          onOpenStudio={() => {
            openStudio();
            onClose();
          }}
          onNext={
            pages[pages.indexOf(selected) + 1]
              ? () => setSelectedId(pages[pages.indexOf(selected) + 1].quest.id)
              : undefined
          }
        />
      ) : (
        <div className="book-spread book-spread--empty">
          <p>
            Brann skriver en side her for hver luke du blir ferdig med. Den
            første kommer når du har fullført luke 1.
          </p>
        </div>
      )}
    </div>
  );
}

function BookSpread({
  state,
  page,
  completedAt,
  onOpenStudio,
  onNext,
}: {
  state: QuestState;
  page: number;
  completedAt?: string;
  onOpenStudio: () => void;
  onNext?: () => void;
}) {
  const { quest } = state;
  const finished = completedAt ? new Date(completedAt) : null;
  return (
    <article className="book-spread" aria-label={`Side ${page}`}>
      <div className="book-leaf">
        <p className="book-kicker">
          Side {page} · {lukeName(quest)}
        </p>
        <h3 className="book-title">{renderText(quest.lesson.title)}</h3>
        <p className="book-text">{renderText(quest.lesson.text)}</p>
        <div className="book-sign">
          <span className="book-brann" aria-hidden="true">
            <SpriteIcon sprite={{ sheet: "dungeon", frame: 86 }} scale={3} />
          </span>
          <span>
            Skrevet av Brann
            {finished && !Number.isNaN(finished.getTime())
              ? `, ${dateLabel(finished)}`
              : ""}
          </span>
        </div>
      </div>
      <div className="book-leaf book-leaf--right">
        <p className="book-kicker">Fra luka</p>
        <p className="book-quest">{quest.title}</p>
        {quest.studioPractice && (
          <div className="book-practice">
            <p className="book-kicker">Prøv selv</p>
            <p className="book-text">{renderText(quest.studioPractice)}</p>
            <button type="button" className="book-link" onClick={onOpenStudio}>
              Åpne Studio
            </button>
          </div>
        )}
        {quest.learn && (
          <div>
            <p className="book-kicker">Les mer</p>
            <a
              className="book-link"
              href={quest.learn.url}
              target="_blank"
              rel="noreferrer"
            >
              {quest.learn.label}
            </a>
          </div>
        )}
        {onNext && (
          <button type="button" className="book-next" onClick={onNext}>
            Neste side
          </button>
        )}
      </div>
    </article>
  );
}
