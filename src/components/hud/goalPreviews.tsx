"use client";

import type { ReactNode } from "react";
import type { Quest } from "@/game/quests/types";
import KnightPreview from "../KnightPreview";
import SpriteImage from "../SpriteImage";
import { KNOWN_SPRITE_IDS } from "@/game/sprites";

// "Slik blir det": a small Før / Etter picture of what a quest builds, drawn
// like the Studio so the player recognises it. For a new quest:
//   1. add `goalPreview: { before: "…", after: "…" }` (the captions) on the quest
//   2. add an entry below, keyed by the quest id, with a `before` and an `after`.
// Build the pictures from `StudioCard` and the real game pieces (SpriteImage,
// KnightPreview), so they can't drift from what the player ends up with.

const PICKS = ["sword", "wooden-sword", "dagger", "longsword", "greatsword", "axe", "hand-axe", "hammer", "spear", "staff-frost", "bow", "shield"].filter(
  (id) => KNOWN_SPRITE_IDS.includes(id),
);

function StudioCard({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="gp-card">
      {label && <div className="gp-label">{label}</div>}
      {children}
    </div>
  );
}

function SelectBefore() {
  return (
    <StudioCard label="Sprite">
      <div className="gp-select">
        <span>sword</span>
        <span className="gp-chevron" />
      </div>
      <ul className="gp-menu">
        {["wooden-sword", "sword", "dagger"].map((id) => (
          <li key={id} className={id === "sword" ? "is-on" : undefined}>
            {id}
          </li>
        ))}
        <li className="gp-more">…</li>
      </ul>
    </StudioCard>
  );
}

function GridAfter() {
  return (
    <StudioCard label="Sprite">
      <div className="gp-grid">
        {PICKS.map((id) => (
          <span key={id} className={`gp-pick${id === "sword" ? " is-on" : ""}`}>
            <SpriteImage spriteId={id} kind="weapon" scale={2} />
          </span>
        ))}
      </div>
    </StudioCard>
  );
}

function Tabs({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <div className="gp-tabs">
      {tabs.map((t) => (
        <span key={t} className={`gp-tab${t === active ? " is-on" : ""}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

function FormBefore() {
  return (
    <StudioCard>
      <Tabs tabs={["Skjema"]} active="Skjema" />
      <div className="gp-label">Name</div>
      <div className="gp-select">
        <span>Frostbit</span>
      </div>
      <div className="gp-label">Sprite</div>
      <div className="gp-select">
        <span>sword</span>
        <span className="gp-chevron" />
      </div>
    </StudioCard>
  );
}

function ViewAfter() {
  return (
    <StudioCard>
      <Tabs tabs={["Skjema", "I spillet"]} active="I spillet" />
      <div className="gp-stage">
        <KnightPreview spriteId="sword" kind="weapon" scale={3} />
        <div className="gp-stage-name">Frostbit</div>
      </div>
    </StudioCard>
  );
}

const PREVIEWS: Record<string, { before: ReactNode; after: ReactNode }> = {
  "the-drawing-board": { before: <SelectBefore />, after: <GridAfter /> },
  "the-proving-room": { before: <FormBefore />, after: <ViewAfter /> },
};

export function hasGoalPreview(quest: Quest) {
  return Boolean(quest.goalPreview && PREVIEWS[quest.id]);
}

export default function GoalPreview({ quest }: { quest: Quest }) {
  const pics = PREVIEWS[quest.id];
  if (!quest.goalPreview || !pics) return null;
  return (
    <div className="gp" role="group" aria-label="Slik blir det">
      <p className="gp-title">Slik blir det</p>
      <div className="gp-pair">
        <figure className="gp-fig">
          <div className="gp-pic">{pics.before}</div>
          <figcaption>
            <span className="gp-tag">Før</span> {quest.goalPreview.before}
          </figcaption>
        </figure>
        <figure className="gp-fig">
          <div className="gp-pic">{pics.after}</div>
          <figcaption>
            <span className="gp-tag gp-tag--after">Etter</span> {quest.goalPreview.after}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
