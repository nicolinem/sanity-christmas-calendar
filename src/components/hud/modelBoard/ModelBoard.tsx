"use client";

import HintPager from "../codeWindow/HintPager";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuestState, SolvedTask } from "@/game/quests/types";
import {
  judgeBoard,
  type BoardTask,
  type BoardToggle,
  type Placement,
} from "@/game/modelBoard/modelBoard";
import { lukeName } from "@/game/quests/label";
import { IconCheck } from "../icons";
import QuestHint from "../QuestHint";
import { renderText } from "../richText";
import StudioPractice from "../StudioPractice";
import { BOARD_TASKS } from "./tasks";

type Props = {
  state: QuestState;
  solved: boolean;
  onSolved: (how: Omit<SolvedTask, "at">) => void;
  hintsShown: number;
  onRevealHint: () => void;
  onClose: () => void;
};

const storageKey = (questId: string) => `winter-quest:board:${questId}`;

function loadPlacement(questId: string): Placement {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(storageKey(questId)) ?? "{}",
    );
    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  } catch {
    return {};
  }
}

function savePlacement(questId: string, placement: Placement) {
  try {
    window.localStorage.setItem(storageKey(questId), JSON.stringify(placement));
  } catch {
    // Not remembered between visits, still works.
  }
}

const toggleLabel: Record<BoardToggle, string> = {
  required: "Påkrevd",
  initial: "Startverdi",
};

const plain = (label: string) => label.replace(/`/g, "");

// A table board is a spec sheet, the way a designer hands it to a
// developer: one row per field, with the bit of the note that goes in it,
// its type, and any yes/no choices. Nothing counts until it's picked.
function SpecTable({
  task,
  placement,
  requirements,
  onSlot,
  onToggle,
}: {
  task: BoardTask;
  placement: Placement;
  requirements: { done: boolean; message?: string }[];
  onSlot: (card: string, slot: string) => void;
  onToggle: (card: string, toggle: BoardToggle, value: boolean) => void;
}) {
  const toggles = task.allowToggles?.length ? " has-toggles" : "";
  return (
    <section className="mb-spec" aria-label="Spesifikasjon">
      <div className={`mb-spec-row mb-spec-head${toggles}`} aria-hidden="true">
        <span>Felt i Studio</span>
        <span>Type</span>
        {task.allowToggles?.map((toggle) => (
          <span key={toggle}>{toggleLabel[toggle]}</span>
        ))}
      </div>
      {task.cards.map((card, index) => {
        const answer = placement[card.id] ?? {};
        const requirement = requirements[index];
        return (
          <div
            key={card.id}
            className={`mb-spec-row${toggles}${requirement.done ? " is-done" : ""}`}
            role="group"
            aria-label={card.field ?? card.text}
          >
            <span className="mb-spec-card">
              <strong>
                {requirement.done && <IconCheck size={12} />}
                {card.field ?? card.text}
              </strong>
              {card.field && (
                <small>
                  {task.source ?? "Eksempel"}: «{card.text}»
                </small>
              )}
            </span>
            <select
              aria-label={`Type for ${card.field ?? card.text}`}
              value={answer.slot ?? ""}
              onChange={(event) => onSlot(card.id, event.target.value)}
            >
              <option value="">Velg type</option>
              {task.slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {plain(slot.label)}
                </option>
              ))}
            </select>
            {task.allowToggles?.map((toggle) => (
              <fieldset key={toggle} className="mb-spec-choice">
                <legend>{toggleLabel[toggle]}</legend>
                {[true, false].map((value) => (
                  <label key={String(value)}>
                    <input
                      type="radio"
                      name={`${task.id}-${card.id}-${toggle}`}
                      checked={answer[toggle] === value}
                      onChange={() => onToggle(card.id, toggle, value)}
                    />
                    {value ? "Ja" : "Nei"}
                  </label>
                ))}
              </fieldset>
            ))}
            {!requirement.done && requirement.message && (
              <small role="status">{renderText(requirement.message)}</small>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default function ModelBoard({
  state,
  solved,
  onSolved,
  hintsShown,
  onRevealHint,
  onClose,
}: Props) {
  const { quest } = state;
  const task = BOARD_TASKS[quest.id];
  const [placement, setPlacement] = useState<Placement>(() =>
    loadPlacement(quest.id),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<number | null>(null);
  const verdict = useMemo(() => judgeBoard(task, placement), [task, placement]);
  const sent = useRef(false);

  useEffect(() => {
    savePlacement(quest.id, placement);
  }, [quest.id, placement]);

  useEffect(() => {
    if (!verdict.done || solved || sent.current) return;
    sent.current = true;
    onSolved({});
  }, [onSolved, solved, verdict.done]);

  const placeSelected = (slot: string) => {
    if (!selected) return;
    setPlacement((current) => ({
      ...current,
      [selected]: { ...current[selected], slot },
    }));
  };
  const removeCard = (card: string) => {
    setPlacement((current) => ({
      ...current,
      [card]: { ...current[card], slot: undefined },
    }));
  };
  const setToggle = (card: string, toggle: BoardToggle, value: boolean) =>
    setPlacement((current) => ({
      ...current,
      [card]: { ...current[card], [toggle]: value },
    }));

  const hints = quest.hints.slice(0, hintsShown);
  const activeHint =
    hintsShown > 0
      ? Math.min(hintsShown - 1, Math.max(0, selectedHint ?? hintsShown - 1))
      : 0;
  const passed = verdict.requirements.filter(({ done }) => done).length;

  return (
    <div className="log-backdrop cw-backdrop" onClick={onClose}>
      <section
        className="mb frame frame--slate"
        role="dialog"
        aria-modal="true"
        aria-label={`Modellbrett: ${lukeName(quest)}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="log-head">
          <h2 className="log-title">Modellbrett</h2>
          <p className="log-meta">
            <span className="cw-door">{lukeName(quest)}</span>: {quest.title}
          </p>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              setPlacement({});
              setSelected(null);
              savePlacement(quest.id, {});
            }}
          >
            Start på nytt
          </button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Lukk <kbd>Esc</kbd>
          </button>
        </header>

        <div className="mb-scroll">
          <section className="mb-note" aria-label="Notat">
            <p>{renderText(task.note)}</p>
          </section>

          {task.layout === "table" || task.allowToggles ? (
            <SpecTable
              task={task}
              placement={placement}
              requirements={verdict.requirements}
              onSlot={(card, slot) =>
                setPlacement((current) => ({
                  ...current,
                  [card]: { ...current[card], slot: slot || undefined },
                }))
              }
              onToggle={setToggle}
            />
          ) : (
            <>
              <section className="mb-cards" aria-label="Kort">
                {task.cards.map((card, index) => {
                  const requirement = verdict.requirements[index];
                  return (
                    <div className="mb-card-wrap" key={card.id}>
                      <button
                        type="button"
                        className={`mb-card${selected === card.id ? " is-selected" : ""}${requirement.done ? " is-done" : ""}`}
                        aria-pressed={selected === card.id}
                        onClick={() => setSelected(card.id)}
                      >
                        {requirement.done && <IconCheck size={12} />}
                        {card.text}
                      </button>
                      {!requirement.done && requirement.message && (
                        <small role="status">
                          {renderText(requirement.message)}
                        </small>
                      )}
                    </div>
                  );
                })}
              </section>

              <div className="mb-selection" aria-live="polite">
                <span>
                  {selected
                    ? `Valgt: ${task.cards.find(({ id }) => id === selected)?.text}`
                    : "Velg et kort, og velg deretter hvor det hører hjemme."}
                </span>
              </div>

              <section className="mb-slots" aria-label="Felt på modellbrettet">
                {task.slots.map((slot) => {
                  const cards = task.cards.filter(
                    ({ id }) => placement[id]?.slot === slot.id,
                  );
                  return (
                    <article
                      className="mb-slot frame frame--slate"
                      key={slot.id}
                    >
                      <h3>{renderText(slot.label)}</h3>
                      <p>{slot.about}</p>
                      <button
                        type="button"
                        className="btn btn--quiet"
                        disabled={!selected}
                        onClick={() => placeSelected(slot.id)}
                      >
                        Legg valgt kort her
                      </button>
                      <ul>
                        {cards.map((card) => (
                          <li key={card.id}>
                            <div className="mb-placed-row">
                              <button
                                type="button"
                                className="mb-placed-card"
                                onClick={() => setSelected(card.id)}
                              >
                                {card.text}
                              </button>
                              <button
                                type="button"
                                className="mb-remove-card"
                                aria-label={`Fjern ${card.text} fra brettet`}
                                title={`Fjern ${card.text}`}
                                onClick={() => removeCard(card.id)}
                              >
                                ×
                              </button>
                            </div>
                            {task.allowToggles?.map((toggle) => (
                              <label key={toggle}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    placement[card.id]?.[toggle],
                                  )}
                                  onChange={(event) =>
                                    setToggle(
                                      card.id,
                                      toggle,
                                      event.target.checked,
                                    )
                                  }
                                />
                                {toggleLabel[toggle]}
                              </label>
                            ))}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </section>
            </>
          )}

          <section className="cw-panel cw-check" aria-label="Kriterier">
            <header className="cw-panel-head">
              <p className="cw-label">Kriterier</p>
              <span className="cw-progress" aria-live="polite">
                {passed} / {verdict.requirements.length} oppfylt
              </span>
            </header>
            <ul className="cw-reqs" aria-live="polite">
              {verdict.requirements.map((requirement) => (
                <li
                  key={requirement.label}
                  className={requirement.done ? "is-done" : undefined}
                >
                  <span className="tracker-box">
                    {requirement.done && <IconCheck size={12} />}
                  </span>
                  <span>{renderText(requirement.label)}</span>
                </li>
              ))}
            </ul>
          </section>

          {!solved && (
            <section className="cw-panel cw-hint-panel" aria-label="Hint">
              <header className="cw-panel-head cw-hint-head">
                <p className="cw-label">Hint</p>
                <HintPager
                  total={quest.hints.length}
                  shown={hintsShown}
                  active={activeHint}
                  onSelect={setSelectedHint}
                  onReveal={onRevealHint}
                />
              </header>
              {hints.length > 0 && (
                <div className="cw-hint-content">
                  <QuestHint hint={hints[activeHint]} number={activeHint + 1} />
                </div>
              )}
              {hintsShown === 0 && (
                <button
                  type="button"
                  className="btn btn--quiet cw-reveal-hint"
                  onClick={() => {
                    setSelectedHint(0);
                    onRevealHint();
                  }}
                >
                  Vis et hint
                </button>
              )}
            </section>
          )}

          {verdict.done && (
            <div className="cw-status is-done" role="status">
              <span>
                <strong>Oppgave godkjent!</strong>{" "}
                {solved
                  ? "Du har løst denne før."
                  : "Luka blir ferdig når du går videre."}
              </span>
              <button
                type="button"
                className="btn btn--amber"
                onClick={onClose}
              >
                {solved ? "Lukk" : "Gå videre"}
              </button>
            </div>
          )}

          <StudioPractice
            state={state}
            codePassed={verdict.done || solved}
            onLeave={onClose}
          />
        </div>
      </section>
    </div>
  );
}
