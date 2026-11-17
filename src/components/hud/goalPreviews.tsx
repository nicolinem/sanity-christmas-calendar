"use client";

import type { ReactNode } from "react";
import type { Quest } from "@/game/quests/types";
import SpriteImage from "../SpriteImage";
import { KNOWN_SPRITE_IDS } from "@/game/sprites";

// "Slik blir det": a small Før / Etter picture of what a quest builds, drawn
// like the Studio so the player recognises it. For a new quest:
//   1. add `goalPreview: { before: "…", after: "…" }` (the captions) on the quest
//   2. add an entry below, keyed by the quest id, with a `before` and an `after`.
// Build the pictures from `StudioCard` and the real game pieces (SpriteImage,
// KnightPreview), so they can't drift from what the player ends up with.

const PICKS = [
  "sword",
  "wooden-sword",
  "dagger",
  "longsword",
  "greatsword",
  "axe",
  "hand-axe",
  "hammer",
  "spear",
  "staff-frost",
  "bow",
  "shield",
].filter((id) => KNOWN_SPRITE_IDS.includes(id));

function StudioCard({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
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

// Luke 2: the document list, first with names only, then with sprites.
const LEDGER = [
  { name: "Frostbit", sprite: "sword" },
  { name: "Nyhugger", sprite: "axe" },
  { name: "Isklinge", sprite: "dagger" },
];

function ListBefore() {
  return (
    <StudioCard label="Item">
      <ul className="gp-list">
        {LEDGER.map((row) => (
          <li key={row.name}>
            <span className="gp-doc-icon" />
            <span className="gp-row-title">{row.name}</span>
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}

function ListAfter() {
  return (
    <StudioCard label="Item">
      <ul className="gp-list">
        {LEDGER.map((row) => (
          <li key={row.name}>
            <span className="gp-media">
              <SpriteImage spriteId={row.sprite} kind="weapon" scale={2} />
            </span>
            <span className="gp-row-text">
              <span className="gp-row-title">{row.name}</span>
              <span className="gp-row-sub">weapon · {row.sprite}</span>
            </span>
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}

// Luke 3: a weapon without a sprite, first publishable, then stopped.
function DocumentCard({ blocked }: { blocked: boolean }) {
  return (
    <StudioCard>
      <div className="gp-doc-head">
        <span>Nytt våpen</span>
        <span className={`gp-publish${blocked ? " is-off" : ""}`}>Publish</span>
      </div>
      <dl className="gp-fields">
        <dt>Name</dt>
        <dd>Nyhugger</dd>
        <dt>Kind</dt>
        <dd>weapon</dd>
        <dt>Sprite</dt>
        <dd>
          <em>tom</em>
          {blocked && <span className="gp-error">A weapon needs a sprite</span>}
        </dd>
      </dl>
    </StudioCard>
  );
}

function BakeryCard({
  label,
  lines,
}: {
  label: string;
  lines: [string, string][];
}) {
  return (
    <StudioCard label={label}>
      <dl className="gp-fields">
        {lines.map(([field, value]) => (
          <div key={field}>
            <dt>{field}</dt>
            <dd>{value || <em>tom</em>}</dd>
          </div>
        ))}
      </dl>
    </StudioCard>
  );
}

const PREVIEWS: Record<string, { before: ReactNode; after: ReactNode }> = {
  "weapon-description": {
    before: <BakeryCard label="Våpen og tavle" lines={[["Description", ""]]} />,
    after: (
      <BakeryCard
        label="Våpen og tavle"
        lines={[["Description", "Smidd for vinterens farer."]]}
      />
    ),
  },
  "apprentice-mistake": {
    before: (
      <BakeryCard
        label="Bran sin hemmer"
        lines={[
          ["Description", "banan banan helt feil"],
          ["Sprite", "hand-axe"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Brann sin hammer"
        lines={[
          ["Description", "En solid smiehammer …"],
          ["Sprite", "hammer"],
        ]}
      />
    ),
  },
  "archive-model": {
    before: (
      <BakeryCard
        label="Arkivarens notat"
        lines={[["Alt", "21:40 – fotspor ved smia, Kari …"]]}
      />
    ),
    after: (
      <BakeryCard
        label="Observation"
        lines={[
          ["What", "Tekst"],
          ["Place", "Reference → Sted"],
          ["Status", "Liste med valg"],
        ]}
      />
    ),
  },
  "who-is-lying": {
    before: (
      <BakeryCard
        label="Observation C"
        lines={[
          ["Place", "bakriet"],
          ["Status", "Unknown"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Observation C"
        lines={[
          ["Place", "Bakeriet →"],
          ["Status", "Confirmed"],
        ]}
      />
    ),
  },
  "case-file": {
    before: (
      <BakeryCard
        label="Observasjoner"
        lines={[
          ["A", "Smia"],
          ["B", "Bakeriet"],
          ["C", "Bakeriet"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Saksmappa på torget"
        lines={[["Observations", "A →  B →  C →"]]}
      />
    ),
  },
  "branns-ledger": { before: <ListBefore />, after: <ListAfter /> },
  "the-guilds-law": {
    before: <DocumentCard blocked={false} />,
    after: <DocumentCard blocked />,
  },
  "the-drawing-board": { before: <SelectBefore />, after: <GridAfter /> },
  "baker-template": {
    before: (
      <BakeryCard
        label="Ny bestilling"
        lines={[
          ["Status", ""],
          ["Dato", ""],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Ny bestilling"
        lines={[
          ["Status", "ny"],
          ["Dato", "14. desember"],
        ]}
      />
    ),
  },
  "baker-forge": {
    before: (
      <BakeryCard
        label="Våpen"
        lines={[
          ["Forged at", ""],
          ["Handling", "Publish"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Våpen"
        lines={[
          ["Forged at", "nå"],
          ["Handling", "Smi → publisert"],
        ]}
      />
    ),
  },
  "baker-function": {
    before: (
      <BakeryCard
        label="Simulert bodskilt"
        lines={[
          ["Hendelse", "alle"],
          ["Tekst", "Bakerens bod"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Simulert bodskilt"
        lines={[
          ["Hendelse", "publisert bestilling"],
          ["Tekst", "Dagens bestilling: Julekake"],
        ]}
      />
    ),
  },
  "baker-first-order": {
    before: (
      <BakeryCard
        label="Din nye bestilling"
        lines={[
          ["Vare", ""],
          ["Status", "ny"],
          ["Dato", "14. desember"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Publisert bestilling"
        lines={[
          ["Vare", "Julekake"],
          ["Status", "ny"],
          ["Dato", "14. desember"],
        ]}
      />
    ),
  },
  "baker-sign": {
    before: <BakeryCard label="Bodskilt" lines={[["Skilttekst", ""]]} />,
    after: (
      <BakeryCard
        label="Publisert bodskilt"
        lines={[["Skilttekst", "Nystekte JULEKAKER"]]}
      />
    ),
  },
  "baker-ready": {
    before: (
      <BakeryCard
        label="Din bestilling"
        lines={[
          ["Vare", "Julekake"],
          ["Status", "ny"],
          ["Handling", "Publish"],
        ]}
      />
    ),
    after: (
      <BakeryCard
        label="Din bestilling"
        lines={[
          ["Vare", "Julekake"],
          ["Status", "klar"],
          ["Handling", "Klar → publisert"],
        ]}
      />
    ),
  },
  "baker-link": {
    before: (
      <BakeryCard label="Bodskilt" lines={[["Skilttekst", "Julekaker"]]} />
    ),
    after: (
      <BakeryCard
        label="Bodskilt"
        lines={[["Lenket ord", "Julekaker → https://…"]]}
      />
    ),
  },
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
            <span className="gp-tag gp-tag--after">Etter</span>{" "}
            {quest.goalPreview.after}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
