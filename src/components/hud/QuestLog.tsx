"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/game/quests/chapters";
import type { QuestBoard } from "@/game/quests/engine";
import type { QuestState } from "@/game/quests/types";
import { forgedPower } from "@/game/rules";
import { IconCheck } from "./icons";
import { renderCode } from "./QuestTracker";

type Props = {
  board: QuestBoard;
  forgeLevel: number;
  hintsShown: Record<string, number>;
  onRevealHint: (questId: string) => void;
  onClose: () => void;
  onReset: () => void;
};

// The full quest log: every chapter, what's done, what's next, and the layered
// hints. Locked chapters only show their names, as a taste of what's coming.
export default function QuestLog({ board, forgeLevel, hintsShown, onRevealHint, onClose, onReset }: Props) {
  const [selectedId, setSelectedId] = useState(board.active?.quest.id ?? board.states[0]?.quest.id);
  const [confirmReset, setConfirmReset] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const selected = board.states.find((s) => s.quest.id === selectedId) ?? board.states[0];

  return (
    <div className="log-backdrop" onClick={onClose}>
      <section
        className="log frame frame--slate"
        role="dialog"
        aria-modal="true"
        aria-label="Quest log"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="log-head">
          <h2 className="log-title">Quest log</h2>
          <p className="log-meta">
            Forge level {forgeLevel}, blades bite for {forgedPower(forgeLevel).damage}
          </p>
          <button ref={closeRef} type="button" className="btn btn--quiet" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </header>

        <div className="log-body">
          <nav className="log-list" aria-label="Quests">
            {CHAPTERS.map((chapter) => {
              const states = board.states.filter((s) => s.chapter.number === chapter.number);
              return (
                <div key={chapter.number} className="log-chapter">
                  <p className="log-chapter-title">
                    Chapter {chapter.number}: {chapter.title}
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
                          <span className="tracker-box">{s.status === "done" && <IconCheck size={12} />}</span>
                          {s.quest.title}
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
            />
          )}
        </div>

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
            {confirmReset ? "Click again to wipe your progress" : "Reset progress"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function QuestDetail({ state, shown, onMoreHint }: { state: QuestState; shown: number; onMoreHint: () => void }) {
  const { quest, status, result } = state;

  if (status === "locked") {
    return (
      <article className="log-detail">
        <h3 className="log-quest-title">{quest.title}</h3>
        <p className="log-locked">
          {state.opensAt
            ? `Opens ${state.opensAt.toLocaleDateString(undefined, { day: "numeric", month: "long" })}.`
            : "Finish the task before this one to unlock it."}
        </p>
      </article>
    );
  }

  return (
    <article className="log-detail">
      <h3 className="log-quest-title">
        {quest.title}
        {status === "done" && <span className="log-done">Done</span>}
      </h3>
      <p className="log-intro">“{quest.intro}”</p>
      <p className="log-goal">{renderCode(quest.goal)}</p>
      {quest.where && (
        <p className="log-where">
          <span className="log-where-label">Where to work</span> {renderCode(quest.where)}
        </p>
      )}

      {result.objectives && (
        <ul className="tracker-list">
          {result.objectives.map((o) => (
            <li key={o.label} className={o.done ? "is-done" : undefined}>
              <span className="tracker-box">{o.done && <IconCheck size={12} />}</span>
              {o.label}
            </li>
          ))}
        </ul>
      )}
      {status !== "done" && result.message && <p className="tracker-note">{renderCode(result.message)}</p>}

      <p className="log-checked">
        {quest.checkedBy === "code" ? (
          <>
            When it works, run <code>npm run quest</code> in your terminal, then press Check the forge.
          </>
        ) : (
          "The game notices this one by itself."
        )}
        {quest.reward && ` Reward: the forge grows hotter.`}
      </p>

      {quest.hints.length > 0 && (
        <div className="log-hints">
          {quest.hints.slice(0, shown).map((hint, i) => (
            <p key={i} className="log-hint">
              <span className="log-hint-n">Hint {i + 1}</span> {renderCode(hint.text)}
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
          {shown < quest.hints.length && (
            <button type="button" className="btn btn--quiet" onClick={onMoreHint}>
              {shown === 0 ? "Show a hint" : "Show another hint"}
            </button>
          )}
        </div>
      )}

      {quest.learn && (
        <a className="log-learn" href={quest.learn.url} target="_blank" rel="noreferrer">
          Brann&apos;s book: {quest.learn.label}
        </a>
      )}
    </article>
  );
}
