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
import { PROGRESS_PROJECT, updateProgress } from "@/game/quests/progress";
import type { GameItemView } from "@/game/items";
import FigureCanvas from "./FigureCanvas";
import ItemDetails from "../hud/ItemDetails";
import SpriteIcon from "../hud/SpriteIcon";

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
  {
    id: "skin",
    label: "Hud",
    color: { key: "skin", label: "Hudfarge", options: SKINS },
  },
  {
    id: "hair",
    label: "Hår",
    part: "hair",
    color: { key: "hairColor", label: "Hårfarge", options: HAIR_COLORS },
  },
  {
    id: "facial",
    label: "Skjegg",
    part: "facialHair",
    color: { key: "hairColor", label: "Hårfarge", options: HAIR_COLORS },
  },
  {
    id: "top",
    label: "Overdel",
    part: "top",
    color: { key: "topColor", label: "Farge", options: CLOTH_COLORS },
  },
  { id: "armour", label: "Rustning", part: "armour" },
  {
    id: "pants",
    label: "Bukse",
    color: { key: "pants", label: "Buksefarge", options: PANTS },
  },
  {
    id: "hat",
    label: "Hodeplagg",
    part: "hat",
    color: { key: "hatColor", label: "Luefarge", options: CLOTH_COLORS },
  },
  {
    id: "scarf",
    label: "Hals",
    part: "scarf",
    color: { key: "scarfColor", label: "Skjerffarge", options: CLOTH_COLORS },
  },
  { id: "extra", label: "Ekstra", part: "extra" },
];

type Mode = "bag" | "look";
type InventoryFilter = "all" | "weapon" | "material" | "potion";
const INVENTORY_FILTERS: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "Alt" },
  { id: "weapon", label: "Våpen" },
  { id: "material", label: "Materialer" },
  { id: "potion", label: "Drikker" },
];

type Option = { id: string; label: string };

// Only show a colour when the chosen style actually uses it (no hair colour
// for a bald head without a beard, no hat colour for a helmet).
function usesColor(choice: FigureChoice, key: ColorKey, options: Swatch[]) {
  if (options.length < 2) return true;
  const a = drawFigure({ ...choice, [key]: options[0].id });
  const b = drawFigure({ ...choice, [key]: options[1].id });
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
}

function categoryUsesColor(
  choice: FigureChoice,
  part: PartKey | undefined,
  key: ColorKey,
  options: Swatch[],
) {
  const isolated = { ...choice };
  if (key === "hairColor") {
    if (part === "hair") isolated.facialHair = "none";
    if (part === "facialHair") isolated.hair = "bald";
  }
  if (key === "scarfColor" && part === "scarf") isolated.extra = "none";
  return usesColor(isolated, key, options);
}

const cleanName = (s: string) =>
  s.replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 24);

type Props = {
  initial: FigureChoice;
  initialName: string;
  owned: Set<GearKey>;
  firstTime: boolean; // no figure yet: nothing to go back to, so no close
  initialTab: Mode;
  initialShareProfile: boolean;
  seenGear: Record<string, true>;
  items: GameItemView[];
  equippedId: string | null;
  onEquip: (item: GameItemView) => void;
  level: number;
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
  seenGear,
  items,
  equippedId,
  onEquip,
  level,
  onDone,
  onClose,
}: Props) {
  const [choice, setChoice] = useState<FigureChoice>(() => wearable(initial, owned));
  const [name, setName] = useState(initialName);
  const [shareProfile, setShareProfile] = useState(initialShareProfile);
  const [history, setHistory] = useState<FigureChoice[]>([]);
  const [mode, setMode] = useState<Mode>(firstTime ? "look" : initialTab);
  const [catId, setCatId] = useState("skin");
  const [inventoryFilter, setInventoryFilter] =
    useState<InventoryFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const doneRef = useRef<HTMLButtonElement>(null);

  const cats = LOOK;
  const cat = cats.find((c) => c.id === catId) ?? cats[0];
  const options = useMemo(
    () => (cat.part ? (FIGURE_OPTIONS[cat.part] as readonly Option[]) : []),
    [cat],
  );
  const isOwned = (part: PartKey, id: string) =>
    !isGear(part, id) || owned.has(`${part}:${id}`);
  const usable = options.filter((o) => isOwned(cat.part!, o.id));
  const current = cat.part ? options.find((o) => o.id === choice[cat.part!]) : undefined;
  // Gear colours belong to the gear: no hat colour while wearing a look hat.
  const showColor =
    cat.color &&
    categoryUsesColor(choice, cat.part, cat.color.key, cat.color.options);
  const inventory = items.filter((item) => item.id !== "builtin-fists");
  const filteredItems = inventory.filter(
    (item) => inventoryFilter === "all" || item.kind === inventoryFilter,
  );
  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ?? null;
  const equippedItem = items.find((item) => item.id === equippedId) ?? null;
  const part = cat.part;
  const newGearKeys = useMemo(
    () =>
      part
        ? options
            .filter(
              (option) =>
                isGear(part, option.id) &&
                owned.has(`${part}:${option.id}`) &&
                !seenGear[`${part}:${option.id}`],
            )
            .map((option) => `${part}:${option.id}`)
        : [],
    [part, options, owned, seenGear],
  );

  const set = (next: FigureChoice) => {
    setHistory((h) => [...h.slice(-30), choice]);
    setChoice(next);
  };
  const step = (by: number) => {
    if (mode === "bag" || !cat.part || usable.length === 0) return;
    const at = usable.findIndex((o) => o.id === choice[cat.part!]);
    const nextIndex = at < 0 ? (by > 0 ? 0 : usable.length - 1) : at + by;
    const next = usable[(nextIndex + usable.length) % usable.length];
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
    if (mode !== "look" || newGearKeys.length === 0) return;
    const root = document.querySelector<HTMLElement>(".cs-pick");
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => (entry.target as HTMLElement).dataset.newGear)
          .filter((key): key is string => Boolean(key));
        if (visible.length === 0) return;
        updateProgress(PROGRESS_PROJECT, (progress) => {
          const next = { ...progress.seenGear };
          let changed = false;
          for (const key of visible) {
            if (!next[key]) {
              next[key] = true;
              changed = true;
            }
          }
          return changed ? { ...progress, seenGear: next } : progress;
        });
      },
      { root, threshold: 0.1 },
    );
    root
      .querySelectorAll<HTMLElement>("[data-new-gear]")
      .forEach((option) => observer.observe(option));
    return () => observer.disconnect();
  }, [mode, newGearKeys, seenGear]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !firstTime) {
        onClose();
        return;
      }
      if ((e.target as HTMLElement)?.closest?.("input")) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if (mode !== "bag" && e.key === "ArrowLeft") step(-1);
      if (mode !== "bag" && e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    setCatId("skin");
    setInventoryFilter("all");
    setSelectedItemId(null);
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
          <h2 className="log-title">
            {firstTime
              ? "Lag figuren din"
              : initialName.trim() || "Figuren din"}
          </h2>
          <div className="log-tabs" role="tablist">
            {(firstTime
              ? [{ id: "look" as const, label: "Utseende" }]
              : [
                  { id: "bag" as const, label: "Ting" },
                  { id: "look" as const, label: "Utseende" },
                ]
            ).map(({ id: m, label }) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={`log-tab${mode === m ? " is-on" : ""}`}
                onClick={() => switchMode(m)}
              >
                {label}
              </button>
            ))}
          </div>
          {!firstTime && (
            <button
              ref={mode === "bag" ? doneRef : undefined}
              type="button"
              className="cs-close"
              onClick={onClose}
            >
              <kbd>Esc</kbd> lukk
            </button>
          )}
        </header>

        <div className="cs-body">
          <nav className="cs-cats" aria-label={mode === "bag" ? "Ting" : "Utseende"}>
            {mode === "bag"
              ? INVENTORY_FILTERS.map(({ id, label }) => {
                  const count =
                    id === "all"
                      ? inventory.length
                      : inventory.filter((item) => item.kind === id).length;
                  return (
                    <button
                      key={id}
                      type="button"
                      className="cs-cat"
                      aria-current={inventoryFilter === id}
                      onClick={() => setInventoryFilter(id)}
                    >
                      <span>{label}</span>
                      <span className="cs-cat-count">{count}</span>
                    </button>
                  );
                })
              : cats.map((c) => {
                    const part = c.part;
                    const hasNew = part
                      ? (FIGURE_OPTIONS[part] as readonly Option[]).some(
                        (option) =>
                            isGear(part, option.id) &&
                            owned.has(`${part}:${option.id}`) &&
                            !seenGear[`${part}:${option.id}`],
                      )
                    : false;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="cs-cat"
                      aria-current={c.id === cat.id}
                      onClick={() => setCatId(c.id)}
                    >
                      <span>{c.label}</span>
                      {hasNew && <span className="cs-new-badge">Ny</span>}
                    </button>
                  );
                })}
          </nav>

          <div className="cs-pick">
            {mode === "bag" &&
              (inventory.length === 0 ? (
                <p className="cs-empty">
                  Du har ingen ting ennå. Det du smir i Sanity havner her.
                </p>
              ) : (
                <>
                  <div className="cs-inv" role="group" aria-label="Ting">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`slot cs-inv-item${item.id === selectedItemId ? " is-selected" : ""}${item.id === equippedId ? " is-equipped" : ""}`}
                        aria-label={item.name}
                        aria-pressed={item.id === selectedItemId}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <SpriteIcon sprite={item.sprite} />
                        {item.source === "sanity" && <span className="slot-mark" />}
                        {item.spriteId &&
                          (!item.knownSprite || !item.spriteMatchesKind) && (
                            <span className="slot-fallback" />
                          )}
                      </button>
                    ))}
                    {Array.from(
                      { length: Math.max(0, 18 - filteredItems.length) },
                      (_, index) => (
                        <span
                          key={`empty-${index}`}
                          className="cs-inv-empty"
                          aria-hidden="true"
                        />
                      ),
                    )}
                  </div>
                  {selectedItem && (
                    <div className="cs-item-detail">
                      <ItemDetails
                        item={selectedItem}
                        equipped={selectedItem.id === equippedId}
                      />
                      {selectedItem.kind === "weapon" && (
                        <button
                          type="button"
                          className="btn btn--amber cs-equip"
                          disabled={selectedItem.id === equippedId}
                          onClick={() => onEquip(selectedItem)}
                        >
                          {selectedItem.id === equippedId ? "I hånda" : "Ta i hånda"}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ))}
            {mode !== "bag" && <>
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
                      data-new-gear={newGearKeys.includes(`${cat.part}:${o.id}`) ? `${cat.part}:${o.id}` : undefined}
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
                      {newGearKeys.includes(`${cat.part}:${o.id}`) && (
                        <span className="cs-new-badge">Ny</span>
                      )}
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

            </>}
          </div>

          <aside className={`cs-hero cs-hero--${mode}`}>
            <div className="cs-stage">
              <FigureCanvas
                choice={choice}
                scale={mode === "look" ? 13 : 10}
                label="Figuren din"
              />
            </div>
            {mode === "look" ? (
              <>
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
                    <small>
                      Navnet og figuren din vises for de andre deltakerne.
                      Fremgangen din vises også.
                    </small>
                  </span>
                </label>
                <div className="cs-actions">
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={() =>
                      set(
                        wearable(
                          { ...randomFigure(), ...pickGear(choice) },
                          owned,
                        ),
                      )
                    }
                  >
                    Tilfeldig
                  </button>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={undo}
                    disabled={history.length === 0}
                  >
                    Angre
                  </button>
                </div>
                <button
                  ref={doneRef}
                  type="button"
                  className="btn btn--amber cs-done"
                  onClick={done}
                >
                  Ferdig
                </button>
              </>
            ) : (
              <div className="cs-hero-meta">
                <strong>{initialName.trim() || "Figuren din"}</strong>
                <span>Nivå {level}</span>
                {mode === "bag" && (
                  <span className="cs-hand">
                    I hånda: {equippedItem?.name ?? ""}
                  </span>
                )}
              </div>
            )}
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
