"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLOTH_COLORS,
  FIGURE_OPTIONS,
  HAIR_COLORS,
  PANTS,
  SKINS,
  drawFigure,
  randomFigure,
  type FigureChoice,
} from "@/game/figure";
import { gearSource, isGear, wearable, type GearKey } from "@/game/wardrobe";
import FigureCanvas from "./FigureCanvas";

// The character sheet (C): pick how your figure looks, and wear the gear you
// have earned. The figure is always on the right; each category shows its
// styles with the colour that belongs to them right underneath.

type PartKey = "hair" | "facialHair" | "top" | "hat" | "armour" | "scarf" | "extra";
type ColorKey = "skin" | "hairColor" | "topColor" | "pants" | "hatColor" | "scarfColor";
type Swatch = { id: string; label: string; colors: readonly [string, string] };
type Category = {
  id: string;
  label: string;
  part?: PartKey;
  color?: { key: ColorKey; label: string; options: Swatch[] };
};

const LOOK: Category[] = [
  { id: "skin", label: "Hud", color: { key: "skin", label: "Hudfarge", options: SKINS } },
  { id: "hair", label: "Hår", part: "hair", color: { key: "hairColor", label: "Hårfarge", options: HAIR_COLORS } },
  { id: "facial", label: "Skjegg", part: "facialHair", color: { key: "hairColor", label: "Hårfarge", options: HAIR_COLORS } },
  { id: "top", label: "Overdel", part: "top", color: { key: "topColor", label: "Farge", options: CLOTH_COLORS } },
  { id: "pants", label: "Bukse", color: { key: "pants", label: "Buksefarge", options: PANTS } },
  { id: "hat", label: "Lue", part: "hat", color: { key: "hatColor", label: "Luefarge", options: CLOTH_COLORS } },
];

const GEAR: Category[] = [
  { id: "head", label: "Hode", part: "hat", color: { key: "hatColor", label: "Farge", options: CLOTH_COLORS } },
  { id: "body", label: "Kropp", part: "armour" },
  { id: "neck", label: "Hals", part: "scarf", color: { key: "scarfColor", label: "Skjerffarge", options: CLOTH_COLORS } },
  { id: "extra", label: "Ekstra", part: "extra" },
];

const SLOTS: { part: PartKey; label: string }[] = [
  { part: "hat", label: "Hode" },
  { part: "armour", label: "Kropp" },
  { part: "scarf", label: "Hals" },
  { part: "extra", label: "Ekstra" },
];

type Option = { id: string; label: string };

// Looks hold what you choose freely; gear holds what you earn, plus "none".
function optionsFor(cat: Category, gear: boolean): Option[] {
  if (!cat.part) return [];
  const all = FIGURE_OPTIONS[cat.part] as readonly Option[];
  if (!gear) return all.filter((o) => !isGear(cat.part!, o.id));
  // Hats are both: the gear tab shows only the earned ones.
  if (cat.part === "hat") return all.filter((o) => o.id === "none" || isGear("hat", o.id));
  return [...all];
}

// Only show a colour when the chosen style actually uses it (no hair colour
// for a bald head without a beard, no hat colour for a helmet).
function usesColor(choice: FigureChoice, key: ColorKey, options: Swatch[]) {
  if (options.length < 2) return true;
  const a = drawFigure({ ...choice, [key]: options[0].id });
  const b = drawFigure({ ...choice, [key]: options[1].id });
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
}

const cleanName = (s: string) => s.replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 24);

type Props = {
  initial: FigureChoice;
  initialName: string;
  owned: Set<GearKey>;
  firstTime: boolean; // no figure yet: nothing to go back to, so no close
  initialTab: "gear" | "look";
  initialShareProfile: boolean;
  onDone: (choice: FigureChoice, name: string, shareProfile: boolean) => void;
  onClose: () => void;
};

export default function CharacterSheet({
  initial,
  initialName,
  owned,
  firstTime,
  initialTab,
  initialShareProfile,
  onDone,
  onClose,
}: Props) {
  const [choice, setChoice] = useState<FigureChoice>(() => wearable(initial, owned));
  const [name, setName] = useState(initialName);
  const [shareProfile, setShareProfile] = useState(initialShareProfile);
  const [history, setHistory] = useState<FigureChoice[]>([]);
  const [mode, setMode] = useState<"look" | "gear">(initialTab);
  const [catId, setCatId] = useState("hair");
  const doneRef = useRef<HTMLButtonElement>(null);

  const cats = mode === "look" ? LOOK : GEAR;
  const cat = cats.find((c) => c.id === catId) ?? cats[0];
  const options = useMemo(() => optionsFor(cat, mode === "gear"), [cat, mode]);
  const isOwned = (part: PartKey, id: string) => !isGear(part, id) || owned.has(`${part}:${id}`);
  const usable = options.filter((o) => isOwned(cat.part!, o.id));
  const current = cat.part ? options.find((o) => o.id === choice[cat.part!]) : undefined;
  // Gear colours belong to the gear: no hat colour while wearing a look hat.
  const showColor =
    cat.color &&
    (mode === "look" || (current && current.id !== "none")) &&
    usesColor(choice, cat.color.key, cat.color.options);

  const set = (next: FigureChoice) => {
    setHistory((h) => [...h.slice(-30), choice]);
    setChoice(next);
  };
  const step = (by: number) => {
    if (!cat.part || usable.length === 0) return;
    const at = usable.findIndex((o) => o.id === choice[cat.part!]);
    const next = usable[(at + by + usable.length) % usable.length];
    set({ ...choice, [cat.part]: next.id });
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setChoice(prev);
  };
  const done = () => onDone(choice, cleanName(name).trim(), shareProfile);

  useEffect(() => {
    doneRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input")) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if (e.key === "Escape" && !firstTime) onClose();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const switchMode = (m: "look" | "gear") => {
    setMode(m);
    setCatId(m === "look" ? "hair" : "head");
  };

  return (
    <div className="log-backdrop" onClick={firstTime ? undefined : onClose}>
      <section
        className="cs frame frame--slate"
        role="dialog"
        aria-modal="true"
        aria-label="Figuren din"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cs-head">
          <h2 className="log-title">{firstTime ? "Lag figuren din" : "Figuren din"}</h2>
          <div className="log-tabs" role="tablist">
            {(["look", "gear"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={`log-tab${mode === m ? " is-on" : ""}`}
                onClick={() => switchMode(m)}
              >
                {m === "look" ? "Utseende" : "Utstyr"}
              </button>
            ))}
          </div>
          {!firstTime && (
            <button type="button" className="cs-close" onClick={onClose}>
              <kbd>Esc</kbd> lukk
            </button>
          )}
        </header>

        <div className="cs-body">
          <nav className="cs-cats" aria-label={mode === "look" ? "Utseende" : "Utstyr"}>
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                className="cs-cat"
                aria-current={c.id === cat.id}
                onClick={() => setCatId(c.id)}
              >
                {c.label}
              </button>
            ))}
          </nav>

          <div className="cs-pick">
            {mode === "gear" && (
              <div>
                <p className="cs-label">På deg nå</p>
                <div className="cs-slots">
                  {SLOTS.map((s) => {
                    const id = choice[s.part];
                    const worn = id !== "none" && (s.part !== "hat" || isGear("hat", id));
                    const label = (FIGURE_OPTIONS[s.part] as readonly Option[]).find((o) => o.id === id)?.label;
                    return (
                      <div key={s.part} className={`cs-slot${worn ? " is-on" : ""}`}>
                        <b>{s.label}</b>
                        <span>{worn ? label : "Tom"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cat.part && current && (
              <div className="cs-stepper">
                <button type="button" className="cs-arrow" onClick={() => step(-1)} aria-label="Forrige">
                  ‹
                </button>
                <strong>{current.label}</strong>
                <button type="button" className="cs-arrow" onClick={() => step(1)} aria-label="Neste">
                  ›
                </button>
                <span>
                  {Math.max(1, usable.findIndex((o) => o.id === current.id) + 1)} av {usable.length}
                </span>
              </div>
            )}

            {cat.part && (
              <div className="cs-grid">
                {options.map((o) => {
                  const mine = isOwned(cat.part!, o.id);
                  const source = gearSource(cat.part!, o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={`cs-option${mine ? "" : " is-locked"}`}
                      aria-pressed={choice[cat.part!] === o.id}
                      disabled={!mine}
                      title={mine ? o.label : `${o.label}: ${source ?? "ikke funnet ennå"}`}
                      onClick={() => set({ ...choice, [cat.part!]: o.id })}
                    >
                      <FigureCanvas
                        // Hairstyles are hidden under most hats, so show them bare.
                        choice={{ ...choice, ...(cat.part === "hair" ? { hat: "none" } : {}), [cat.part!]: o.id }}
                        scale={4}
                      />
                      <span>{o.label}</span>
                      {!mine && <small>{source ?? "Ikke funnet ennå"}</small>}
                    </button>
                  );
                })}
              </div>
            )}

            {cat.color && showColor && (
              <div>
                <p className="cs-label">{cat.color.label}</p>
                <div className="cs-swatches">
                  {cat.color.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="cs-swatch"
                      aria-pressed={choice[cat.color!.key] === o.id}
                      aria-label={`${cat.color!.label}: ${o.label}`}
                      title={o.label}
                      onClick={() => set({ ...choice, [cat.color!.key]: o.id })}
                      style={{ background: `linear-gradient(135deg, ${o.colors[0]} 55%, ${o.colors[1]} 55%)` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {mode === "gear" && owned.size === 0 && (
              <p className="cs-hint">Utstyr finner du i bygda og får for oppgaver. Det dukker opp her.</p>
            )}
          </div>

          <aside className="cs-hero">
            <div className="cs-stage">
              <FigureCanvas choice={choice} scale={13} label="Figuren din" />
            </div>
            <label className="cs-name">
              <span className="cs-label">Navn</span>
              <input
                value={name}
                maxLength={24}
                placeholder="Hva heter du?"
                onChange={(e) => setName(cleanName(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && done()}
              />
            </label>
            <label className="cs-share">
              <input
                type="checkbox"
                checked={shareProfile}
                onChange={(e) => setShareProfile(e.target.checked)}
              />
              <span>
                <strong>Vis for andre</strong>
                <small>Navnet og figuren din vises for de andre deltakerne. Fremgangen din vises også.</small>
              </span>
            </label>
            <div className="cs-actions">
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => set(wearable({ ...randomFigure(), ...pickGear(choice) }, owned))}
              >
                Tilfeldig
              </button>
              <button type="button" className="btn btn--quiet" onClick={undo} disabled={history.length === 0}>
                Angre
              </button>
            </div>
            <button ref={doneRef} type="button" className="btn btn--amber cs-done" onClick={done}>
              Ferdig
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}

// «Tilfeldig» changes your looks, not the gear you are wearing.
function pickGear(choice: FigureChoice): Partial<FigureChoice> {
  const keep: Partial<FigureChoice> = { armour: choice.armour, scarf: choice.scarf, extra: choice.extra };
  if (isGear("hat", choice.hat)) keep.hat = choice.hat;
  return keep;
}
