"use client";

import { useEffect, useRef, useState } from "react";
import { FIGURE_OPTIONS, type FigureChoice } from "@/game/figure";
import { rewardGear } from "@/game/reward";
import type { SideState } from "@/game/sideQuests/types";
import type { Npc } from "@/game/village";
import SpriteIcon from "./SpriteIcon";
import { IconQuill } from "./icons";
import { renderText } from "./richText";
import { openStudio } from "./studioPane";

type Props = {
  npc: Npc;
  state: SideState;
  onAccept: () => void;
  onDeliver: () => void;
  onClose: () => void;
};

// The gear a side quest gives, by name: «Topplue».
export function rewardNames(state: SideState): string[] {
  return rewardGear(state.quest.reward).flatMap((key) => {
    const [part, id] = key.split(":") as [keyof FigureChoice, string];
    const label = FIGURE_OPTIONS[part]?.find((o) => o.id === id)?.label;
    return label ? [label] : [];
  });
}

// A small wish from someone in the village. Same frame as the luke dialogue,
// but its own component so the luke conversation never changes because of it.
export default function SideQuestDialogue({
  npc,
  state,
  onAccept,
  onDeliver,
  onClose,
}: Props) {
  const { quest, status } = state;
  const [page, setPage] = useState(0);
  const [hint, setHint] = useState(false);
  // Delivered in this conversation: say thanks, not «nothing for you».
  const [thanked, setThanked] = useState(status === "done");
  const pages = status === "available" ? quest.ask : [""];
  const last = page >= pages.length - 1;
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primary.current?.focus({ preventScroll: true });
  }, [page, status, thanked]);

  // Enter turns the page, as in the luke dialogue.
  useEffect(() => {
    if (last) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if ((e.target as HTMLElement)?.closest?.("button, a")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setPage((p) => p + 1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [last]);

  const found = quest.steps.filter((s) => s.kind === "find").length;
  const step = quest.steps[state.step];
  const rewards = rewardNames(state);

  const speech =
    status === "available" ? (
      renderText(pages[page])
    ) : thanked ? (
      <>
        {quest.thanks}
        {rewards.length > 0 && (
          <span className="side-reward">
            Du fikk {rewards.join(" og ")}. Trykk <kbd>C</kbd> for å ta den på.
          </span>
        )}
      </>
    ) : status === "ready" ? (
      <>Å, fikk du det til? Det var akkurat det jeg trengte.</>
    ) : (
      <>
        {renderText(quest.goal)}
        {state.result?.message && (
          <span className="side-note">{renderText(state.result.message)}</span>
        )}
        {step?.kind === "find" && found > 1 && (
          <span className="side-note">
            Funnet {state.step} av {found}.
          </span>
        )}
        {hint && quest.hint && (
          <span className="side-note">{renderText(quest.hint.text)}</span>
        )}
      </>
    );

  return (
    <section
      className="dialogue frame frame--wood"
      role="dialog"
      aria-label={`${npc.name}: ${quest.title}`}
    >
      <div className="dialogue-portrait frame frame--inset">
        <SpriteIcon sprite={npc.sprite} scale={4} />
      </div>
      <div className="dialogue-body">
        <p className="dialogue-name">
          {npc.name}{" "}
          <span className="dialogue-task">Sideoppdrag: {quest.title}</span>
          {pages.length > 1 && (
            <>
              {" "}
              <span className="dialogue-page">
                {page + 1}/{pages.length}
              </span>
            </>
          )}
        </p>
        <div className="dialogue-speech" aria-live="polite">
          {speech}
        </div>
        <div className="dialogue-actions">
          {!last ? (
            <button
              ref={primary}
              type="button"
              className="btn btn--amber"
              onClick={() => setPage((p) => p + 1)}
            >
              Fortsett <kbd>Enter</kbd>
            </button>
          ) : status === "available" ? (
            <button
              ref={primary}
              type="button"
              className="btn btn--amber"
              onClick={onAccept}
            >
              Ja, jeg hjelper
            </button>
          ) : status === "ready" && !thanked ? (
            <button
              ref={primary}
              type="button"
              className="btn btn--amber"
              onClick={() => {
                onDeliver();
                setThanked(true);
              }}
            >
              Gi det til {npc.name}
            </button>
          ) : status === "active" && quest.kind === "sanity" ? (
            <button
              ref={primary}
              type="button"
              className="btn btn--amber"
              onClick={openStudio}
            >
              <IconQuill />
              Åpne Sanity Studio
            </button>
          ) : null}
          {status === "active" && quest.hint && !hint && (
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => setHint(true)}
            >
              Hint
            </button>
          )}
          <button
            ref={
              thanked || (status === "active" && quest.kind !== "sanity")
                ? primary
                : undefined
            }
            type="button"
            className="btn btn--quiet"
            onClick={onClose}
          >
            {status === "available" && last ? "Ikke nå" : "Lukk"} <kbd>Esc</kbd>
          </button>
        </div>
      </div>
      <button
        type="button"
        className="dialogue-x"
        aria-label="Lukk"
        title="Lukk (Esc)"
        onClick={onClose}
      >
        ×
      </button>
    </section>
  );
}
