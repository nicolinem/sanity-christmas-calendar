"use client";

import { MAP_H, MAP_W, QUEST_SITES, type QuestSiteId } from "@/game/village";
import type { QuestBoard } from "@/game/quests/engine";
import type { QuestStatus } from "@/game/quests/types";
import { renderText } from "./richText";

const SITE_IDS: QuestSiteId[] = ["forge", "noticeboard", "westHouse"];
const STATUS_LABEL: Record<QuestStatus, string> = {
  active: "Aktiv",
  offered: "Snakk med Brann",
  skipped: "Hoppet over",
  done: "Ferdig",
  locked: "Låst",
};

export default function VillageMap({
  board,
  selectedId,
  onSelect,
  onTravel,
  onResume,
  onOpenQuest,
}: {
  board: QuestBoard;
  selectedId?: string;
  onSelect: (questId: string) => void;
  onTravel: (siteId: QuestSiteId) => void;
  onResume: (questId: string) => void;
  onOpenQuest: (questId: string) => void;
}) {
  const current = board.current;
  const selected = board.states.find((state) => state.quest.id === selectedId);
  const destination =
    current?.status === "offered"
      ? "forge"
      : (current?.quest.villageSite ?? "forge");
  const destinationLabel = destination && QUEST_SITES[destination].label;

  return (
    <div className="village-map-wrap">
      <div
        className="village-map"
        role="group"
        aria-label="Kart over Frostholm"
      >
        <svg
          className="village-map-art"
          viewBox="0 0 432 240"
          aria-hidden="true"
        >
          <rect width="432" height="240" fill="#28483f" />
          <path
            d="M184 56v64M136 128h96M80 96h104M224 128h80M184 144v96M48 176h120"
            fill="none"
            stroke="#7c5948"
            strokeWidth="24"
          />
          <path
            d="M184 56v64M136 128h96M80 96h104M224 128h80M184 144v96M48 176h120"
            fill="none"
            stroke="#b9865b"
            strokeWidth="16"
          />
          <rect
            x="160"
            y="32"
            width="40"
            height="24"
            fill="#763b36"
            stroke="#2e1d25"
            strokeWidth="4"
          />
          <rect
            x="64"
            y="48"
            width="32"
            height="24"
            fill="#bd6c4a"
            stroke="#2e1d25"
            strokeWidth="4"
          />
          <rect
            x="248"
            y="40"
            width="32"
            height="24"
            fill="#bd6c4a"
            stroke="#2e1d25"
            strokeWidth="4"
          />
          <rect
            x="40"
            y="136"
            width="32"
            height="24"
            fill="#bd6c4a"
            stroke="#2e1d25"
            strokeWidth="4"
          />
          <rect
            x="296"
            y="88"
            width="56"
            height="80"
            fill="#1e3c37"
            stroke="#8fd3ff"
            strokeWidth="2"
            strokeDasharray="6 5"
          />
          <path
            d="M304 98h8v8h-8zM328 112h8v8h-8zM312 138h8v8h-8zM336 150h8v8h-8z"
            fill="#527466"
          />
          <text x="180" y="27" textAnchor="middle">
            SMIA
          </text>
          <text x="184" y="155" textAnchor="middle">
            TORGET
          </text>
          <text x="324" y="182" textAnchor="middle">
            SKOGEN
          </text>
        </svg>
        {SITE_IDS.map((id) => {
          const site = QUEST_SITES[id];
          const states = board.states.filter(
            (state) =>
              (state.status === "offered"
                ? "forge"
                : (state.quest.villageSite ?? "forge")) === id,
          );
          const state =
            states.find((item) => item.status === "active") ??
            states.find((item) => item.status === "offered") ??
            states.find((item) => item.status === "skipped") ??
            states.find((item) => item.status === "locked") ??
            states.at(-1);
          if (!state) return null;

          return (
            <button
              key={id}
              type="button"
              className={`village-map-pin is-${state.status}${selectedId === state.quest.id ? " is-selected" : ""}`}
              style={{
                left: `${(site.mapX / (MAP_W * 16)) * 100}%`,
                top: `${(site.mapY / (MAP_H * 16)) * 100}%`,
              }}
              onClick={() => onSelect(state.quest.id)}
              aria-label={`${site.label}: luke ${state.quest.door}, ${STATUS_LABEL[state.status]}`}
              aria-current={selectedId === state.quest.id ? "true" : undefined}
            >
              <span className="village-map-pin-icon">
                {state.status === "done"
                  ? "✓"
                  : state.status === "locked"
                    ? "·"
                    : state.status === "skipped"
                      ? "↩"
                      : "!"}
              </span>
              <span className="village-map-pin-label">
                {site.label} · Luke {state.quest.door}
              </span>
            </button>
          );
        })}
      </div>
      <div className="village-map-foot">
        <p className="village-map-caption">
          {destinationLabel
            ? current?.status === "offered"
              ? "Brann har en ny luke til deg."
              : "Den aktive luka venter her."
            : "Ingen ny luke å finne akkurat nå."}{" "}
          Nye steder åpnes med historien.
        </p>
        <button
          type="button"
          className="btn btn--amber"
          disabled={!destination}
          onClick={() => destination && onTravel(destination)}
        >
          {current?.status === "offered"
            ? "Gå til Brann"
            : destinationLabel
              ? `Gå til ${destinationLabel}`
              : "Ingen aktiv luke"}
        </button>
      </div>
      {selected && (
        <article className="village-map-selected" aria-live="polite">
          {selected.status === "offered" ? (
            <p>Snakk med Brann ved smia for å få neste luke.</p>
          ) : selected.status === "locked" ? (
            <p>
              {selected.opensAt
                ? `Denne luka åpner ${selected.opensAt.toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}.`
                : "Denne luka åpnes senere i historien."}
            </p>
          ) : (
            <>
              <h3>
                Luke {selected.quest.door}: {selected.quest.title}
                <span className={`village-map-status is-${selected.status}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </h3>
              <p>{renderText(selected.quest.goal)}</p>
              {selected.status === "skipped" && (
                <button
                  type="button"
                  className="btn btn--amber"
                  onClick={() => onResume(selected.quest.id)}
                >
                  Ta igjen luka
                </button>
              )}
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => onOpenQuest(selected.quest.id)}
              >
                Åpne luke i journalen
              </button>
            </>
          )}
        </article>
      )}
    </div>
  );
}
