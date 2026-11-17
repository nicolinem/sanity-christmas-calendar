import { useState } from "react";
import { OBSERVATIONS, PLACES } from "@/game/archive";
import archiveSchemaSource from "@/sanity/schemaTypes/archive?raw";
import { ARCHIVE_REFERENCE, runGroq } from "./groq";
import type { Reference, Requirement, Verdict, WindowTask } from "./types";

// Uke 2, teknisk luke 2: «Arkivarens lister». The player writes a Structure
// Builder resolver in the code window. The window hands it a stand-in for `S`
// that only records what was asked for, then runs each list's filter as GROQ
// against Arkivarens practice dataset and draws the panes the Studio would
// show. When it passes, our version in src/sanity/studio/structure.ts
// switches on in the player's Studio.

const STARTER = `// Arkivaren: «Jeg kan ikke skrive GROQ hver gang
// jeg skal lete. Sett spørringene rett inn i Studio.»
//
// Legg til to punkter øverst: «Bare bekreftede» og «Per sted».
// «Per sted» viser stedene, og under hvert sted observasjonene der.
export const structure = (S) =>
  S.list()
    .title("Content")
    .items([
      // dine punkter her

      ...S.documentTypeListItems(),
    ])
`;

const OURS = `S.listItem()
  .title("Bare bekreftede")
  .child(
    S.documentList()
      .title("Bekreftede")
      .filter('_type == "observation" && status == "confirmed"'),
  ),
S.listItem()
  .title("Per sted")
  .child(
    S.documentTypeList("place")
      .title("Per sted")
      .child((placeId) =>
        S.documentList()
          .title("Observasjoner")
          .filter('_type == "observation" && references($placeId)')
          .params({ placeId }),
      ),
  ),
S.divider(),`;

// --- A recording stand-in for the Structure Builder -------------------------

type Node = {
  __kind: string;
  __args: unknown[];
  __calls: Record<string, unknown[]>;
  __standard?: string;
};

function node(kind: string, args: unknown[] = []): Node {
  const target: Node = {
    __kind: kind,
    __args: args,
    __calls: {},
    __standard: undefined,
  };
  const proxy: Node = new Proxy(target, {
    get(t, prop) {
      if (typeof prop === "symbol" || prop in t) return Reflect.get(t, prop);
      if (prop === "then") return undefined;
      return (...a: unknown[]) => {
        t.__calls[prop] = a;
        return proxy;
      };
    },
  });
  return proxy;
}

const TYPES = [
  { name: "item", title: "Item" },
  { name: "observation", title: "Observation" },
  { name: "place", title: "Place" },
  { name: "witness", title: "Witness" },
];

function makeS() {
  return {
    list: () => node("list"),
    listItem: () => node("listItem"),
    documentList: () => node("documentList"),
    documentTypeList: (type: string) => node("documentTypeList", [type]),
    documentTypeListItem: (type: string) => {
      const n = node("listItem");
      n.__standard = type;
      n.__calls.title = [TYPES.find((t) => t.name === type)?.title ?? type];
      return n;
    },
    documentTypeListItems: () =>
      TYPES.map((t) => {
        const n = node("listItem");
        n.__standard = t.name;
        n.__calls.title = [t.title];
        return n;
      }),
    divider: () => node("divider"),
  };
}

const isNode = (v: unknown): v is Node =>
  Boolean(v) && typeof v === "object" && "__kind" in (v as object);
const call = (n: Node, name: string) => n.__calls[name]?.[0];

// --- What the panes show ----------------------------------------------------

export type DocRow = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
};
type Pane =
  | { kind: "docs"; title: string; rows: DocRow[]; error?: string }
  | {
      kind: "places";
      title: string;
      places: {
        id: string;
        name: string;
        rows: DocRow[] | null;
        error?: string;
      }[];
    };
type RootItem = { key: string; title: string; divider?: true; pane?: Pane };
export type StructureData = { root: RootItem[] };

const placeName = (id: string) => PLACES.find((p) => p._id === id)?.name ?? id;
const rowFor = (id: string): DocRow | null => {
  const o = OBSERVATIONS.find((x) => x._id === id);
  return o
    ? {
        id,
        title: o.what,
        subtitle: `${o.time} · ${placeName(o.place._ref)}`,
        status: o.status,
      }
    : null;
};

// Runs a list's filter the way the Studio would: `*[filter]` with its params,
// newest-insensitive, as rows sorted by time.
async function rowsOf(
  list: Node,
): Promise<{ rows: DocRow[] | null; ids: string[]; error?: string }> {
  const filter = call(list, "filter");
  if (typeof filter !== "string")
    return { rows: null, ids: [], error: "Lista har ingen `filter`." };
  const params = (call(list, "params") ?? {}) as Record<string, unknown>;
  try {
    const result = await runGroq(`*[${filter}]._id`, params);
    const ids = Array.isArray(result) ? result.map(String) : [];
    const rows = ids.map(rowFor).filter((r): r is DocRow => Boolean(r));
    rows.sort((a, b) => a.subtitle.localeCompare(b.subtitle));
    return { rows, ids };
  } catch (err) {
    return {
      rows: null,
      ids: [],
      error: `Filteret virker ikke: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));
const CONFIRMED_IDS = OBSERVATIONS.filter((o) => o.status === "confirmed").map(
  (o) => o._id,
);
const idsAt = (placeId: string) =>
  OBSERVATIONS.filter((o) => o.place._ref === placeId).map((o) => o._id);

export async function judgeStructure(
  exports: Record<string, unknown>,
): Promise<Verdict<StructureData>> {
  const fail = (message: string): Verdict<StructureData> => ({
    done: false,
    data: { root: [] },
    requirements: [{ label: "Fant `structure`", done: false, message }],
  });
  if (typeof exports.structure !== "function")
    return fail("Behold `export const structure = (S) => …`.");

  const root = (exports.structure as (s: unknown) => unknown)(makeS());
  if (!isNode(root) || root.__kind !== "list")
    return fail("`structure` skal gi en `S.list()`.");
  const items = (call(root, "items") ?? []) as unknown[];
  if (!Array.isArray(items)) return fail("`.items()` skal få en liste.");

  let confirmedOk = false;
  let perPlaceOk = false;
  let confirmedMsg =
    "Fant ingen liste som viser akkurat de bekreftede observasjonene.";
  let perPlaceMsg =
    "Fant ingen liste over steder med observasjonene under hvert sted.";

  const out: RootItem[] = [];
  for (const [i, it] of items.entries()) {
    if (!isNode(it)) continue;
    if (it.__kind === "divider") {
      out.push({ key: `d${i}`, title: "", divider: true });
      continue;
    }
    const title = String(call(it, "title") ?? "Uten tittel");
    if (it.__standard) {
      const type = it.__standard;
      const rows =
        type === "observation"
          ? OBSERVATIONS.map((o) => rowFor(o._id)!).sort((a, b) =>
              a.subtitle.localeCompare(b.subtitle),
            )
          : type === "place"
            ? PLACES.map((p) => ({
                id: p._id,
                title: p.name,
                subtitle: "",
                status: "",
              }))
            : [];
      out.push({ key: `s${i}`, title, pane: { kind: "docs", title, rows } });
      continue;
    }
    const child = call(it, "child");
    if (!isNode(child)) {
      out.push({ key: `i${i}`, title });
      continue;
    }

    // A list of documents, like «Bare bekreftede».
    if (child.__kind === "documentList") {
      const { rows, ids, error } = await rowsOf(child);
      if (!error && sameSet(ids, CONFIRMED_IDS)) confirmedOk = true;
      else if (!confirmedOk && error) confirmedMsg = error;
      else if (!confirmedOk && ids.length)
        confirmedMsg = `«${title}» viser ${ids.length} observasjoner. De bekreftede er ${CONFIRMED_IDS.length}.`;
      out.push({
        key: `i${i}`,
        title,
        pane: {
          kind: "docs",
          title: String(call(child, "title") ?? title),
          rows: rows ?? [],
          error,
        },
      });
      continue;
    }

    // A list of places, each opening its observations.
    const listsPlaces =
      (child.__kind === "documentTypeList" && child.__args[0] === "place") ||
      (child.__kind === "documentList" &&
        /place/.test(String(call(child, "filter"))));
    if (listsPlaces) {
      const next = call(child, "child");
      const places: {
        id: string;
        name: string;
        rows: DocRow[] | null;
        error?: string;
      }[] = [];
      let allRight = typeof next === "function";
      if (typeof next !== "function")
        perPlaceMsg =
          "Stedene åpner ingenting ennå. Gi lista over steder en `.child((placeId) => …)`.";
      for (const p of PLACES) {
        if (typeof next !== "function") {
          places.push({ id: p._id, name: p.name, rows: null });
          continue;
        }
        let list: unknown;
        try {
          list = (next as (id: string) => unknown)(p._id);
        } catch (err) {
          allRight = false;
          perPlaceMsg = `\`.child()\` krasjet: ${err instanceof Error ? err.message : String(err)}`;
          places.push({ id: p._id, name: p.name, rows: null });
          continue;
        }
        if (!isNode(list) || list.__kind !== "documentList") {
          allRight = false;
          perPlaceMsg = "Hvert sted skal åpne en `S.documentList()`.";
          places.push({ id: p._id, name: p.name, rows: null });
          continue;
        }
        const { rows, ids, error } = await rowsOf(list);
        if (error || !sameSet(ids, idsAt(p._id))) {
          allRight = false;
          perPlaceMsg = error
            ? error
            : `${p.name} viser ${ids.length} observasjoner, men ${idsAt(p._id).length} peker dit. Bruk id-en du får inn, som en parameter.`;
        }
        places.push({ id: p._id, name: p.name, rows, error });
      }
      if (allRight) perPlaceOk = true;
      out.push({
        key: `i${i}`,
        title,
        pane: {
          kind: "places",
          title: String(call(child, "title") ?? title),
          places,
        },
      });
      continue;
    }
    out.push({ key: `i${i}`, title });
  }

  const standard = items.filter((it) => isNode(it) && it.__standard).length;
  const requirements: Requirement[] = [
    {
      label: "«Bare bekreftede» viser de bekreftede",
      done: confirmedOk,
      message: confirmedMsg,
    },
    {
      label: "«Per sted» viser observasjonene der",
      done: perPlaceOk,
      message: perPlaceMsg,
    },
    {
      label: "De vanlige typene er der fortsatt",
      done: standard >= TYPES.length,
      message:
        "`...S.documentTypeListItems()` mangler, så Item, Observation og de andre forsvinner fra Studio.",
    },
  ];
  const done = requirements.every((r) => r.done);
  return {
    requirements,
    done,
    solvedAs: done ? {} : undefined,
    data: { root: out },
  };
}

// --- The panes, drawn like the Studio --------------------------------------

function Rows({ rows }: { rows: DocRow[] }) {
  if (rows.length === 0)
    return <p className="cw-sb-empty">Ingen dokumenter.</p>;
  return (
    <ul className="cw-sb-rows">
      {rows.map((r) => (
        <li key={r.id}>
          <span className="cw-sb-title">{r.title}</span>
          {(r.subtitle || r.status) && (
            <span className="cw-sb-sub">
              {r.subtitle}
              {r.status && (
                <span className={`cw-sb-chip is-${r.status}`}>{r.status}</span>
              )}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StructurePanes({ verdict }: { verdict: Verdict | null }) {
  const root = (verdict?.data as StructureData | undefined)?.root ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const item = root.find((r) => r.key === open && r.pane);
  const pane = item?.pane;
  const chosenPlace =
    pane?.kind === "places"
      ? pane.places.find((p) => p.id === place)
      : undefined;
  return (
    <div className="cw-sb" aria-label="Slik blir det i Studio">
      <div className="cw-sb-pane">
        <p className="cw-sb-head">Content</p>
        <ul className="cw-sb-items">
          {root.map((r) =>
            r.divider ? (
              <li key={r.key} className="cw-sb-divider" aria-hidden />
            ) : (
              <li key={r.key}>
                <button
                  type="button"
                  className={r.key === open ? "is-open" : undefined}
                  disabled={!r.pane}
                  onClick={() => {
                    setOpen(r.key);
                    setPlace(null);
                  }}
                >
                  {r.title}
                </button>
              </li>
            ),
          )}
        </ul>
      </div>
      {pane && (
        <div className="cw-sb-pane">
          <p className="cw-sb-head">{pane.title}</p>
          {pane.kind === "docs" ? (
            pane.error ? (
              <p className="cw-sb-empty">{pane.error}</p>
            ) : (
              <Rows rows={pane.rows} />
            )
          ) : (
            <ul className="cw-sb-items">
              {pane.places.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={p.id === place ? "is-open" : undefined}
                    onClick={() => setPlace(p.id)}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {chosenPlace && (
        <div className="cw-sb-pane">
          <p className="cw-sb-head">{chosenPlace.name}</p>
          {chosenPlace.rows ? (
            <Rows rows={chosenPlace.rows} />
          ) : (
            <p className="cw-sb-empty">
              {chosenPlace.error ?? "Åpner ingen liste ennå."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// The schema the lists are built on, so the player can see the field names
// (`status`, `place`) without leaving the window.
export const SCHEMA_REFERENCE: Reference = {
  file: "archive.ts",
  path: "src/sanity/schemaTypes/archive.ts",
  source: archiveSchemaSource,
  about:
    'Skjemaet for Arkivarens dokumenter. En `observation` har `status` (`"unknown"`, `"confirmed"` eller `"rumor"`) og peker på et `place` med en *reference*. Fanen `observasjoner.json` viser hvordan dataene ser ut.',
  examples: [],
};

export const structureTask: WindowTask = {
  id: "archive-lists",
  file: "structure.ts",
  starter: STARTER,
  modules: {},
  judge: judgeStructure,
  resultTitle: "Slik blir det i Studio (klikk deg inn)",
  Result: StructurePanes,
  ours: OURS,
  references: [SCHEMA_REFERENCE, ARCHIVE_REFERENCE],
  extend: {
    file: "src/sanity/studio/structure.ts",
    marker: "QUEST: Arkivarens lister",
    idea: "Prøv en liste til, for eksempel «Bare rykter», eller sorter observasjonene med `.defaultOrdering()`.",
  },
};
