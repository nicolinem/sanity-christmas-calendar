"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FEATURES } from "@/game/features";
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
import { HIDDEN_GEAR } from "@/game/figure";
import { MATERIALS, type MaterialId } from "@/game/materials";
import {
  ingredientLine,
  missingText,
  recipeStates,
  type Forging,
} from "@/game/forge";
import { RECIPES } from "@/game/recipes";
import {
  gearSource,
  isGear,
  visibleGearSource,
  wearable,
  type GearKey,
} from "@/game/wardrobe";
import {
  EMPTY_PROGRESS,
  PROGRESS_PROJECT,
  updateProgress,
} from "@/game/quests/progress";
import type { GameItemView } from "@/game/items";
import FigureCanvas from "./FigureCanvas";
import {
  ABOUT_LIMITS,
  aboutProgress,
  cleanAboutText,
  normalizeAbout,
  type About,
  type AboutField,
} from "@/game/about";
import ItemDetails from "../hud/ItemDetails";
import SpriteIcon from "../hud/SpriteIcon";

// The character sheet (C): pick how your figure looks, and wear the gear you
// have earned. The figure is always on the right; each category shows its
// styles with the colour that belongs to them right underneath.

type PartKey =
  "hair" | "facialHair" | "top" | "hat" | "armour" | "scarf" | "extra";
type ColorKey =
  | "skin"
  | "hairColor"
  | "beardColor"
  | "topColor"
  | "pants"
  | "hatColor"
  | "scarfColor"
  | "extraColor";
type Swatch = { id: string; label: string; colors: readonly [string, string] };
type ColorSpec = { key: ColorKey; label: string; options: Swatch[] };
// A tab shows one or more sections: a part's styles, a colour, or both.
type Section = { part?: PartKey; heading?: string; color?: ColorSpec };
type Category = { id: string; label: string; sections: Section[] };

const LOOK: Category[] = [
  // Skin, hair and facial hair together, so the first tab is more than a
  // row of skin colours. Facial hair has its own colour.
  {
    id: "head",
    label: "Hode",
    sections: [
      { color: { key: "skin", label: "Hudfarge", options: SKINS } },
      {
        part: "hair",
        heading: "Hår",
        color: { key: "hairColor", label: "Hårfarge", options: HAIR_COLORS },
      },
      {
        part: "facialHair",
        heading: "Ansiktshår",
        color: {
          key: "beardColor",
          label: "Farge på ansiktshår",
          options: HAIR_COLORS,
        },
      },
    ],
  },
  {
    id: "top",
    label: "Overdel",
    sections: [
      {
        part: "top",
        color: { key: "topColor", label: "Farge", options: CLOTH_COLORS },
      },
    ],
  },
  { id: "armour", label: "Rustning", sections: [{ part: "armour" }] },
  {
    id: "pants",
    label: "Bukse",
    sections: [
      { color: { key: "pants", label: "Buksefarge", options: PANTS } },
    ],
  },
  {
    id: "hat",
    label: "Hodeplagg",
    sections: [
      {
        part: "hat",
        color: { key: "hatColor", label: "Luefarge", options: CLOTH_COLORS },
      },
    ],
  },
  {
    id: "scarf",
    label: "Hals",
    sections: [
      {
        part: "scarf",
        color: {
          key: "scarfColor",
          label: "Skjerffarge",
          options: CLOTH_COLORS,
        },
      },
    ],
  },
  {
    id: "extra",
    label: "Ekstra",
    sections: [
      {
        part: "extra",
        color: { key: "extraColor", label: "Farge", options: CLOTH_COLORS },
      },
    ],
  },
];

type Mode = "bag" | "look" | "about";
type InventoryFilter = "all" | "weapon" | "material" | "potion";
const INVENTORY_FILTERS: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "Alt" },
  { id: "weapon", label: "Våpen" },
  { id: "material", label: "Materialer" },
  { id: "potion", label: "Drikker" },
];

type Option = { id: string; label: string };

// Only show a colour when the chosen style actually uses it (no hair colour
// for a bald head without facial hair, no hat colour for a helmet).
function usesColor(choice: FigureChoice, key: ColorKey, options: Swatch[]) {
  if (options.length < 2) return true;
  const a = drawFigure({ ...choice, [key]: options[0].id });
  const b = drawFigure({ ...choice, [key]: options[1].id });
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
}

const cleanName = (s: string) =>
  s.replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 24);

type Props = {
  initial: FigureChoice;
  initialName: string;
  owned: Set<GearKey>;
  firstTime: boolean; // no figure yet: nothing to go back to, so no close
  locked?: boolean; // must be finished (Om meg missing while sharing): no close
  initialAbout: About | null;
  initialTab: Mode;
  initialShareProfile: boolean;
  initialShareHints: boolean;
  seenGear: Record<string, true>;
  items: GameItemView[];
  equippedId: string | null;
  onEquip: (item: GameItemView) => void;
  level: number;
  inventory: Record<string, number>;
  forgings: Forging[];
  chests: Record<string, true>;
  crafted: Record<string, string>;
  onDone: (
    choice: FigureChoice,
    name: string,
    shareProfile: boolean,
    shareHints: boolean,
    about: About,
  ) => void;
  onClose: () => void;
};

export default function CharacterSheet({
  initial,
  initialName,
  owned,
  firstTime,
  locked = false,
  initialAbout,
  initialTab,
  initialShareProfile,
  initialShareHints,
  seenGear,
  items,
  equippedId,
  onEquip,
  level,
  inventory: materials,
  forgings,
  chests,
  crafted,
  onDone,
  onClose,
}: Props) {
  const [choice, setChoice] = useState<FigureChoice>(() =>
    wearable(initial, owned),
  );
  const [name, setName] = useState(initialName);
  const [shareProfile, setShareProfile] = useState(initialShareProfile);
  const [shareHints, setShareHints] = useState(initialShareHints);
  const [about, setAbout] = useState<About>(
    () => initialAbout ?? { food: "", activity: "", topics: [] },
  );
  const [topicDraft, setTopicDraft] = useState("");
  const foodRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);
  const sayingRef = useRef<HTMLInputElement>(null);
  const closable = !firstTime && !locked;
  const [history, setHistory] = useState<FigureChoice[]>([]);
  const [mode, setMode] = useState<Mode>(firstTime ? "look" : initialTab);
  const [catId, setCatId] = useState("head");
  const [inventoryFilter, setInventoryFilter] =
    useState<InventoryFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const doneRef = useRef<HTMLButtonElement>(null);

  const cats = LOOK;
  const cat = cats.find((c) => c.id === catId) ?? cats[0];
  const catParts = cat.sections.flatMap((s) => (s.part ? [s.part] : []));
  // The arrows (and ‹ ›) step through a tab's styles when it has one part.
  const stepPart = catParts.length === 1 ? catParts[0] : undefined;
  const optionsOf = (part: PartKey) =>
    FIGURE_OPTIONS[part] as readonly Option[];
  const isOwned = (part: PartKey, id: string) =>
    !isGear(part, id) || owned.has(`${part}:${id}`);
  const usable = stepPart
    ? optionsOf(stepPart).filter((o) => isOwned(stepPart, o.id))
    : [];
  const current = stepPart
    ? optionsOf(stepPart).find((o) => o.id === choice[stepPart])
    : undefined;
  const inventory = items.filter((item) => item.id !== "builtin-fists");
  const forgeRows = FEATURES.cave
    ? recipeStates(
        { ...EMPTY_PROGRESS, chests, crafted, inventory: materials },
        forgings,
      )
    : [];
  const found = (Object.keys(MATERIALS) as MaterialId[]).filter(
    (id) => (materials[id] ?? 0) > 0,
  );
  const filteredItems = inventory.filter(
    (item) => inventoryFilter === "all" || item.kind === inventoryFilter,
  );
  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ?? null;
  const equippedItem = items.find((item) => item.id === equippedId) ?? null;
  const newGearKeys = useMemo(
    () =>
      cat.sections.flatMap(({ part }) =>
        part
          ? (FIGURE_OPTIONS[part] as readonly Option[])
              .filter(
                (option) =>
                  isGear(part, option.id) &&
                  owned.has(`${part}:${option.id}`) &&
                  !seenGear[`${part}:${option.id}`],
              )
              .map((option) => `${part}:${option.id}`)
          : [],
      ),
    [cat, owned, seenGear],
  );

  const set = (next: FigureChoice) => {
    setHistory((h) => [...h.slice(-30), choice]);
    setChoice(next);
  };
  const step = (by: number) => {
    if (mode === "bag" || !stepPart || usable.length === 0) return;
    const at = usable.findIndex((o) => o.id === choice[stepPart]);
    const nextIndex = at < 0 ? (by > 0 ? 0 : usable.length - 1) : at + by;
    const next = usable[(nextIndex + usable.length) % usable.length];
    set({ ...choice, [stepPart]: next.id });
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setChoice(prev);
  };
  // Om meg as it would be saved: a topic still in the box counts too, so
  // pressing Ferdig without Enter doesn't lose it.
  const aboutNow = normalizeAbout({
    ...about,
    topics: [...about.topics, topicDraft],
  })!;
  const aboutState = aboutProgress(aboutNow, shareProfile);
  const focusField = (field: AboutField | "saying") =>
    window.requestAnimationFrame(() => {
      const refs = {
        food: foodRef,
        activity: activityRef,
        topics: topicRef,
        saying: sayingRef,
      };
      refs[field].current?.focus();
    });
  const done = () => {
    if (!aboutState.complete) {
      setMode("about");
      if (aboutState.firstMissing) focusField(aboutState.firstMissing);
      return;
    }
    onDone(choice, cleanName(name).trim(), shareProfile, shareHints, aboutNow);
  };
  const addTopic = () => {
    const next = normalizeAbout({
      ...about,
      topics: [...about.topics, topicDraft],
    })!;
    setAbout((a) => ({ ...a, topics: next.topics }));
    setTopicDraft("");
  };

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
      if (e.key === "Escape" && closable) {
        onClose();
        return;
      }
      if ((e.target as HTMLElement)?.closest?.("input")) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if (mode === "look" && e.key === "ArrowLeft") step(-1);
      if (mode === "look" && e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    setCatId("head");
    setInventoryFilter("all");
    setSelectedItemId(null);
  };

  const renderGrid = (part: PartKey) => (
    <div className="cs-grid">
      {optionsOf(part).map((o) => {
        const mine = isOwned(part, o.id);
        const source = visibleGearSource(gearSource(part, o.id), FEATURES.cave);
        // Not found yet: a blurred shape, no name to give it away.
        const hidden = !mine && source === HIDDEN_GEAR;
        const key = `${part}:${o.id}`;
        return (
          <button
            key={o.id}
            type="button"
            className={`cs-option${mine ? "" : " is-locked"}${hidden ? " is-hidden" : ""}`}
            data-new-gear={newGearKeys.includes(key) ? key : undefined}
            aria-pressed={choice[part] === o.id}
            disabled={!mine}
            title={
              mine
                ? o.label
                : hidden
                  ? HIDDEN_GEAR
                  : `${o.label}: ${source ?? "ikke funnet ennå"}`
            }
            aria-label={hidden ? HIDDEN_GEAR : undefined}
            onClick={() => set({ ...choice, [part]: o.id })}
          >
            <FigureCanvas
              // Hair is hidden under most hats, so show it bare.
              choice={{
                ...choice,
                ...(part === "hair" || part === "facialHair"
                  ? { hat: "none" }
                  : {}),
                [part]: o.id,
              }}
              scale={4}
            />
            <span>{hidden ? "?" : o.label}</span>
            {newGearKeys.includes(key) && (
              <span className="cs-new-badge">Ny</span>
            )}
            {!mine && <small>{source ?? "Ikke funnet ennå"}</small>}
          </button>
        );
      })}
    </div>
  );

  const renderSwatches = (color: ColorSpec) => (
    <div>
      <p className="cs-label">{color.label}</p>
      <div className="cs-swatches">
        {color.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="cs-swatch"
            aria-pressed={choice[color.key] === o.id}
            aria-label={`${color.label}: ${o.label}`}
            title={o.label}
            onClick={() => set({ ...choice, [color.key]: o.id })}
            style={{
              background: `linear-gradient(135deg, ${o.colors[0]} 55%, ${o.colors[1]} 55%)`,
            }}
          />
        ))}
      </div>
    </div>
  );

  const doneButton = (
    <>
      <p className="cs-missing" role="status">
        {aboutState.message}
      </p>
      <button
        ref={doneRef}
        type="button"
        className="btn btn--amber cs-done"
        aria-disabled={!aboutState.complete}
        onClick={done}
      >
        Ferdig
      </button>
    </>
  );

  return (
    <div className="log-backdrop" onClick={closable ? onClose : undefined}>
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
            {[
              ...(firstTime ? [] : [{ id: "bag" as const, label: "Ting" }]),
              { id: "look" as const, label: "Utseende" },
              {
                id: "about" as const,
                label: aboutState.complete
                  ? "Om meg"
                  : `Om meg ${aboutState.done}/${aboutState.total}`,
              },
            ].map(({ id: m, label }) => (
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
          {closable && (
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
          <nav
            className="cs-cats"
            aria-label={
              mode === "bag" ? "Ting" : mode === "about" ? "Om meg" : "Utseende"
            }
          >
            {mode === "about"
              ? ABOUT_NAV.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className="cs-cat"
                    onClick={() => focusField(id)}
                  >
                    <span>{label}</span>
                  </button>
                ))
              : mode === "bag"
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
                    const hasNew = c.sections.some(
                      ({ part }) =>
                        part &&
                        (FIGURE_OPTIONS[part] as readonly Option[]).some(
                          (option) =>
                            isGear(part, option.id) &&
                            owned.has(`${part}:${option.id}`) &&
                            !seenGear[`${part}:${option.id}`],
                        ),
                    );
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
                        {item.source === "sanity" && (
                          <span className="slot-mark" />
                        )}
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
                          {selectedItem.id === equippedId
                            ? "I hånda"
                            : "Ta i hånda"}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ))}
            {mode === "bag" && FEATURES.cave && forgeRows.length > 0 && (
              <div className="cs-found cs-forge">
                <p className="cs-found-title">Smia</p>
                <ul>
                  {forgeRows.map((row) => (
                    <li
                      key={row.id}
                      className={row.state === "missing" ? "is-missing" : ""}
                    >
                      <span>
                        {RECIPES[row.id].name}
                        <small>{ingredientLine(materials, row.id)}</small>
                        <small>
                          {row.state === "done"
                            ? "Smidd"
                            : row.state === "missing"
                              ? missingText(row.missing)
                              : "Lag en Smiing i Studio"}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mode === "bag" && found.length > 0 && (
              <div className="cs-found">
                <p className="cs-found-title">Fra grotta</p>
                <ul>
                  {found.map((id) => (
                    <li key={id}>
                      <SpriteIcon sprite={MATERIALS[id].sprite} />
                      <span>{MATERIALS[id].name}</span>
                      <span>× {materials[id]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mode === "about" && (
              <div className="cs-about">
                <label className="cs-name">
                  <span className="cs-label">Favorittmat</span>
                  <input
                    ref={foodRef}
                    value={about.food}
                    placeholder="pepperkaker"
                    onChange={(e) =>
                      setAbout((a) => ({
                        ...a,
                        food: cleanAboutText(e.target.value, ABOUT_LIMITS.text),
                      }))
                    }
                  />
                </label>
                <label className="cs-name">
                  <span className="cs-label">Liker å gjøre</span>
                  <input
                    ref={activityRef}
                    value={about.activity}
                    placeholder="gå på ski"
                    onChange={(e) =>
                      setAbout((a) => ({
                        ...a,
                        activity: cleanAboutText(
                          e.target.value,
                          ABOUT_LIMITS.text,
                        ),
                      }))
                    }
                  />
                </label>
                <div className="cs-name">
                  <label className="cs-label" htmlFor="cs-topic">
                    Ting jeg prater om
                  </label>
                  {about.topics.length > 0 && (
                    <ul className="cs-chips">
                      {about.topics.map((topic) => (
                        <li key={topic} className="cs-chip">
                          <span>{topic}</span>
                          <button
                            type="button"
                            aria-label={`Fjern ${topic}`}
                            onClick={() =>
                              setAbout((a) => ({
                                ...a,
                                topics: a.topics.filter((t) => t !== topic),
                              }))
                            }
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    id="cs-topic"
                    ref={topicRef}
                    value={topicDraft}
                    disabled={about.topics.length >= ABOUT_LIMITS.maxTopics}
                    placeholder={
                      about.topics.length >= ABOUT_LIMITS.maxTopics
                        ? "Det holder med åtte"
                        : "Skriv og trykk Enter"
                    }
                    onChange={(e) =>
                      setTopicDraft(
                        cleanAboutText(e.target.value, ABOUT_LIMITS.text),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      addTopic();
                    }}
                  />
                </div>
                <label className="cs-name">
                  <span className="cs-label">
                    Det sier jeg ofte <small>valgfritt</small>
                  </span>
                  <input
                    ref={sayingRef}
                    value={about.saying ?? ""}
                    placeholder="Har du prøvd å skru den av og på?"
                    onChange={(e) =>
                      setAbout((a) => ({
                        ...a,
                        saying: cleanAboutText(
                          e.target.value,
                          ABOUT_LIMITS.saying,
                        ),
                      }))
                    }
                  />
                </label>
              </div>
            )}
            {mode === "look" && (
              <>
                {stepPart && current && (
                  <div className="cs-stepper">
                    <button
                      type="button"
                      className="cs-arrow"
                      onClick={() => step(-1)}
                      aria-label="Forrige"
                    >
                      ‹
                    </button>
                    <strong>{current.label}</strong>
                    <button
                      type="button"
                      className="cs-arrow"
                      onClick={() => step(1)}
                      aria-label="Neste"
                    >
                      ›
                    </button>
                    <span>
                      {Math.max(
                        1,
                        usable.findIndex((o) => o.id === current.id) + 1,
                      )}{" "}
                      av {usable.length}
                    </span>
                  </div>
                )}

                {cat.sections.map((section) => (
                  <section
                    key={section.part ?? section.color?.key}
                    className="cs-section"
                  >
                    {section.heading && (
                      <h3 className="cs-heading">{section.heading}</h3>
                    )}
                    {section.part && renderGrid(section.part)}
                    {section.color &&
                      usesColor(
                        choice,
                        section.color.key,
                        section.color.options,
                      ) &&
                      renderSwatches(section.color)}
                  </section>
                ))}
              </>
            )}
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
                      Navnet, figuren og det du skriver under Om meg vises for
                      de andre deltakerne. Fremgangen din vises også.
                    </small>
                  </span>
                </label>
                {shareProfile && (
                  <label className="cs-share cs-share--sub">
                    <input
                      type="checkbox"
                      checked={shareHints}
                      onChange={(e) => setShareHints(e.target.checked)}
                    />
                    <span>
                      <strong>Vis hvor mange hint jeg brukte</strong>
                      <small>
                        Andre ser antall hint per luke. Skru av hvis du heller
                        vil spille i fred.
                      </small>
                    </span>
                  </label>
                )}
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
                {doneButton}
              </>
            ) : mode === "about" ? (
              doneButton
            ) : (
              <div className="cs-hero-meta">
                <strong>{initialName.trim() || "Figuren din"}</strong>
                {FEATURES.rpg && <span>Nivå {level}</span>}
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

// The Om meg tab's left column: jumps to a field.
const ABOUT_NAV: { id: AboutField | "saying"; label: string }[] = [
  { id: "food", label: "Mat" },
  { id: "activity", label: "Gjøre" },
  { id: "topics", label: "Prater om" },
  { id: "saying", label: "Sier ofte" },
];

// «Tilfeldig» changes your looks, not the gear you are wearing.
function pickGear(choice: FigureChoice): Partial<FigureChoice> {
  const keep: Partial<FigureChoice> = {
    armour: choice.armour,
    scarf: choice.scarf,
    extra: choice.extra,
  };
  if (isGear("hat", choice.hat)) keep.hat = choice.hat;
  return keep;
}
