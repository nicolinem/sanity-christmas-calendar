"use client";

import { useMemo, useState } from "react";
import SpriteIcon from "@/components/hud/SpriteIcon";
import {
  ARMOURS,
  CLOTH_COLORS,
  DEFAULT_FIGURE,
  EXTRAS,
  FACIAL_HAIR,
  HAIR_COLORS,
  HAIRSTYLES,
  HATS,
  PANTS,
  SCARVES,
  SKINS,
  TOPS,
  randomFigure,
  type FigureChoice,
  type OutlineMode,
} from "@/game/figure";
import FigureCanvas from "./FigureCanvas";
import { PROGRESS_PROJECT, updateProgress } from "@/game/quests/progress";

// A workbench for the figure parts, at /figur in development. Pick parts and
// colours, compare with the Tiny Dungeon figures at the same size, and see a
// crowd of random figures. Not the real creator: that will be a custom input
// in the Studio, using the same parts and drawing code.

type PartKey =
  "hair" | "facialHair" | "top" | "armour" | "hat" | "scarf" | "extra";
type ColorKey =
  "skin" | "hairColor" | "topColor" | "pants" | "hatColor" | "scarfColor";

const PARTS: {
  key: PartKey;
  title: string;
  options: { id: string; label: string; unlock?: string }[];
}[] = [
  { key: "hair", title: "Hår", options: HAIRSTYLES },
  { key: "facialHair", title: "Skjegg og bart", options: FACIAL_HAIR },
  { key: "top", title: "Overdel", options: TOPS },
  { key: "armour", title: "Rustning", options: ARMOURS },
  { key: "hat", title: "Lue", options: HATS },
  { key: "scarf", title: "Skjerf", options: SCARVES },
  { key: "extra", title: "Ekstra", options: EXTRAS },
];

const COLORS: {
  key: ColorKey;
  title: string;
  options: { id: string; label: string; colors: readonly [string, string] }[];
}[] = [
  { key: "skin", title: "Hud", options: SKINS },
  { key: "hairColor", title: "Hårfarge", options: HAIR_COLORS },
  { key: "topColor", title: "Klesfarge", options: CLOTH_COLORS },
  { key: "pants", title: "Bukse", options: PANTS },
  { key: "hatColor", title: "Luefarge", options: CLOTH_COLORS },
  { key: "scarfColor", title: "Skjerffarge", options: CLOTH_COLORS },
];

// Our take on each Tiny Dungeon person, to compare part by part.
const TWINS: { frame: number; choice: FigureChoice }[] = [
  {
    frame: 84,
    choice: {
      ...DEFAULT_FIGURE,
      hairColor: "white",
      facialHair: "wizard",
      top: "robe",
      topColor: "purple",
      hat: "wizard",
      hatColor: "purple",
    },
  },
  { frame: 85, choice: { ...DEFAULT_FIGURE, hat: "none", topColor: "grey" } },
  {
    frame: 86,
    choice: {
      ...DEFAULT_FIGURE,
      hair: "bald",
      facialHair: "beard",
      hairColor: "brown",
      top: "apron",
      topColor: "grey",
      hat: "none",
    },
  },
  {
    frame: 87,
    choice: {
      ...DEFAULT_FIGURE,
      facialHair: "beard",
      hairColor: "white",
      topColor: "grey",
      hat: "viking",
    },
  },
  {
    frame: 88,
    choice: { ...DEFAULT_FIGURE, hair: "bun", topColor: "yellow", hat: "none" },
  },
  {
    frame: 96,
    choice: {
      ...DEFAULT_FIGURE,
      top: "sweater",
      topColor: "grey",
      armour: "plate",
      hat: "knight",
    },
  },
  {
    frame: 97,
    choice: {
      ...DEFAULT_FIGURE,
      topColor: "grey",
      armour: "plate",
      hat: "helmet",
    },
  },
  {
    frame: 99,
    choice: {
      ...DEFAULT_FIGURE,
      hair: "long",
      top: "dress",
      topColor: "purple",
      hat: "none",
    },
  },
  {
    frame: 100,
    choice: {
      ...DEFAULT_FIGURE,
      hair: "bun",
      hairColor: "white",
      topColor: "purple",
      hat: "none",
    },
  },
  {
    frame: 112,
    choice: {
      ...DEFAULT_FIGURE,
      topColor: "green",
      hat: "bandana",
      hatColor: "green",
    },
  },
];

// The Tiny Dungeon people, for comparison at the same scale.
const KENNEY = [84, 85, 86, 87, 88, 96, 97, 98, 99, 100];

// A small seeded random, so «Ny gjeng» gives a new crowd but a reload doesn't.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default function FigureLab() {
  const [choice, setChoice] = useState<FigureChoice>(DEFAULT_FIGURE);
  const [history, setHistory] = useState<FigureChoice[]>([]);
  const [outline, setOutline] = useState<OutlineMode>("kenney");
  const [seed, setSeed] = useState(7);
  const [saved, setSaved] = useState(false);
  const crowd = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: 16 }, () => randomFigure(r));
  }, [seed]);

  const set = (next: FigureChoice) => {
    setSaved(false);
    setHistory((h) => [...h.slice(-30), choice]);
    setChoice(next);
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setChoice(prev);
  };

  return (
    <main className="flab">
      <header className="flab-head">
        <h1>Figurverksted</h1>
        <p>
          Deler i Tiny Dungeon-stil, tegnet i kode (
          <code>src/game/figure.ts</code>). Bare for utvikling.
        </p>
      </header>

      <section className="flab-stage" aria-label="Figuren din">
        <div className="flab-hero">
          <FigureCanvas
            choice={choice}
            scale={12}
            outline={outline}
            label="Figuren din"
          />
          <div className="flab-actions">
            <button
              type="button"
              className="btn btn--amber"
              onClick={() => set(randomFigure())}
            >
              Tilfeldig
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                updateProgress(PROGRESS_PROJECT, (p) => ({
                  ...p,
                  figure: { ...choice },
                }));
                setSaved(true);
              }}
            >
              {saved ? "Brukes i spillet" : "Bruk i spillet"}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={undo}
              disabled={history.length === 0}
            >
              Angre
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() =>
                setOutline((o) => (o === "kenney" ? "thin" : "kenney"))
              }
              aria-pressed={outline === "thin"}
            >
              Kant: {outline === "kenney" ? "to piksler (Kenney)" : "én piksel"}
            </button>
          </div>
        </div>

        <div className="flab-compare">
          <p className="flab-label">Ved siden av Kenney (samme skala)</p>
          <div className="flab-row">
            <FigureCanvas choice={choice} scale={5} outline={outline} />
            {KENNEY.map((frame) => (
              <SpriteIcon
                key={frame}
                sprite={{ sheet: "dungeon", frame }}
                scale={5}
              />
            ))}
          </div>
          <p className="flab-label">Lagret som</p>
          <pre className="flab-json">{JSON.stringify(choice, null, 2)}</pre>
        </div>
      </section>

      <section className="flab-crowd" aria-label="Tvillinger">
        <p className="flab-label">
          Tvillinger: vår versjon av hver Kenney-figur (vår til venstre i hvert
          par)
        </p>
        <div className="flab-row flab-row--wrap">
          {TWINS.map((t) => (
            <span key={t.frame} className="flab-twin">
              <button
                type="button"
                className="flab-pick"
                onClick={() => set(t.choice)}
                aria-label={`Bruk tvillingen til figur ${t.frame}`}
              >
                <FigureCanvas choice={t.choice} scale={5} outline={outline} />
              </button>
              <SpriteIcon
                sprite={{ sheet: "dungeon", frame: t.frame }}
                scale={5}
              />
            </span>
          ))}
        </div>
      </section>

      <section className="flab-pickers" aria-label="Velg deler">
        {PARTS.map((part) => (
          <fieldset key={part.key} className="flab-group">
            <legend>{part.title}</legend>
            <div className="flab-options">
              {part.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="flab-option"
                  aria-pressed={choice[part.key] === o.id}
                  onClick={() => set({ ...choice, [part.key]: o.id })}
                >
                  <FigureCanvas
                    choice={{ ...choice, [part.key]: o.id }}
                    scale={4}
                    outline={outline}
                  />
                  <span>{o.label}</span>
                  {o.unlock && <small className="flab-lock">{o.unlock}</small>}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        {COLORS.map((group) => (
          <fieldset key={group.key} className="flab-group">
            <legend>{group.title}</legend>
            <div className="flab-swatches">
              {group.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="flab-swatch"
                  aria-pressed={choice[group.key] === o.id}
                  aria-label={`${group.title}: ${o.label}`}
                  title={o.label}
                  onClick={() => set({ ...choice, [group.key]: o.id })}
                  style={{
                    background: `linear-gradient(135deg, ${o.colors[0]} 55%, ${o.colors[1]} 55%)`,
                  }}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="flab-crowd" aria-label="Tilfeldige figurer">
        <div className="flab-crowd-head">
          <p className="flab-label">
            En tilfeldig gjeng: slik ser bygda ut med mange spillere
          </p>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => setSeed((s) => s + 1)}
          >
            Ny gjeng
          </button>
        </div>
        <div className="flab-row flab-row--wrap">
          {crowd.map((c, i) => (
            <button
              key={i}
              type="button"
              className="flab-pick"
              onClick={() => set(c)}
              aria-label="Bruk denne figuren"
            >
              <FigureCanvas choice={c} scale={5} outline={outline} />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
