"use client";

import { useEffect, useState } from "react";
import type { CommunityEvent, CommunityPlayer } from "@/game/community";
import { PROGRESS_PROJECT } from "@/game/quests/progress";
import { MAX_FORGE_LEVEL } from "@/game/rules";
import { normalizeFigure } from "@/game/figure";
import { communityEndpoint } from "@/game/communityEndpoint";
import FigureCanvas from "../figure/FigureCanvas";

export default function Community() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [message, setMessage] = useState("Henter fra fellesskapet …");

  useEffect(() => {
    let active = true;
    fetch(communityEndpoint, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("read_failed");
        return res.json() as Promise<{ configured: boolean; events: CommunityEvent[]; players: CommunityPlayer[] }>;
      })
      .then((data) => {
        if (!active) return;
        setEvents(data.events);
        setPlayers(data.players ?? []);
        setMessage(data.configured ? "Ingen spillere ennå." : "Fellesskapet er ikke koblet til ennå.");
      })
      .catch(() => {
        if (active) setMessage("Kunne ikke hente hendelser. Åpne fanen på nytt for å prøve igjen.");
      });
    return () => { active = false; };
  }, []);

  const names = new Map(players.map((p) => [p.playerId, p.name]));
  const label = (id: string) => names.get(id) ?? (id === PROGRESS_PROJECT ? "Du" : `Spiller ${id}`);

  return (
    <div className="log-book log-community" aria-live="polite">
      <div className="community-heading">
        <div>
          <h2>Hvem er med</h2>
          <p>Alle i Frostholm og hvor langt de har kommet.</p>
        </div>
        {players.length > 0 && (
          <div className="community-chips">
            <span>{players.length} {players.length === 1 ? "deltaker" : "deltakere"}</span>
          </div>
        )}
      </div>
      {players.length === 0 ? <p className="log-lesson-text">{message}</p> : (
        <div className="community-layout">
          <div className="community-players">
            {players.map((player) => {
              const me = player.playerId === PROGRESS_PROJECT;
              return (
                <article className={`community-player${me ? " is-me" : ""}`} key={player.playerId}>
                  <div className="community-player-top">
                    <div className="community-figure">
                      <FigureCanvas choice={normalizeFigure(player.figure)} scale={4} />
                    </div>
                    <div>
                      <h3>{player.name ?? label(player.playerId)}{me && <small> (deg)</small>}</h3>
                      <p>{player.completedCount} {player.completedCount === 1 ? "luke fullført" : "luker fullført"}</p>
                    </div>
                  </div>
                  <div className="community-level" aria-label={`Smia nivå ${player.forgeLevel} av ${MAX_FORGE_LEVEL}`}>
                    {Array.from({ length: MAX_FORGE_LEVEL }, (_, i) => (
                      <span key={i} className={i < player.forgeLevel ? "is-on" : ""} />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="community-feed">
            <h3>Siste nytt</h3>
            {events.length === 0 ? <p>Ingen luker fullført ennå.</p> : (
              <ul>
                {events.slice(0, 12).map((event) => (
                  <li key={`${event.playerId}:${event.questId}`}>
                    <strong>{label(event.playerId)}</strong> fullførte «{event.title}»
                    <time dateTime={event.at}>{new Date(event.at).toLocaleDateString("nb-NO")}</time>
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
