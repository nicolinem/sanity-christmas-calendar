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

// --- Teknisk løype: luke 1, uke 2 og uke 3 ---------------------------------

// Luke 1: the forge's list in Studio, empty after the storm.
function EmptyList() {
  return (
    <StudioCard label="Item">
      <p className="gp-empty">Ingen dokumenter ennå</p>
    </StudioCard>
  );
}

// Rows with a time and a status, as a query result or a list in Studio.
function TimedList({
  label,
  rows,
}: {
  label: string;
  rows: { time?: string; text: string; status?: string; tone?: "ok" | "bad" }[];
}) {
  return (
    <StudioCard label={label}>
      <ul className="gp-list">
        {rows.map((row) => (
          <li key={row.text}>
            {row.time && <span className="gp-chip">{row.time}</span>}
            <span className="gp-row-title">{row.text}</span>
            {row.status && (
              <span className={`gp-badge${row.tone ? ` is-${row.tone}` : ""}`}>
                {row.status}
              </span>
            )}
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}

// The Studio's left pane: one row per list.
function StructurePane({ items }: { items: [string, boolean?][] }) {
  return (
    <StudioCard label="Content">
      <ul className="gp-list gp-structure">
        {items.map(([name, isNew]) => (
          <li key={name} className={isNew ? "is-new" : undefined}>
            <span className="gp-row-title">{name}</span>
            <span className="gp-chevron gp-chevron--right" />
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}

// Luke 6, after: the new lists, and «Per sted» › Bakeriet opened beside them.
function StructureOpen() {
  return (
    <div className="gp-panes">
      <StudioCard label="Content">
        <ul className="gp-list gp-structure">
          <li className="is-new">
            <span className="gp-row-title">Bare bekreftede</span>
          </li>
          <li className="is-new is-open">
            <span className="gp-row-title">Per sted</span>
          </li>
          <li>
            <span className="gp-row-title">Item</span>
          </li>
        </ul>
      </StudioCard>
      <StudioCard label="Per sted › Bakeriet">
        <ul className="gp-list">
          <li>
            <span className="gp-chip">19:05</span>
            <span className="gp-row-title">Kaker forsvant</span>
          </li>
          <li>
            <span className="gp-chip">19:10</span>
            <span className="gp-row-title">Iskaldt etterpå</span>
          </li>
        </ul>
      </StudioCard>
    </div>
  );
}

// A place document with its tabs (luke 7): the form, or the new view.
function PlaceDoc({ view }: { view: boolean }) {
  return (
    <StudioCard>
      <div className="gp-doc-head">
        <span>Bakeriet</span>
      </div>
      <div className="gp-tabs">
        <span className={view ? undefined : "is-on"}>Editor</span>
        {view && <span className="is-on">Observasjoner her</span>}
      </div>
      {/* What was seen stays hidden: finding it out is the end of uke 2. */}
      {view ? (
        <ul className="gp-list">
          <li>
            <span className="gp-chip">19:05</span>
            <span className="gp-row-title">?</span>
          </li>
          <li>
            <span className="gp-chip">19:10</span>
            <span className="gp-row-title">?</span>
          </li>
        </ul>
      ) : (
        <dl className="gp-fields">
          <dt>Name</dt>
          <dd>Bakeriet</dd>
          <dt>x, y</dt>
          <dd>61, 24</dd>
        </dl>
      )}
    </StudioCard>
  );
}

// A weapon with its action buttons (luke 10): Publish only, or Smi too.
function ForgeDoc({ smi }: { smi: boolean }) {
  return (
    <StudioCard>
      <div className="gp-doc-head">
        <span className="gp-doc-name">
          <SpriteImage spriteId="longsword" kind="weapon" scale={1} />
          Nytt sverd
        </span>
        <span className="gp-actions">
          {smi && <span className="gp-publish">Smi</span>}
          <span className={`gp-publish${smi ? " is-off" : ""}`}>Publish</span>
        </span>
      </div>
      <dl className="gp-fields">
        <dt>Forged at</dt>
        <dd>{smi ? "i dag 10:42" : <em>tom</em>}</dd>
      </dl>
    </StudioCard>
  );
}

// --- Ikke-teknisk løype: the real things the player changes ---------------

// The forge board (luke 2): a parchment sign with the weapon and a sentence.
function ForgeBoard({ text }: { text?: string }) {
  return (
    <div className="gp-board">
      <SpriteImage spriteId="sword" kind="weapon" scale={2} />
      <span>
        <strong>Frostbit</strong>
        {text ?? <em>Ingen beskrivelse ennå.</em>}
      </span>
    </div>
  );
}

// A Studio document row with its sprite, as in the document list.
function ItemRow({
  name,
  sprite,
  sub,
  wrong,
}: {
  name: string;
  sprite: string;
  sub: string;
  wrong?: boolean;
}) {
  return (
    <StudioCard label="Item">
      <ul className="gp-list">
        <li>
          <span className="gp-media">
            <SpriteImage spriteId={sprite} kind="weapon" scale={2} />
          </span>
          <span className="gp-row-text">
            <span className="gp-row-title">{name}</span>
            <span className={`gp-row-sub${wrong ? " is-wrong" : ""}`}>
              {sub}
            </span>
          </span>
        </li>
      </ul>
    </StudioCard>
  );
}

// A handwritten note (Arkivaren's lapp).
function Note({ children }: { children: ReactNode }) {
  return <div className="gp-note">{children}</div>;
}

// A Studio form: field name, value and the field type as a small chip.
function TypedForm({ rows }: { rows: [string, string, string][] }) {
  return (
    <StudioCard label="Observation">
      <dl className="gp-fields">
        {rows.map(([field, value, type]) => (
          <div key={field} className="gp-typed">
            <dt>{field}</dt>
            <dd>
              {value}
              <span className="gp-chip">{type}</span>
            </dd>
          </div>
        ))}
      </dl>
    </StudioCard>
  );
}

// «Per sted»: the observations listed under one place, each with its status.
function PlaceList({
  rows,
}: {
  rows: { what: string; status: string; tone?: "ok" | "off" }[];
}) {
  return (
    <StudioCard label="Per sted › Bakeriet">
      <ul className="gp-list">
        {rows.map((row) => (
          <li key={row.what}>
            <span className="gp-row-title">{row.what}</span>
            <span className={`gp-badge${row.tone ? ` is-${row.tone}` : ""}`}>
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}

// The noticeboard on the square (luke 6).
function Noticeboard({ children }: { children: ReactNode }) {
  return <div className="gp-noticeboard">{children}</div>;
}

// A bakery order in Studio, with its Publish button and any error.
function OrderForm({
  item,
  date,
  status,
  blocked,
}: {
  item?: string;
  date?: string;
  status?: string;
  blocked?: boolean;
}) {
  const value = (v?: string) => v || <em>tom</em>;
  return (
    <StudioCard>
      <div className="gp-doc-head">
        <span>Bestilling</span>
        <span className={`gp-publish${blocked ? " is-off" : ""}`}>Publish</span>
      </div>
      <dl className="gp-fields">
        <dt>Vare{blocked !== undefined && " *"}</dt>
        <dd>
          {value(item)}
          {blocked && <span className="gp-error">Varen må fylles ut</span>}
        </dd>
        <dt>Dato{blocked !== undefined && " *"}</dt>
        <dd>{value(date)}</dd>
        <dt>Status{blocked !== undefined && " *"}</dt>
        <dd>{value(status)}</dd>
      </dl>
    </StudioCard>
  );
}

// The stall sign and the short app version of the same Portable Text.
// The sign shows both paragraphs; the app has room for the first only.
function SignPair({ word }: { word?: string }) {
  const first = word ? (
    <>
      Nystekte <strong>{word}</strong> i dag
    </>
  ) : (
    <em>tomt skilt</em>
  );
  return (
    <div className="gp-signs">
      <div className="gp-sign">
        {first}
        {word && <br />}
        {word && "Åpent til fire."}
      </div>
      <div className="gp-app">{first}</div>
    </div>
  );
}

// The four orders on the morning of the market, with the Klar state.
function RushList({ ready }: { ready: boolean }) {
  const rows: [string, string][] = [
    ["Brann", "venter"],
    ["Arkivaren", "mangler dato"],
    ["Kari", "mangler vare"],
    ["Din", "ny"],
  ];
  return (
    <StudioCard label="Bestillinger">
      <ul className="gp-list">
        {rows.map(([who, state]) => (
          <li key={who}>
            <span className="gp-row-title">{who}</span>
            <span
              className={`gp-badge ${
                ready ? "is-ok" : state.startsWith("mangler") ? "is-bad" : ""
              }`}
            >
              {ready ? "klar" : state}
            </span>
          </li>
        ))}
      </ul>
    </StudioCard>
  );
}

const PREVIEWS: Record<string, { before: ReactNode; after: ReactNode }> = {
  "the-broken-forge": {
    before: <EmptyList />,
    after: <ItemRow name="Frostbit" sprite="sword" sub="weapon · publisert" />,
  },
  "follow-the-trail": {
    before: (
      <TimedList
        label="Alle observasjoner"
        rows={[
          { time: "19:40", text: "Torget · skygge ved treet", status: "rumor" },
          { time: "18:10", text: "Skogkanten · fotspor", status: "confirmed" },
          { text: "Torget · troll, sies det", status: "rumor" },
        ]}
      />
    ),
    after: (
      <TimedList
        label="Svaret ditt"
        rows={[
          { time: "18:10", text: "Skogkanten" },
          { time: "18:32", text: "Gjerdet" },
          { time: "18:45", text: "Smia" },
          { time: "19:05", text: "Bakeriet" },
        ]}
      />
    ),
  },
  "archive-lists": {
    before: (
      <StructurePane
        items={[["Item"], ["Observation"], ["Place"], ["Witness"]]}
      />
    ),
    after: <StructureOpen />,
  },
  "who-points-here": {
    before: <PlaceDoc view={false} />,
    after: <PlaceDoc view />,
  },
  "archive-questions": {
    before: (
      <Noticeboard>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="gp-slip">
            {n} ?
          </span>
        ))}
      </Noticeboard>
    ),
    after: (
      <Noticeboard>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="gp-slip">
            {n} ✓
          </span>
        ))}
      </Noticeboard>
    ),
  },
  "weapon-description": {
    before: <ForgeBoard />,
    after: <ForgeBoard text="Smidd for vinterens farer." />,
  },
  "apprentice-mistake": {
    before: (
      <ItemRow
        name="Bran sin hemmer"
        sprite="hand-axe"
        sub="banan banan helt feil"
        wrong
      />
    ),
    after: (
      <ItemRow
        name="Brann sin hammer"
        sprite="hammer"
        sub="En solid smiehammer …"
      />
    ),
  },
  "archive-model": {
    before: (
      <Note>
        18:45 – fotspor i snøen ved smia, tror jeg. Kari så det selv, tok bilde.
        Ikke sjekket.
      </Note>
    ),
    // The shape of the result, not the answer: the types are the task.
    after: (
      <TypedForm
        rows={[
          ["What", "fotspor i snøen", "?"],
          ["Place", "ved smia", "?"],
          ["Witness", "Kari", "?"],
          ["Seen", "så det selv", "?"],
          ["Picture", "bilde", "?"],
          ["Status", "Ikke sjekket", "?"],
        ]}
      />
    ),
  },
  "who-is-lying": {
    before: (
      <PlaceList rows={[{ what: "B · Melsekken revnet", status: "Unknown" }]} />
    ),
    after: (
      <PlaceList
        rows={[
          { what: "B · Melsekken revnet", status: "?" },
          { what: "C · Melsekken revnet", status: "?" },
        ]}
      />
    ),
  },
  "case-file": {
    before: (
      <Noticeboard>
        <span className="gp-slip">A</span>
        <span className="gp-slip gp-slip--tilt">D?</span>
        <span className="gp-slip">C</span>
        <span className="gp-slip gp-slip--tilt">E?</span>
      </Noticeboard>
    ),
    after: (
      <Noticeboard>
        <span className="gp-folder">
          <strong>Saksmappa</strong>
          <span>1 · ?</span>
          <span>2 · ?</span>
          <span>3 · ?</span>
        </span>
      </Noticeboard>
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
      <TimedList
        label="Ny …"
        rows={[{ text: "Bestilling", status: "tomme felt" }]}
      />
    ),
    after: (
      <TimedList
        label="Ny …"
        rows={[
          { text: "Bestilling" },
          { text: "Bestilling fra Brann", status: "Lussekatter", tone: "ok" },
          {
            text: "Bestilling fra Arkivaren",
            status: "Pepperkaker",
            tone: "ok",
          },
          { text: "Bestilling fra Kari", status: "Julekake", tone: "ok" },
        ]}
      />
    ),
  },
  "baker-model": {
    before: <OrderForm />,
    after: <OrderForm item="?" date="?" status="?" />,
  },
  "baker-forge": {
    before: <ForgeDoc smi={false} />,
    after: <ForgeDoc smi />,
  },
  "baker-function": {
    before: (
      <TimedList
        label="Bodskiltet"
        rows={[
          { text: "Bestilling publisert", status: "skrevet", tone: "ok" },
          {
            text: "Samme bestilling igjen",
            status: "skrevet igjen",
            tone: "bad",
          },
          { text: "Bestilling uten vare", status: "skrevet feil", tone: "bad" },
        ]}
      />
    ),
    after: (
      <TimedList
        label="Bodskiltet"
        rows={[
          { text: "Bestilling publisert", status: "skrevet", tone: "ok" },
          { text: "Samme bestilling igjen", status: "hoppet over" },
          { text: "Bestilling uten vare", status: "hoppet over" },
        ]}
      />
    ),
  },
  "baker-sign": {
    before: <SignPair />,
    after: <SignPair word="kanelboller" />,
  },
  "morning-rush": {
    before: <RushList ready={false} />,
    after: <RushList ready />,
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
