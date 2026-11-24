"use client";

import { useState } from "react";
import type { SideState } from "@/game/sideQuests/types";
import { NPCS, type NpcId, type QuestSiteId } from "@/game/village";
import { renderText } from "./richText";

type Props = {
  states: SideState[];
  onTravel: (site: QuestSiteId) => void;
};

const STATUS: Partial<Record<SideState["status"], string>> = {
  ready: "klart å levere",
  active: "pågår",
  available: "nytt",
};

// «Sideoppdrag» at the bottom of the week's list in the journal: what's
// ready, what's in progress, what's new, and the finished ones folded away.
export default function SideQuestList({ states, onTravel }: Props) {
  const [showDone, setShowDone] = useState(false);
  const order = ["ready", "active", "available"] as const;
  const open = order.flatMap((status) =>
    states.filter((s) => s.status === status),
  );
  const done = states.filter((s) => s.status === "done");
  if (!open.length && !done.length) return null;

  return (
    <section className="side-list" aria-label="Sideoppdrag">
      <p className="log-chapter-title">Sideoppdrag</p>
      <ul>
        {open.map((s) => {
          const giver = NPCS[s.quest.giver as NpcId];
          return (
            <li key={s.quest.id} className={`side-row is-${s.status}`}>
              <span className="log-quest-door">
                {giver?.name ?? ""} · {STATUS[s.status]}
              </span>
              <span className="side-row-title">
                {s.status === "available"
                  ? `${giver?.name ?? ""} har noe på hjertet`
                  : s.quest.title}
              </span>
              {s.status === "active" && (
                <span className="side-row-goal">
                  {renderText(s.quest.goal)}
                </span>
              )}
              {giver && s.status !== "active" && (
                <button
                  type="button"
                  className="btn btn--quiet side-row-go"
                  onClick={() => onTravel(giver.site)}
                >
                  Gå til {giver.name}
                </button>
              )}
            </li>
          );
        })}
      </ul>
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
          {showDone && (
            <ul>
              {done.map((s) => (
                <li key={s.quest.id} className="side-row is-done">
                  <span className="side-row-title">{s.quest.title}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
