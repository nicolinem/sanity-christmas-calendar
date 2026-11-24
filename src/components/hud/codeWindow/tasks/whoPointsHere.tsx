import {
  Component,
  createElement,
  isValidElement,
  useEffect as reactUseEffect,
  useMemo as reactUseMemo,
  useRef as reactUseRef,
  useState as reactUseState,
  type ReactNode,
} from "react";
import { OBSERVATIONS, PLACES } from "@/game/archive";
import type { Modules } from "../runCode";
import { ARCHIVE_REFERENCE, runGroq } from "./groq";
import { SCHEMA_REFERENCE } from "./structureLists";
import type { Requirement, Verdict, WindowTask } from "./types";

// Uke 2, teknisk luke 3: «Hvem peker hit?». The player writes a Sanity
// document view for `place`: a tab that lists the observations pointing at the
// place. The window runs the component twice, for two places, against a fake
// client that answers with real GROQ on Arkivarens practice dataset, and
// checks what each place shows and how the id travels. When it passes, our
// version (src/sanity/studio/ObservationsHere.tsx) switches on in the Studio.

const STARTER = `import { useEffect, useState } from "react"
import { useClient } from "sanity"
import { Card, Stack, Text } from "@sanity/ui"

// Arkivaren: «Når jeg åpner et sted, vil jeg se alt som er meldt der.»
export function ObservationsHere(props) {
  const client = useClient({ apiVersion: "2024-01-01" })
  const [rows, setRows] = useState([])

  useEffect(() => {
    // Hent observasjonene som peker på dette stedet.
    // props.documentId er id-en til stedet du har åpnet.
  }, [props.documentId])

  return (
    <Stack space={2} padding={4}>
      {rows.map((o) => (
        <Card key={o._id} padding={3}><Text>{o.time} · {o.what}</Text></Card>
      ))}
    </Stack>
  )
}
`;

const OURS = `client
  .fetch(
    \`*[_type == "observation" && references($id)] | order(time asc)\`,
    { id: props.documentId },
  )
  .then(setRows)`;

// --- A fake client that runs real GROQ --------------------------------------

type Call = { query: string; params: Record<string, unknown>; error?: string };
type Log = { calls: Call[]; inflight: number };

const MISSING_API_VERSION =
  '`useClient` må få en `apiVersion`, for eksempel `useClient({ apiVersion: "2024-01-01" })`.';

// The `$params` a query uses; Sanity refuses a query that uses one it wasn't given.
const paramsIn = (query: string) => [
  ...new Set([...query.matchAll(/\$(\w+)/g)].map((m) => m[1])),
];

function makeClient(log: Log | null) {
  const client = {
    async fetch(query: string, params: Record<string, unknown> = {}) {
      const call: Call = { query, params };
      log?.calls.push(call);
      if (log) log.inflight += 1;
      try {
        const missing = paramsIn(query).filter((p) => !(p in params));
        if (missing.length)
          throw new Error(
            `Spørringen bruker ${missing.map((p) => `$${p}`).join(", ")}, men du ga den ikke med i parametrene.`,
          );
        return await runGroq(query, params);
      } catch (err) {
        call.error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        if (log) log.inflight -= 1;
      }
    },
  };
  return new Proxy(client, {
    get(target, prop) {
      if (prop in target || typeof prop === "symbol" || prop === "then")
        return Reflect.get(target, prop);
      return () => {
        throw new Error(
          `Klienten i kodevinduet kan bare \`fetch\`, ikke \`${String(prop)}\`.`,
        );
      };
    },
  });
}

// --- A tiny hook runner for judging -----------------------------------------
// The judge renders the player's component without a DOM. `useState` and
// `useEffect` come from here while a render is running, and from React the
// rest of the time (the live preview), so the same code runs in both.

type Slot = {
  value?: unknown;
  deps?: unknown[];
  cleanup?: unknown;
  fn?: () => unknown;
  ref?: { current: unknown };
};
type Harness = {
  slots: Slot[];
  i: number;
  dirty: boolean;
  queued: Slot[];
  log: Log;
  client: ReturnType<typeof makeClient>;
};

let active: Harness | null = null;
const liveClient = makeClient(null);

function sameDeps(a?: unknown[], b?: unknown[]) {
  return (
    Boolean(a && b) &&
    a!.length === b!.length &&
    a!.every((x, i) => Object.is(x, b![i]))
  );
}

function useState<T>(initial: T | (() => T)) {
  const h = active;
  if (!h) return reactUseState(initial);
  const slot = (h.slots[h.i] ??= {
    value: typeof initial === "function" ? (initial as () => T)() : initial,
  });
  h.i += 1;
  const set = (next: unknown) => {
    const value =
      typeof next === "function"
        ? (next as (v: unknown) => unknown)(slot.value)
        : next;
    if (!Object.is(value, slot.value)) {
      slot.value = value;
      h.dirty = true;
    }
  };
  return [slot.value as T, set] as const;
}

function useEffect(fn: () => unknown, deps?: unknown[]) {
  const h = active;
  if (!h) return reactUseEffect(fn as never, deps);
  const slot = (h.slots[h.i] ??= {});
  h.i += 1;
  if (!sameDeps(slot.deps, deps)) {
    slot.deps = deps;
    slot.fn = fn;
    h.queued.push(slot);
  }
}

function useMemo<T>(fn: () => T, deps: unknown[]) {
  const h = active;
  if (!h) return reactUseMemo(fn, deps);
  const slot = (h.slots[h.i] ??= {});
  h.i += 1;
  if (!sameDeps(slot.deps, deps)) {
    slot.deps = deps;
    slot.value = fn();
  }
  return slot.value as T;
}

function useRef<T>(initial: T) {
  const h = active;
  if (!h) return reactUseRef(initial);
  const slot = (h.slots[h.i] ??= { ref: { current: initial } });
  h.i += 1;
  return slot.ref as { current: T };
}

function useCallback<T extends (...a: never[]) => unknown>(
  fn: T,
  deps: unknown[],
) {
  return useMemo(() => fn, deps);
}

function useClient(options?: { apiVersion?: string }) {
  if (!options?.apiVersion) throw new Error(MISSING_API_VERSION);
  return active ? active.client : liveClient;
}

// --- Stand-ins for @sanity/ui ------------------------------------------------

type UiProps = {
  children?: ReactNode;
  padding?: number;
  gap?: number;
  space?: number;
  size?: number;
  tone?: string;
  [key: string]: unknown;
};

const px = (n?: number) => (n === undefined ? undefined : `${n * 4}px`);

function Card({ children, padding }: UiProps) {
  return createElement(
    "div",
    { className: "cw-wph-card", style: { padding: px(padding) } },
    children,
  );
}
function Box({ children, padding }: UiProps) {
  return createElement("div", { style: { padding: px(padding) } }, children);
}
function Stack({ children, padding, gap, space = 2 }: UiProps) {
  return createElement(
    "div",
    { style: { display: "grid", gap: px(gap ?? space), padding: px(padding) } },
    children,
  );
}
function Flex({ children, padding, gap, space = 2 }: UiProps) {
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        gap: px(gap ?? space),
        padding: px(padding),
        alignItems: "center",
      },
    },
    children,
  );
}
function Text({ children, size }: UiProps) {
  return createElement("span", { "data-size": size }, children);
}
function Badge({ children, tone }: UiProps) {
  return createElement(
    "span",
    { className: "cw-wph-badge", "data-tone": tone },
    children,
  );
}

const STAND_INS = new Set<unknown>([Card, Box, Stack, Flex, Text, Badge]);

const MODULES: Modules = {
  react: { useState, useEffect, useMemo, useRef, useCallback },
  sanity: { useClient },
  "@sanity/ui": { Card, Box, Stack, Flex, Text, Badge },
};

// --- Rendering without a DOM -------------------------------------------------

type ViewProps = {
  documentId: string;
  document: { displayed: { _id: string; _type: string; name: string } };
  schemaType: { name: string };
};

const propsFor = (place: { _id: string; name: string }): ViewProps => ({
  documentId: place._id,
  document: {
    displayed: { _id: `drafts.${place._id}`, _type: "place", name: place.name },
  },
  schemaType: { name: "place" },
});

type ViewFn = (props: ViewProps) => ReactNode;

function renderOnce(h: Harness, view: ViewFn, props: ViewProps): ReactNode {
  active = h;
  h.i = 0;
  h.queued = [];
  try {
    return view(props);
  } finally {
    active = null;
  }
}

function runEffects(h: Harness) {
  active = h;
  try {
    for (const slot of h.queued) {
      if (typeof slot.cleanup === "function") (slot.cleanup as () => void)();
      slot.cleanup = slot.fn?.();
    }
  } finally {
    active = null;
    h.queued = [];
  }
}

// All the text a tree would show. Stand-ins are looked through; the player's
// own helper components are called in the same render.
function textOf(node: ReactNode, out: string[] = []): string[] {
  if (typeof node === "string" || typeof node === "number")
    out.push(String(node));
  else if (Array.isArray(node)) node.forEach((n) => textOf(n, out));
  else if (isValidElement<{ children?: ReactNode }>(node)) {
    const { type, props } = node;
    if (typeof type === "function" && !STAND_INS.has(type))
      textOf((type as (p: unknown) => ReactNode)(props), out);
    else textOf(props.children, out);
  }
  return out;
}

type Page = {
  id: string;
  name: string;
  text: string;
  calls: Call[];
  error?: string;
};

async function renderPage(
  view: ViewFn,
  place: { _id: string; name: string },
): Promise<Page> {
  const log: Log = { calls: [], inflight: 0 };
  const h: Harness = {
    slots: [],
    i: 0,
    dirty: false,
    queued: [],
    log,
    client: makeClient(log),
  };
  const props = propsFor(place);
  let tree: ReactNode = null;
  try {
    for (let round = 0; round < 40; round++) {
      h.dirty = false;
      tree = renderOnce(h, view, props);
      runEffects(h);
      // Give the fetch time to answer, then render again if state changed.
      for (let wait = 0; wait < 60 && log.inflight > 0; wait++)
        await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
      if (!h.dirty) break;
    }
  } catch (err) {
    return {
      id: place._id,
      name: place.name,
      text: "",
      calls: log.calls,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  return {
    id: place._id,
    name: place.name,
    text: textOf(tree).join(" "),
    calls: log.calls,
  };
}

// --- The judge ----------------------------------------------------------------

const idsAt = (placeId: string) =>
  OBSERVATIONS.filter((o) => o.place._ref === placeId).map((o) => o._id);
const shownIds = (page: Page) =>
  OBSERVATIONS.filter((o) => page.text.includes(o.what)).map((o) => o._id);
const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

const DRAFT_HINT =
  "`props.document.displayed._id` kan være en *draft*-id (`drafts.place-…`), og ingen observasjoner peker på den. Bruk `props.documentId`, som alltid er id-en til selve stedet.";
const usedDraftId = (page: Page) =>
  page.calls.some(
    (c) =>
      c.query.includes("drafts.") ||
      Object.values(c.params).some(
        (v) => typeof v === "string" && v.startsWith("drafts."),
      ),
  );

function whyWrong(page: Page): string {
  if (page.error) return `Komponenten krasjet for ${page.name}: ${page.error}`;
  const failed = page.calls.find((c) => c.error);
  if (failed) return failed.error!;
  if (page.calls.length === 0)
    return "Koden henter ingenting ennå. Bruk `client.fetch(spørring, params)` i `useEffect`, og lagre svaret med `setRows`.";
  const shown = shownIds(page);
  if (usedDraftId(page) && shown.length === 0) return DRAFT_HINT;
  if (shown.length === 0)
    return `${page.name} viser ingenting. Svaret må inn i \`setRows\`, og \`.fetch\` gir et *promise*: bruk \`.then(setRows)\`.`;
  const want = idsAt(page.id);
  return `${page.name} viser ${shown.length} observasjoner, men ${want.length} peker dit.`;
}

export async function judgeWhoPointsHere(
  exports: Record<string, unknown>,
): Promise<Verdict<{ component?: ViewFn }>> {
  const labels = [
    "Bakeriet viser observasjonene der",
    "Hvert sted viser sine egne",
    "Id-en sendes som parameter",
  ];
  const view = exports.ObservationsHere;
  if (typeof view !== "function") {
    return {
      done: false,
      requirements: labels.map((label, i) => ({
        label,
        done: false,
        message:
          i === 0
            ? "Behold `export function ObservationsHere(props) { … }`."
            : undefined,
      })),
    };
  }

  const bakery = PLACES.find((p) => p._id === "place-bakeriet")!;
  const square = PLACES.find((p) => p._id === "place-torget")!;
  const pages = [
    await renderPage(view as ViewFn, bakery),
    await renderPage(view as ViewFn, square),
  ];
  const right = pages.map((p) => !p.error && sameSet(shownIds(p), idsAt(p.id)));

  const stuck = pages.find((_, i) => !right[i]);
  const calls = pages.flatMap((p) => p.calls);
  const literal = pages.some((p) =>
    p.calls.some((c) => c.query.includes(p.id)),
  );
  const noParam = calls.some((c) => !/\$\w+/.test(c.query));
  const wrongId = pages.some(
    (p) =>
      p.calls.length > 0 &&
      !p.calls.some((c) => Object.values(c.params).includes(p.id)),
  );

  const requirements: Requirement[] = [
    {
      label: labels[0],
      done: right[0],
      message: right[0] ? undefined : whyWrong(pages[0]),
    },
    {
      label: labels[1],
      done: right[0] && right[1],
      message:
        right[0] && right[1]
          ? undefined
          : right[0]
            ? `${square.name} viser ikke sine egne observasjoner. Skriv ikke inn ett sted i spørringen: id-en endrer seg for hvert sted du åpner.`
            : stuck
              ? whyWrong(stuck)
              : undefined,
    },
    {
      label: labels[2],
      done: calls.length > 0 && !literal && !noParam && !wrongId,
      message:
        calls.length === 0
          ? "Ingen spørring ennå."
          : literal || noParam
            ? "Id-en står skrevet inn i spørringen. Bruk en parameter: `references($id)` og send `{ id: props.documentId }` som andre argument til `fetch`."
            : usedDraftId(pages[0])
              ? DRAFT_HINT
              : "Send id-en til stedet som parameter: `{ id: props.documentId }`.",
    },
  ];
  const done = requirements.every((r) => r.done);
  return {
    requirements,
    done,
    solvedAs: done ? {} : undefined,
    data: { component: view as ViewFn },
  };
}

// --- The preview: a document pane for a place -------------------------------

class Safe extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: unknown },
  { failed: boolean; resetKey: unknown }
> {
  state = { failed: false, resetKey: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(
    props: { resetKey: unknown },
    state: { failed: boolean; resetKey: unknown },
  ) {
    return props.resetKey !== state.resetKey
      ? { failed: false, resetKey: props.resetKey }
      : null;
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function PlacePane({ verdict }: { verdict: Verdict | null }) {
  const [placeId, setPlaceId] = reactUseState("place-bakeriet");
  const [tab, setTab] = reactUseState<"form" | "view">("view");
  const View = (verdict?.data as { component?: ViewFn } | undefined)?.component;
  if (!View) return <p className="cw-wph-empty">Kjør koden for å se fanen.</p>;
  const place = PLACES.find((p) => p._id === placeId) ?? PLACES[0];
  const props = propsFor(place);
  return (
    <div className="cw-wph" aria-label="Slik blir det i Studio">
      <div className="cw-wph-places" role="group" aria-label="Åpne et sted">
        {PLACES.map((p) => (
          <button
            key={p._id}
            type="button"
            className={p._id === placeId ? "is-open" : undefined}
            aria-pressed={p._id === placeId}
            onClick={() => setPlaceId(p._id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="cw-wph-title">{place.name}</p>
      <div className="cw-wph-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "form"}
          className={tab === "form" ? "is-open" : undefined}
          onClick={() => setTab("form")}
        >
          Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "view"}
          className={tab === "view" ? "is-open" : undefined}
          onClick={() => setTab("view")}
        >
          Observasjoner her
        </button>
      </div>
      <div className="cw-wph-body">
        {tab === "form" ? (
          <label className="cw-wph-field">
            Name
            <input value={place.name} readOnly />
          </label>
        ) : (
          <Safe
            resetKey={View}
            fallback={
              <p className="cw-wph-empty" role="alert">
                Fanen krasjet i forhåndsvisningen.
              </p>
            }
          >
            <View key={place._id} {...props} />
          </Safe>
        )}
      </div>
    </div>
  );
}

export const whoPointsHereTask: WindowTask = {
  id: "who-points-here",
  file: "ObservationsHere.tsx",
  starter: STARTER,
  solution: STARTER.replace(
    "    // Hent observasjonene som peker på dette stedet.\n    // props.documentId er id-en til stedet du har åpnet.\n",
    OURS.split("\n")
      .map((line) => `    ${line}`)
      .join("\n") + "\n",
  ),
  modules: MODULES,
  judge: judgeWhoPointsHere,
  resultTitle: "Fanen på et sted i Studio",
  Result: PlacePane,
  ours: OURS,
  references: [SCHEMA_REFERENCE, ARCHIVE_REFERENCE],
  extend: {
    file: "src/sanity/studio/ObservationsHere.tsx",
    marker: "QUEST: Hvem peker hit",
    idea: "Vis vitnet også, eller bare de bekreftede observasjonene.",
  },
};
