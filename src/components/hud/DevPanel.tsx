"use client";

import { useState } from "react";
import { bridge } from "@/game/bridge";
import type { QuestBoard } from "@/game/quests/engine";
import type { CodeCheck } from "@/game/quests/types";
import type { SpriteDef } from "@/game/sprites";
import type { LiveMode } from "./useLive";
import { renderCode } from "./QuestTracker";

type Props = {
  board: QuestBoard;
  forgeLevel: number;
  liveMode: LiveMode;
  codeChecks: Record<string, CodeCheck>; // what `npm run quest` reported
  devChecks: Record<string, boolean>; // overrides set here
  onDevCheck: (questId: string, done: boolean | null) => void;
  onJump: (questId: string, briefed: boolean) => void;
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
  onReset,
  weaponSprite,
}: Props) {
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
        Smienivå {forgeLevel}, {board.completedCount}/{board.total} ferdig, prosjekt{" "}
        <code>{process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo"}</code>
      </p>

      <h3 className="dev-title">Oppdrag</h3>
      <ol className="dev-quests">
        {board.states.map((s) => {
          const code = s.quest.checkedBy === "code";
          const override = devChecks[s.quest.id];
          return (
            <li key={s.quest.id} className={s === board.current ? "is-current" : undefined}>
              <details>
                <summary>
                  <span className="dev-quest-title">{s.quest.title}</span>
                  <span className={`dev-status is-${s.status}`}>{STATUS[s.status]}</span>
                </summary>
                <div className="dev-steps">
                  {s.quest.intro.map((page, i) => (
                    <p key={i}>
                      <span className="dev-label">Brann {i + 1}</span> {page}
                    </p>
                  ))}
                  <p>
                    <span className="dev-label">Mål</span> {renderCode(s.quest.goal)}
                  </p>
                  {s.quest.where && (
                    <p>
                      <span className="dev-label">Hvor</span> {renderCode(s.quest.where)}
                    </p>
                  )}
                  {s.quest.hints.map((h, i) => (
                    <p key={i}>
                      <span className="dev-label">Hint {i + 1}</span> {renderCode(h.text)}
                    </p>
                  ))}
                  <p>
                    <span className="dev-label">Lærdom</span> {s.quest.lesson.title}: {renderCode(s.quest.lesson.text)}
                  </p>
                  <p>
                    <span className="dev-label">Sjekk nå</span>{" "}
                    {s.result.done ? "bestått" : renderCode(s.result.message ?? "ikke bestått")}
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
          Nytt blad fra smia
        </button>
        <button type="button" onClick={() => bridge.emit("forgeFlare", undefined)}>
          Smia blusser
        </button>
        <button type="button" onClick={() => bridge.emit("forgeLevelUp", forgeLevel)}>
          Smienivå opp
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
