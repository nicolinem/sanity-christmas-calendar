"use client";

import { useEffect, useState } from "react";
import type { CommunityEvent, CommunityPlayer } from "@/game/community";
import { PLAYER_ID } from "@/game/quests/progress";
import { MAX_FORGE_LEVEL } from "@/game/rules";
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

  return (
    <div className="log-book log-community" aria-live="polite">
      <div className="community-heading">
        <div>
          <h2>Hvem er med</h2>
          <p>Alle i Frostholm og hvor langt de har kommet.</p>
        </div>
        {players.length > 0 && (
          <div className="community-chips">
            <span>
              {players.length} {players.length === 1 ? "deltaker" : "deltakere"}
            </span>
          </div>
        )}
      </div>
      {players.length === 0 ? (
        <p className="log-lesson-text">{message}</p>
      ) : (
        <div className="community-layout">
          <div className="community-players">
            {players.map((player) => {
              const me = player.playerId === PLAYER_ID;
              return (
                <article
                  className={`community-player${me ? " is-me" : ""}`}
                  key={player.playerId}
                >
                  <div className="community-player-top">
                    <div className="community-figure">
                      <FigureCanvas
                        choice={normalizeFigure(player.figure)}
                        scale={4}
                      />
                    </div>
                    <div>
                      <h3>
                        {player.name ?? label(player.playerId)}
                        {me && <small> (deg)</small>}
                      </h3>
                      <p>
                        {player.completedCount}{" "}
                        {player.completedCount === 1
                          ? "luke fullført"
                          : "luker fullført"}
                      </p>
                      {player.weapon && (
                        <p className="community-weapon">
                          {player.weapon.spriteId && (
                            <SpriteImage
                              spriteId={player.weapon.spriteId}
                              kind="weapon"
                              scale={1}
                            />
                          )}
                          {player.weapon.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {player.hints && <HintSummary hints={player.hints} />}
                  <div
                    className="community-level"
                    aria-label={`Nivå ${player.forgeLevel} av ${MAX_FORGE_LEVEL}`}
                  >
                    {Array.from({ length: MAX_FORGE_LEVEL }, (_, i) => (
                      <span
                        key={i}
                        className={i < player.forgeLevel ? "is-on" : ""}
                      />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
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

// Hints a player used: the total, and per luke when you open it.
function HintSummary({ hints }: { hints: Record<string, number> }) {
  const entries = QUESTS.filter((q) => q.id in hints).map(
    (q) => [q.id, hints[q.id]] as const,
  );
  if (!entries.length) return null;
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  const clean = entries.filter(([, n]) => n === 0).length;
  return (
    <details className="community-hints">
      <summary>
        {total} hint totalt · {clean} uten hint
      </summary>
      <ul>
        {entries.map(([id, n]) => (
          <li key={id}>
            <span>{lukeLabel(id)}</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
