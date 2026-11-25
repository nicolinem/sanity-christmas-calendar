"use client";

import { useState } from "react";
import { sideObjectives } from "@/game/sideQuests/engine";
import type { SideState } from "@/game/sideQuests/types";
import { NPCS, type NpcId, type QuestSiteId } from "@/game/village";
import { IconCheck, IconQuill } from "./icons";
import { renderText } from "./richText";
import { rewardNames } from "./SideQuestDialogue";
import SpriteIcon from "./SpriteIcon";
import { openStudio } from "./studioPane";

const STATUS: Partial<Record<SideState["status"], string>> = {
  ready: "klart å levere",
  active: "pågår",
  available: "nytt",
};

const giverOf = (state: SideState) => NPCS[state.quest.giver as NpcId];

// «Sideoppdrag» at the bottom of the week's list in the journal: what's
// ready, what's in progress, what's new, and the finished ones folded away.
// Each row opens its page in the journal's detail pane.
export default function SideQuestList({
  states,
  selected,
  onSelect,
}: {
  states: SideState[];
  selected: string | null;
  onSelect: (questId: string) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const order = ["ready", "active", "available"] as const;
  const open = order.flatMap((status) =>
    states.filter((s) => s.status === status),
  );
  const done = states.filter((s) => s.status === "done");
  if (!open.length && !done.length) return null;

  const row = (s: SideState) => {
    const giver = giverOf(s);
    const steps = sideObjectives(s);
    const finds = steps.filter((o) => o.done).length;
    return (
      <li key={s.quest.id}>
        <button
          type="button"
          className={`side-row is-${s.status}${s.quest.id === selected ? " is-selected" : ""}`}
          aria-current={s.quest.id === selected ? "true" : undefined}
          onClick={() => onSelect(s.quest.id)}
        >
          {/* The giver's face, where a luke has its window. */}
          <span className="side-face" aria-hidden="true">
            {giver && <SpriteIcon sprite={giver.sprite} scale={2} />}
          </span>
          <span className="log-quest-name">
            <span className="log-quest-door">
              {giver?.name ?? ""}
              {STATUS[s.status] && ` · ${STATUS[s.status]}`}
              {s.status === "active" &&
                steps.length > 1 &&
                ` · ${finds} av ${steps.length}`}
            </span>
            {s.status === "available"
              ? `${giver?.name ?? ""} har noe på hjertet`
              : s.quest.title}
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className="side-list" aria-label="Sideoppdrag">
      <p className="log-chapter-title">Sideoppdrag</p>
      <ul>{open.map(row)}</ul>
      {done.length > 0 && (
        <>
          <button
            type="button"
            className="btn btn--quiet side-row-go"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
          >
            Ferdig ({done.length})
          </button>
          {showDone && <ul>{done.map(row)}</ul>}
        </>
      )}
    </section>
  );
}

// A side quest's page in the journal: what was asked, each step ticked off
// as it's done, a hint on request, and the way to the giver. A quest not
// taken yet stays a mystery, like a luke the giver hasn't handed over.
export function SideQuestDetail({
  state,
  onTravel,
  onClose,
}: {
  state: SideState;
  onTravel: (site: QuestSiteId) => void;
  onClose: () => void;
}) {
  const [hint, setHint] = useState(false);
  const { quest, status } = state;
  const giver = giverOf(state);
  if (!giver) return null;

  if (status === "available")
    return (
      <article className="log-detail">
        <div className="log-brann">
          <span
            className="log-brann-portrait"
            role="img"
            aria-label={giver.name}
          >
            <SpriteIcon sprite={giver.sprite} scale={4} />
          </span>
          <div>
            <p className="log-week-kicker">Sideoppdrag</p>
            <h3 className="log-quest-title">{giver.name} har noe på hjertet</h3>
            <p className="log-locked">
              Snakk med {giver.name} {giver.at} for å høre hva det gjelder. Ta
              det når du har tid til overs.
            </p>
            <button
              type="button"
              className="btn btn--amber log-code"
              onClick={() => onTravel(giver.site)}
            >
              Gå til {giver.name}
            </button>
          </div>
        </div>
      </article>
    );

  const rewards = rewardNames(state);
  return (
    <article
      className={`log-detail${status === "done" ? " log-detail--done" : ""}`}
    >
      {status === "done" && (
        <div className="log-stamp" aria-label="Levert">
          <IconCheck size={14} />
          Levert
        </div>
      )}
      <p className="log-week-kicker log-week-kicker--active">
        Sideoppdrag · {giver.name}
        {STATUS[status] && ` · ${STATUS[status]}`}
      </p>
      <h3 className="log-quest-title">{quest.title}</h3>
      {quest.topic && <p className="quest-topic">{renderText(quest.topic)}</p>}
      <div className="log-intro">
        {quest.ask.map((line) => (
          <p key={line}>«{renderText(line)}»</p>
        ))}
      </div>
      <p className="log-goal">{renderText(quest.goal)}</p>
      <ul className="tracker-list">
        {sideObjectives(state).map((o) => (
          <li key={o.label} className={o.done ? "is-done" : undefined}>
            <span className="tracker-box">
              {o.done && <IconCheck size={12} />}
            </span>
            {renderText(o.label)}
          </li>
        ))}
        {status !== "done" && (
          <li className={status === "ready" ? "is-next" : undefined}>
            <span className="tracker-box" />
            Lever til {giver.name}
          </li>
        )}
      </ul>
      {status === "active" && state.result?.message && (
        <p className="tracker-note">{renderText(state.result.message)}</p>
      )}
      {status === "done" && rewards.length > 0 && (
        <p className="log-checked">
          {quest.thanks} Du fikk {rewards.join(" og ")}.
        </p>
      )}
      {status === "ready" && (
        <p className="log-where">
          Alt er klart. Gå til {giver.name} {giver.at} og lever.
        </p>
      )}
      <div className="log-done-actions">
        {status === "active" && quest.kind === "sanity" && (
          <button
            type="button"
            className="btn btn--amber log-code"
            onClick={() => {
              openStudio();
              onClose();
            }}
          >
            <IconQuill />
            Åpne Sanity Studio
          </button>
        )}
        {status !== "done" && (
          <button
            type="button"
            className={`btn ${status === "ready" ? "btn--amber" : "btn--quiet"} log-code`}
            onClick={() => onTravel(giver.site)}
          >
            Gå til {giver.name}
          </button>
        )}
      </div>
      {status === "active" && quest.hint && (
        <div className="log-hints">
          {hint ? (
            <p className="tracker-note">{renderText(quest.hint.text)}</p>
          ) : (
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => setHint(true)}
            >
              Vis et hint
            </button>
          )}
        </div>
      )}
    </article>
  );
}
