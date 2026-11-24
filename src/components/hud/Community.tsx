"use client";

import { useEffect, useState } from "react";
import {
  trackOf,
  weekProgress,
  type CommunityEvent,
  type CommunityPlayer,
} from "@/game/community";
import { PLAYER_ID } from "@/game/quests/progress";
import type { QuestTrack } from "@/game/quests/types";
import { normalizeFigure } from "@/game/figure";
import { communityEndpoint } from "@/game/communityEndpoint";
import FigureCanvas from "../figure/FigureCanvas";
import SpriteImage from "../SpriteImage";
import { CHAPTERS } from "@/game/quests/chapters";
import { lukeName } from "@/game/quests/label";

// «Luke 5: Hvem lyver?» for a quest id, in calendar order.
const QUESTS = CHAPTERS.flatMap((chapter) => chapter.quests);
const lukeLabel = (id: string) => {
  const quest = QUESTS.find((q) => q.id === id);
  return quest ? `${lukeName(quest)}: ${quest.title}` : id;
};

export default function Community() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [message, setMessage] = useState("Henter fra fellesskapet …");
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | QuestTrack>("all");

  useEffect(() => {
    let active = true;
    fetch(communityEndpoint, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("read_failed");
        return res.json() as Promise<{
          configured: boolean;
          events: CommunityEvent[];
          players: CommunityPlayer[];
        }>;
      })
      .then((data) => {
        if (!active) return;
        setEvents(data.events);
        setPlayers(data.players ?? []);
        setMessage(
          data.configured
            ? "Ingen spillere ennå."
            : "Fellesskapet er ikke koblet til ennå.",
        );
      })
      .catch(() => {
        if (active)
          setMessage(
            "Kunne ikke hente hendelser. Åpne fanen på nytt for å prøve igjen.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const names = new Map(players.map((p) => [p.playerId, p.name]));
  const label = (id: string) =>
    names.get(id) ?? (id === PLAYER_ID ? "Du" : `Spiller ${id}`);
  // Newest first from the server, so the first one per player is the latest.
  const latest = new Map<string, CommunityEvent>();
  const fromEvents = new Map<string, Set<string>>();
  for (const event of events) {
    if (!latest.has(event.playerId)) latest.set(event.playerId, event);
    if (!fromEvents.has(event.playerId))
      fromEvents.set(event.playerId, new Set());
    fromEvents.get(event.playerId)!.add(event.questId);
  }
  // Which lukes: from the server, or else from the feed when it has them all.
  const lukesOf = (player: CommunityPlayer) => {
    if (player.completed) return player.completed;
    const seen = fromEvents.get(player.playerId);
    return seen && seen.size >= player.completedCount ? [...seen] : null;
  };
  // Everyone is listed; the filter narrows to one track. A player who hasn't
  // done a track's own luke yet is only under «Alle».
  const shown =
    filter === "all"
      ? players
      : players.filter((p) => trackOf(lukesOf(p) ?? []) === filter);

  return (
    <div className="log-book log-community" aria-live="polite">
      <div className="community-heading">
        <div>
          <h2>Hvem er med</h2>
          <p>Alle som spiller, og hvor langt de har kommet.</p>
        </div>
        {players.length > 0 && (
          <div className="community-chips">
            <span>
              {players.length} {players.length === 1 ? "deltaker" : "deltakere"}
            </span>
            <div
              className="community-filter"
              role="group"
              aria-label="Vis spor"
            >
              {(
                [
                  ["all", "Alle"],
                  ["technical", "Teknisk"],
                  ["nonTechnical", "Ikke-teknisk"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {players.length === 0 ? (
        <p className="log-lesson-text">{message}</p>
      ) : (
        <div className="community-layout">
          <ol className="community-board">
            {shown.length === 0 && (
              <li className="community-none">Ingen på dette sporet ennå.</li>
            )}
            {shown.map((player, index) => (
              <PlayerRow
                key={player.playerId}
                player={player}
                name={player.name ?? label(player.playerId)}
                lukes={lukesOf(player)}
                last={latest.get(player.playerId)}
                rank={index + 1}
                open={open === player.playerId}
                onToggle={() =>
                  setOpen((id) =>
                    id === player.playerId ? null : player.playerId,
                  )
                }
              />
            ))}
          </ol>
          <aside className="community-feed">
            <h3>Siste nytt</h3>
            {events.length === 0 ? (
              <p>Ingenting har skjedd ennå.</p>
            ) : (
              <ul>
                {events.slice(0, 12).map((event) => (
                  <li key={`${event.playerId}:${event.questId}`}>
                    <strong>{label(event.playerId)}</strong> fullførte «
                    {event.title}»
                    {event.hints === 0
                      ? " uten hint"
                      : typeof event.hints === "number"
                        ? ` med ${event.hints} hint`
                        : ""}
                    <time dateTime={event.at}>
                      {new Date(event.at).toLocaleDateString("nb-NO")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

const TOTAL_LUKES = weekProgress([]).reduce((sum, w) => sum + w.total, 0);

// A chip per week: its pips and «3/4», gold when the week is done. Compact in
// the row, with the week's name when a row is open. Without the list of lukes
// (an older server), one chip with the count.
function WeekChips({
  lukes,
  count,
  compact = false,
}: {
  lukes: string[] | null;
  count: number;
  compact?: boolean;
}) {
  const weeks = lukes
    ? weekProgress(lukes)
    : [{ week: 0, done: count, total: Math.max(TOTAL_LUKES, count) }];
  return (
    <ul className={`community-weeks${compact ? " is-compact" : ""}`}>
      {weeks.map(({ week, done, total }) => {
        const name = week ? `Uke ${week}` : "Luker";
        return (
          <li
            key={week}
            className={done === total ? "is-done" : done > 0 ? "is-going" : ""}
            aria-label={`${name}: ${done} av ${total} luker`}
            title={compact ? name : undefined}
          >
            {!compact && <span className="community-week-name">{name}</span>}
            <span className="community-week-pips" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <i key={i} className={i < done ? "is-on" : undefined} />
              ))}
            </span>
            <span className="community-week-count" aria-hidden="true">
              {done}/{total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function hintTotal(player: CommunityPlayer) {
  if (!player.hints) return null;
  return Object.values(player.hints).reduce((sum, n) => sum + n, 0);
}

function PlayerRow({
  player,
  name,
  lukes,
  last,
  rank,
  open,
  onToggle,
}: {
  player: CommunityPlayer;
  name: string;
  lukes: string[] | null;
  last?: CommunityEvent;
  rank: number;
  open: boolean;
  onToggle: () => void;
}) {
  const me = player.playerId === PLAYER_ID;
  const hints = hintTotal(player);
  // The non-technical track has fewer lukes.
  const total = lukes
    ? weekProgress(lukes).reduce((sum, w) => sum + w.total, 0)
    : TOTAL_LUKES;
  return (
    <li
      className={`community-entry${me ? " is-me" : ""}${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="community-row"
        aria-expanded={open}
        aria-label={`${name}, ${player.completedCount} av ${total} luker`}
        onClick={onToggle}
      >
        <span className="community-rank">{rank}</span>
        <span className="community-row-figure">
          <FigureCanvas choice={normalizeFigure(player.figure)} scale={2} />
        </span>
        <span className="community-row-name">
          {name}
          {me && <small> (deg)</small>}
        </span>
        <WeekChips lukes={lukes} count={player.completedCount} compact />
        <span className="community-row-count">
          {player.completedCount}
          <small>/{total}</small>
        </span>
        <span className="community-row-hints">
          {hints === null ? "–" : `${hints} hint`}
        </span>
      </button>
      {open && (
        <div className="community-more">
          <div className="community-figure">
            <FigureCanvas choice={normalizeFigure(player.figure)} scale={5} />
          </div>
          <div className="community-more-text">
            <p className="community-weapon">
              {player.weapon?.spriteId && (
                <SpriteImage
                  spriteId={player.weapon.spriteId}
                  kind="weapon"
                  scale={2}
                />
              )}
              {player.weapon?.name ?? "Ingen våpen ennå"}
            </p>
            {lukes && <WeekChips lukes={lukes} count={player.completedCount} />}
            {last && (
              <p className="community-last">
                <small>Sist fullført</small>
                <span>{last.title}</span>
              </p>
            )}
          </div>
          {player.hints && <HintSummary hints={player.hints} />}
        </div>
      )}
    </li>
  );
}

// Hints a player used on each luke they finished.
function HintSummary({ hints }: { hints: Record<string, number> }) {
  const entries = QUESTS.filter((q) => q.id in hints).map(
    (q) => [q.id, hints[q.id]] as const,
  );
  if (!entries.length) return null;
  return (
    <div className="community-hints">
      <p>Hint per luke</p>
      <ul>
        {entries.map(([id, n]) => (
          <li key={id}>
            <span>{lukeLabel(id)}</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
