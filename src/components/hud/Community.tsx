"use client";

import { useEffect, useState } from "react";
import type { CommunityEvent, CommunityPlayer } from "@/game/community";
import { PROGRESS_PROJECT } from "@/game/quests/progress";
import { MAX_FORGE_LEVEL } from "@/game/rules";
import { resolveItemSprite } from "@/game/sprites";
import KnightPreview from "../KnightPreview";
import SpriteIcon from "./SpriteIcon";

export default function Community() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<CommunityPlayer[]>([]);
  const [message, setMessage] = useState("Henter fra fellesskapet …");

  useEffect(() => {
    let active = true;
    fetch("/api/community", { cache: "no-store" })
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

  const label = (id: string) => id === PROGRESS_PROJECT ? "Du" : `Spiller ${id}`;

  return (
    <div className="log-book log-community" aria-live="polite">
      <div className="community-heading">
        <h2>Hvem er med</h2>
        <p>Ridderne i Frostholm · samme grunnfigur frem til sprite-creatoren er klar.</p>
      </div>
      {players.length === 0 ? <p className="log-lesson-text">{message}</p> : (
        <div className="community-layout">
          <div className="community-players">
            {players.map((player) => (
              <article className="community-player" key={player.playerId}>
                <div className="community-player-top">
                  <KnightPreview spriteId={player.weapon?.spriteId} kind="weapon" showWeapon={Boolean(player.weapon)} scale={2} />
                  <div>
                    <h3>{label(player.playerId)}</h3>
                    <p>Ridder · smia nivå {player.forgeLevel}</p>
                    <p>{player.completedCount} {player.completedCount === 1 ? "fullført luke" : "fullførte luker"}</p>
                  </div>
                </div>
                <div className="community-level" aria-label={`Smia nivå ${player.forgeLevel} av ${MAX_FORGE_LEVEL}`}>
                  {Array.from({ length: MAX_FORGE_LEVEL }, (_, i) => (
                    <span key={i} className={i < player.forgeLevel ? "is-on" : ""} />
                  ))}
                </div>
                <div className="community-weapon">
                  {player.weapon ? (
                    <>
                      <SpriteIcon sprite={resolveItemSprite(player.weapon.spriteId, "weapon")} scale={2} />
                      <span>{player.weapon.name}<small>Valgt våpen</small></span>
                    </>
                  ) : <span>Ingen publisert våpen valgt</span>}
                </div>
              </article>
            ))}
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