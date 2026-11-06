import { Component, isValidElement, type ElementType, type ReactNode } from "react";
import SpriteImage from "@/components/SpriteImage";
import spriteImageSource from "@/components/SpriteImage?raw";
import { TASK_ICONS, type TaskIconName } from "@/sanity/lib/taskIcons";
import type { ImportHelp, Modules } from "../runCode";
import type { Reference, Requirement, Verdict, WindowTask } from "./types";

// Luke 2 in the code window: give items an icon and a preview with their
// sprite. The player's code is run against a few example documents, like a
// GROQ task is run against a dataset. When every requirement holds, the Studio
// switches on our own version (src/sanity/lib/solved.tsx).

const PREVIEW_STARTER = `import { defineType } from "sanity"
import SpriteImage from "../../components/SpriteImage"

// Lista i Studio viser bare navn. Gi gjenstandene et ikon,
// og vis spriten ved siden av navnet.
export const item = defineType({
  name: "item",
  title: "Item",
  type: "document",
  // fields: name, kind, sprite og description ligger i Studio

  preview: {
    select: { title: "name", subtitle: "kind" },
  },
})
`;

// What the player's `import` lines can reach.
const PREVIEW_MODULES: Modules = {
  sanity: { defineType: <T,>(x: T) => x, defineField: <T,>(x: T) => x },
  "../../components/SpriteImage": { default: SpriteImage },
  ...Object.fromEntries(
    Object.entries(TASK_ICONS).map(([name, Icon]) => [`@sanity/icons/${name}`, { [`${name}Icon`]: Icon, default: Icon }]),
  ),
};

// Files the starter imports, shown read-only in their own tab.
const PREVIEW_REFERENCES: Reference[] = [
  {
    file: "SpriteImage.tsx",
    path: "src/components/SpriteImage.tsx",
    source: spriteImageSource,
    about:
      "Gi den en `spriteId`, så slår den opp riktig rute i et bildeark fra spillet og tegner den. Kjenner den ikke id-en, tegner den en reserve ut fra `kind`.",
    examples: [
      { code: '<SpriteImage spriteId="axe" />', shows: <SpriteImage spriteId="axe" /> },
      { code: '<SpriteImage spriteId="sword" />', shows: <SpriteImage spriteId="sword" /> },
      { code: '<SpriteImage spriteId="ukjent" kind="weapon" />', shows: <SpriteImage spriteId="ukjent" kind="weapon" /> },
    ],
  },
];

const KNOWN_ICONS = Object.keys(TASK_ICONS).join(", ");

// Imports people reach for that the window doesn't offer. The root import is
// what older docs show; since @sanity/icons 5 it gives `undefined` in a real
// Studio too, without an error.
const previewImportHelp: ImportHelp = (name) => {
  if (name === "@sanity/icons")
    return 'Fra versjon 5 har hvert ikon sin egen sti: `import { BoltIcon } from "@sanity/icons/Bolt"`. Fra `@sanity/icons` alene får du `undefined`, også i Studio.';
  if (name.startsWith("@sanity/icons/"))
    return `Kodevinduet kjenner ikke \`${name}\`. Velg et av disse: ${KNOWN_ICONS}.`;
  return undefined;
};

// The documents the preview is tried on. Shown as the list the player builds.
const EXAMPLES = [
  { name: "Frostbit", kind: "weapon", sprite: "sword" },
  { name: "Vedkløyver", kind: "weapon", sprite: "axe" },
  { name: "Istapp", kind: "weapon", sprite: "dagger" },
  { name: "Jernmalm", kind: "material", sprite: undefined },
] as const;

type Row = { key: string; title: ReactNode; subtitle: ReactNode; media: ReactNode; icon: ElementType | null; error?: string };

// What this task keeps in `Verdict.data`: the list the Studio would draw.
type PreviewData = { rows: Row[] };

const text = (v: unknown): ReactNode => (typeof v === "string" || typeof v === "number" ? v : null);

function iconName(icon: unknown): TaskIconName | undefined {
  return (Object.keys(TASK_ICONS) as TaskIconName[]).find((name) => TASK_ICONS[name] === icon);
}

function judgePreview(exports: Record<string, unknown>): Verdict<PreviewData> {
  const item = exports.item as
    | { icon?: unknown; preview?: { select?: Record<string, unknown>; prepare?: unknown } }
    | undefined;
  if (!item || typeof item !== "object") {
    return {
      done: false,
      data: { rows: [] },
      requirements: [{ label: "Fant `item`", done: false, message: "Behold `export const item = defineType({ … })`." }],
    };
  }

  const icon = iconName(item.icon);
  const select = (item.preview?.select ?? {}) as Record<string, unknown>;
  const spriteKey = Object.keys(select).find((k) => select[k] === "sprite");
  const prepare = typeof item.preview?.prepare === "function" ? (item.preview.prepare as (s: object) => unknown) : null;

  // Build the list the way the Studio would: select picks raw values, prepare
  // (if any) turns them into what's shown.
  let shown = 0;
  let crashed: string | undefined;
  const rows: Row[] = EXAMPLES.map((doc) => {
    const selection = Object.fromEntries(
      Object.entries(select).map(([key, path]) => [key, typeof path === "string" ? doc[path as keyof typeof doc] : undefined]),
    );
    const Icon = icon ? TASK_ICONS[icon] : null;
    if (!prepare) return { key: doc.name, title: text(selection.title), subtitle: text(selection.subtitle), media: null, icon: Icon };
    try {
      const out = (prepare(selection) ?? {}) as { title?: unknown; subtitle?: unknown; media?: unknown };
      const media = out.media;
      const right =
        !doc.sprite ||
        (isValidElement(media) && media.type === SpriteImage && (media.props as { spriteId?: unknown }).spriteId === doc.sprite);
      if (doc.sprite && right && text(out.title) === doc.name) shown++;
      return {
        key: doc.name,
        title: text(out.title),
        subtitle: text(out.subtitle),
        media: isValidElement(media) ? media : null,
        icon: Icon,
      };
    } catch (err) {
      crashed ??= err instanceof Error ? err.message : String(err);
      return { key: doc.name, title: doc.name, subtitle: null, media: null, icon: Icon, error: "krasjet" };
    }
  });
  const withSprite = EXAMPLES.filter((d) => d.sprite).length;

  const requirements: Requirement[] = [
    {
      label: "Et `icon` fra `@sanity/icons`",
      done: Boolean(icon),
      message: item.icon
        ? `Kodevinduet kjenner disse ikonene: ${KNOWN_ICONS}.`
        : "`item` har ikke noe `icon` ennå.",
    },
    {
      label: "`preview.select` henter `sprite`",
      done: Boolean(spriteKey),
      message: "`preview.select` henter ikke *field*-et `sprite`.",
    },
    {
      label: "`prepare()` viser spriten",
      done: Boolean(prepare) && !crashed && shown === withSprite,
      message: !prepare
        ? "*Preview*-en har ingen `prepare()`, så ingenting gjør sprite-id-en om til et bilde."
        : crashed
          ? `\`prepare()\` krasjet: ${crashed}`
          : `${shown} av ${withSprite} våpen viser riktig sprite og navn. \`media\` skal være en \`<SpriteImage spriteId={…} />\`.`,
    },
  ];

  const done = requirements.every((r) => r.done);
  return { requirements, done, data: { rows }, solvedAs: done ? { icon } : undefined };
}

// The code the Studio switches on, shown once the task is solved, so the
// player can compare. Kept in step with src/sanity/schemaTypes/item.tsx.
const PREVIEW_OURS = `preview: {
  select: { title: "name", subtitle: "kind", spriteId: "sprite" },
  prepare: ({ title, subtitle, spriteId }) => ({
    title,
    subtitle,
    media: <SpriteImage spriteId={spriteId} kind={subtitle} />,
  }),
},`;

// The document list as the Studio would draw it from the player's preview.
function StudioList({ verdict }: { verdict: Verdict | null }) {
  const rows = (verdict?.data as PreviewData | undefined)?.rows ?? [];
  const Fallback = TASK_ICONS.Document;
  return (
    <ul className="cw-studio" aria-label="Dokumentlista i Studio">
      {rows.length === 0 && <li className="cw-studio-empty">Ingen gjenstander å vise ennå.</li>}
      {rows.map((row) => {
        const Icon: ElementType = row.icon ?? Fallback;
        return (
          <li key={row.key} className="cw-studio-row">
            <span className="cw-studio-media" aria-hidden>
              <Safe fallback={<Icon />}>{row.media ?? <Icon />}</Safe>
            </span>
            <span className="cw-studio-text">
              <span className="cw-studio-title">{row.title ?? <em>Uten tittel</em>}</span>
              <span className="cw-studio-sub">{row.error ? "prepare() krasjet" : row.subtitle}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// The player's media is drawn live; if it throws, show the icon instead.
class Safe extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export const previewTask: WindowTask = {
  id: "branns-ledger",
  file: "item.tsx",
  starter: PREVIEW_STARTER,
  modules: PREVIEW_MODULES,
  importHelp: previewImportHelp,
  judge: judgePreview,
  resultTitle: "Slik blir lista i Studio",
  Result: StudioList,
  ours: PREVIEW_OURS,
  references: PREVIEW_REFERENCES,
  extend: {
    file: "src/sanity/schemaTypes/item.tsx",
    marker: "QUEST: Luke 2",
    idea: "Bytt ut `ItemMedia` med din egen kode: vis noe annet enn spriten, for eksempel et merke for våpen uten sprite.",
  },
};
