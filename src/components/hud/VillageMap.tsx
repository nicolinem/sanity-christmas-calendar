"use client";

import { giverOf, lukeName } from "@/game/quests/label";
import { useState } from "react";
import { bridge } from "@/game/bridge";
import { weekDoors } from "@/game/quests/doors";
import type { QuestBoard } from "@/game/quests/engine";
import { TILE } from "@/game/sprites";
import { useVillageCanvas } from "./villageCanvas";
import {
  MAP_H,
  MAP_W,
  NPCS,
  QUEST_SITES,
  placeDoors,
  shouldShowQuestNpc,
  type QuestSiteId,
} from "@/game/village";
import SpriteIcon from "./SpriteIcon";
import { nextStep } from "./nextStep";

const W = MAP_W * TILE;
const H = MAP_H * TILE;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

const STATUS_LABEL = {
  locked: "låst",
  open: "åpen",
  done: "ferdig",
} as const;

// The journal's map tab: the real village with this week's doors over their
// places, Brann's «!» while he has something for you, and where you stand.
// Its job is to show how much of the village is lit; the arrow at the edge of
// the screen does the way-finding.
export default function VillageMap({
  board,
  onTravel,
  onOpenQuest,
  onOpenCode,
  onOpenBoard,
  onOpenStudio,
}: {
  board: QuestBoard;
  onTravel: (siteId: QuestSiteId) => void;
  onOpenQuest: (questId: string) => void;
  onOpenCode: (questId: string) => void;
  onOpenBoard: (questId: string) => void;
  onOpenStudio: () => void;
}) {
  const current = board.current;
  const showKari = shouldShowQuestNpc(current, "kari");
  const canvas = useVillageCanvas({ showKari });
  const [knight] = useState(() => ({ ...bridge.knight }));
  const doors = placeDoors(weekDoors(board));
  const week = board.states.find((s) => s.quest.id === doors[0]?.id)?.chapter;
  // The optional luke isn't part of the week's count.
  const core = doors.filter((d) => !d.bonus);
  const lit = core.filter((d) => d.status === "done").length;
  const step = nextStep(current);
  const runStep = () => {
    if (!step) return;
    if (step.kind === "giver") onTravel(step.site);
    else if (step.kind === "code") onOpenCode(step.questId);
    else if (step.kind === "board") onOpenBoard(step.questId);
    else if (step.kind === "travel") onTravel(step.site);
    else if (step.kind === "studio") onOpenStudio();
    else onOpenQuest(step.questId);
  };
  const title = (id: string) =>
    board.states.find((s) => s.quest.id === id)?.quest.title ?? "";

  return (
    <div className="vmap">
      <div className="vmap-frame" role="group" aria-label="Kart over bygda">
        <canvas
          ref={canvas}
          className="vmap-canvas"
          width={W}
          height={H}
          aria-hidden="true"
        />
        {showKari && (
          <span
            className="vmap-kari"
            style={{
              left: pct(NPCS.kari.x, W),
              top: pct(NPCS.kari.y - 20, H),
            }}
            role="img"
            aria-label={`Kari står ${NPCS.kari.at}`}
          >
            <span className="vmap-kari-dot" />
            <span className="vmap-kari-label">Kari</span>
          </span>
        )}
        {current?.status === "offered" && !current.pickup && (
          <span
            className="vmap-brann"
            style={{
              left: pct(giverOf(current.quest).x, W),
              top: pct(giverOf(current.quest).y - 22, H),
            }}
            aria-hidden="true"
          >
            !
          </span>
        )}
        {doors.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`vmap-door is-${d.status}${d.bonus ? " is-bonus" : ""}`}
            style={{ left: pct(d.x, W), top: pct(d.y, H) }}
            onClick={() => onOpenQuest(d.id)}
            aria-label={`${d.bonus ? "☆ Frivillig" : `Luke ${d.door}`}, ${STATUS_LABEL[d.status]}: ${QUEST_SITES[d.site].label}`}
          >
            <SpriteIcon sprite={{ sheet: "town", frame: 84 }} />
            <span className="vmap-door-n">{d.bonus ? "☆" : d.door}</span>
          </button>
        ))}
        {knight.x > 0 && (
          <span
            className="vmap-you"
            style={{ left: pct(knight.x, W), top: pct(knight.y, H) }}
          >
            <span className="vmap-you-dot" />
            <span className="vmap-you-label">Du</span>
          </span>
        )}
      </div>

      <aside className="vmap-side">
        <p className="vmap-kicker">
          {week ? `Uke ${week.number} i bygda` : "Bygda"}
        </p>
        <p className="vmap-count">
          {lit} av {core.length} luker lyser
        </p>
        {current && step && (
          <div className="vmap-next">
            <p className="vmap-kicker">
              Neste steg · {lukeName(current.quest).toLowerCase()}
            </p>
            {step.where && <p>{step.where}</p>}
            <button type="button" className="btn btn--amber" onClick={runStep}>
              {step.label}
            </button>
          </div>
        )}
        <ul className="vmap-list">
          {doors.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className={`vmap-row is-${d.status}`}
                onClick={() => onOpenQuest(d.id)}
              >
                <span
                  className={`vmap-door is-${d.status}${d.bonus ? " is-bonus" : ""} is-inline`}
                >
                  <SpriteIcon sprite={{ sheet: "town", frame: 84 }} />
                </span>
                <span className="vmap-row-text">
                  <span className="vmap-row-meta">
                    {d.bonus ? "☆ Frivillig" : `Luke ${d.door}`} ·{" "}
                    {QUEST_SITES[d.site].label} · {STATUS_LABEL[d.status]}
                  </span>
                  {d.id === current?.quest.id &&
                  current.status === "offered" &&
                  !current.pickup
                    ? `Snakk med ${giverOf(current.quest).name}`
                    : title(d.id)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="vmap-hint">
          Er målet utenfor skjermen, peker en «!» i kanten av bildet dit.
        </p>
      </aside>
    </div>
  );
}
