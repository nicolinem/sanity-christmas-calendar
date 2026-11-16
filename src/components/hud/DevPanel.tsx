"use client";

import { useState } from "react";
import { bridge } from "@/game/bridge";
import type { QuestBoard } from "@/game/quests/engine";
import type { CodeCheck, QuestTrack } from "@/game/quests/types";
import type { SpriteDef } from "@/game/sprites";
import type { LiveMode } from "./useLive";
import { renderText } from "./richText";

type Props = {
  board: QuestBoard;
  forgeLevel: number;
  liveMode: LiveMode;
  codeChecks: Record<string, CodeCheck>; // what `npm run quest` reported
  devChecks: Record<string, boolean>; // overrides set here
  onDevCheck: (questId: string, done: boolean | null) => void;
  onJump: (questId: string, briefed: boolean) => void;
  onComplete: (questId: string) => void;
  track: QuestTrack;
  onTrack: (track: QuestTrack) => void;
  onReset: () => void;
  weaponSprite: SpriteDef | null;
};

const LIVE: Record<LiveMode, string> = {
  off: "av",
  live: "lytter på Sanity",
  polling: "sjekker hvert 4. sekund (CORS stopper lytting)",
};

const STATUS: Record<string, string> = { done: "ferdig", active: "gitt", offered: "tilbudt", locked: "låst" };

// For organizers and testers, only with ?dev in the address: jump to any
// quest, read every quest step by step, fake code checks and replay effects.
// Players never see it.
export default function DevPanel({
  board,
  forgeLevel,
  liveMode,
  codeChecks,
  devChecks,
  onDevCheck,
  onJump,
  onComplete,
  track,
  onTrack,
  onReset,
  weaponSprite,
}: Props) {
  const current = board.current && board.current.status !== "done" ? board.current : null;

  const [open, setOpen] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open)
    return (
      <button type="button" className="dev-toggle" onClick={() => setOpen(true)}>
        Dev
      </button>
    );

  return (
    <aside className="dev frame frame--slate" aria-label="Utviklerpanel">
      <header className="dev-head">
        <strong>Utviklerpanel</strong>
        <button type="button" className="dev-link" onClick={() => setOpen(false)}>
          Skjul
        </button>
      </header>

      <p className="dev-line">
        Sanntid: <span className={`dev-live is-${liveMode}`}>{LIVE[liveMode]}</span>
      </p>
      <p className="dev-line">
        Nivå {forgeLevel}, {board.completedCount}/{board.total} luker ferdig, prosjekt{" "}
        <code>{process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo"}</code>
      </p>

      <p className="dev-line">Alle uker og luker er åpne, uansett dato og rekkefølge.</p>
      <p className="dev-line">
        Løype:{" "}
        <select value={track} onChange={(e) => onTrack(e.target.value as QuestTrack)}>
          <option value="technical">Teknisk</option>
          <option value="nonTechnical">Ikke-teknisk</option>
        </select>
      </p>
      {current && (
        <div className="dev-actions">
          <button type="button" onClick={() => onComplete(current.quest.id)}>
            Fullfør {current.quest.bonus ? "☆ Frivillig" : `luke ${current.quest.door}`}
          </button>
        </div>
      )}

      <h3 className="dev-title">Oppdrag</h3>
      <ol className="dev-quests">
        {board.states.map((s) => {
          const code = s.quest.checkedBy === "code";
          const override = devChecks[s.quest.id];
          return (
            <li key={s.quest.id} className={s === board.current ? "is-current" : undefined}>
              <details>
                <summary>
                  <span className="dev-quest-title">
                    {s.quest.bonus ? "☆ Frivillig" : `Luke ${s.quest.door}`}: {s.quest.title}
                  </span>
                  <span className={`dev-status is-${s.status}`}>{STATUS[s.status]}</span>
                </summary>
                <div className="dev-steps">
                  {s.quest.intro.map((page, i) => (
                    <p key={i}>
                      <span className="dev-label">Brann {i + 1}</span> {page}
                    </p>
                  ))}
                  <p>
                    <span className="dev-label">Mål</span> {renderText(s.quest.goal)}
                  </p>
                  {s.quest.where && (
                    <p>
                      <span className="dev-label">Hvor</span> {renderText(s.quest.where)}
                    </p>
                  )}
                  {s.quest.hints.map((h, i) => (
                    <p key={i}>
                      <span className="dev-label">Hint {i + 1}</span> {renderText(h.text)}
                    </p>
                  ))}
                  <p>
                    <span className="dev-label">Lærdom</span> {renderText(s.quest.lesson.title)}: {renderText(s.quest.lesson.text)}
                  </p>
                  <p>
                    <span className="dev-label">Sjekk nå</span>{" "}
                    {s.result.done ? "bestått" : renderText(s.result.message ?? "ikke bestått")}
                  </p>
                </div>
              </details>
              <div className="dev-actions">
                <button type="button" onClick={() => onJump(s.quest.id, false)} title="Alt før er ferdig, Brann har ikke gitt denne">
                  Hopp hit
                </button>
                <button type="button" onClick={() => onJump(s.quest.id, true)} title="Alt før er ferdig, og denne er gitt">
                  …som gitt
                </button>
                {s.status !== "done" && (
                  <button type="button" onClick={() => onComplete(s.quest.id)} title="Merk som fullført uten å gjøre oppgaven">
                    Fullfør
                  </button>
                )}
                {code && (
                  <select
                    value={override === undefined ? "" : override ? "pass" : "fail"}
                    onChange={(e) => onDevCheck(s.quest.id, e.target.value === "" ? null : e.target.value === "pass")}
                    title={`npm run quest sa: ${codeChecks[s.quest.id]?.done ? "bestått" : "ikke bestått"}`}
                  >
                    <option value="">Ekte sjekk</option>
                    <option value="pass">Lat som bestått</option>
                    <option value="fail">Lat som ikke bestått</option>
                  </select>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="dev-actions">
        <button type="button" onClick={() => onJump("__end", false)}>
          Alt ferdig
        </button>
      </div>

      <h3 className="dev-title">Effekter</h3>
      <div className="dev-actions">
        <button type="button" onClick={() => bridge.emit("itemForged", weaponSprite ?? { sheet: "dungeon", frame: 105 })}>
          Nytt våpen
        </button>
        <button type="button" onClick={() => bridge.emit("forgeFlare", undefined)}>
          Smia lyser opp
        </button>
        <button type="button" onClick={() => bridge.emit("forgeLevelUp", forgeLevel)}>
          Nivå opp
        </button>
      </div>

      <h3 className="dev-title">Nullstill</h3>
      <div className="dev-actions">
        <button
          type="button"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            onReset();
            setConfirmReset(false);
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? "Klikk igjen: alt slettes, åpningen også" : "Nullstill all fremgang"}
        </button>
      </div>
    </aside>
  );
}
