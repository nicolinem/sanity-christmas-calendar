"use client";

import { useEffect, useRef, useState } from "react";
import { bridge } from "@/game/bridge";
import { weekDoors } from "@/game/quests/doors";
import type { QuestBoard } from "@/game/quests/engine";
import { SHEETS, TILE } from "@/game/sprites";
import {
  BLACKSMITH,
  BUILDINGS,
  GROUND,
  MAP_H,
  MAP_W,
  PROPS,
  QUEST_SITES,
  TREES,
  placeDoors,
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

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// The village drawn from the same tile data the world uses (village.ts), so
// the map is Frostholm in miniature rather than a separate drawing.
function useVillageCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(SHEETS.town.url), loadImage(SHEETS.dungeon.url)])
      .then(([town, dungeon]) => {
        const ctx = ref.current?.getContext("2d");
        if (!ctx || cancelled) return;
        ctx.imageSmoothingEnabled = false;
        const sheets = { town, dungeon };
        const draw = (
          sheet: keyof typeof sheets,
          frame: number,
          x: number,
          y: number,
        ) => {
          const cols = SHEETS[sheet].cols;
          ctx.drawImage(
            sheets[sheet],
            (frame % cols) * TILE,
            Math.floor(frame / cols) * TILE,
            TILE,
            TILE,
            x,
            y,
            TILE,
            TILE,
          );
        };
        GROUND.forEach((row, y) =>
          row.forEach((frame, x) => draw("town", frame, x * TILE, y * TILE)),
        );
        for (const b of BUILDINGS)
          b.rows.forEach((row, r) =>
            row.forEach((frame, c) =>
              draw("town", frame, (b.x + c) * TILE, (b.y + r) * TILE),
            ),
          );
        for (const p of PROPS) draw(p.sheet, p.frame, p.x * TILE, p.y * TILE);
        draw("dungeon", 86, BLACKSMITH.x - 8, BLACKSMITH.y - TILE);
        for (const t of [...TREES].sort((a, b) => a.y - b.y))
          draw("town", t.frame, t.x - 8, t.y - TILE);
      })
      .catch(() => {
        // The markers and list still work without the picture.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return ref;
}

// The journal's map tab: the real village with this week's doors over their
// places, Brann's «!» while he has something for you, and where you stand.
// Its job is to show how much of the village is lit; the arrow at the edge of
// the screen does the way-finding.
export default function VillageMap({
  board,
  onTravel,
  onOpenQuest,
  onOpenCode,
  onOpenStudio,
}: {
  board: QuestBoard;
  onTravel: (siteId: QuestSiteId) => void;
  onOpenQuest: (questId: string) => void;
  onOpenCode: (questId: string) => void;
  onOpenStudio: () => void;
}) {
  const canvas = useVillageCanvas();
  const [knight] = useState(() => ({ ...bridge.knight }));
  const doors = placeDoors(weekDoors(board));
  const current = board.current;
  const week = board.states.find((s) => s.quest.id === doors[0]?.id)?.chapter;
  const lit = doors.filter((d) => d.status === "done").length;
  const step = nextStep(current);
  const runStep = () => {
    if (!step) return;
    if (step.kind === "brann") onTravel("forge");
    else if (step.kind === "code") onOpenCode(step.questId);
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
        {current?.status === "offered" && !current.pickup && (
          <span
            className="vmap-brann"
            style={{
              left: pct(BLACKSMITH.x, W),
              top: pct(BLACKSMITH.y - 22, H),
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
            className={`vmap-door is-${d.status}`}
            style={{ left: pct(d.x, W), top: pct(d.y, H) }}
            onClick={() => onOpenQuest(d.id)}
            aria-label={`Luke ${d.door}, ${STATUS_LABEL[d.status]}: ${QUEST_SITES[d.site].label}`}
          >
            <SpriteIcon sprite={{ sheet: "town", frame: 84 }} />
            <span className="vmap-door-n">{d.door}</span>
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
          {lit} av {doors.length} luker lyser
        </p>
        {current && step && (
          <div className="vmap-next">
            <p className="vmap-kicker">
              Neste steg · luke {current.quest.door}
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
                <span className={`vmap-door is-${d.status} is-inline`}>
                  <SpriteIcon sprite={{ sheet: "town", frame: 84 }} />
                </span>
                <span className="vmap-row-text">
                  <span className="vmap-row-meta">
                    Luke {d.door} · {QUEST_SITES[d.site].label} ·{" "}
                    {STATUS_LABEL[d.status]}
                  </span>
                  {d.id === current?.quest.id &&
                  current.status === "offered" &&
                  !current.pickup
                    ? "Snakk med Brann"
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
