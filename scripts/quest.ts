// Brann's inspection: `npm run quest`
//
// Some quests can only be judged from your code (an icon, a validation rule, a
// custom input, a Studio view). This script loads your Studio config the same
// way the Studio does (it runs through `sanity exec`, so .tsx schemas work),
// tries what you built, and writes the verdicts to .quest/results.json. The
// game reads that file when you press "Sjekk smia" or refresh.
//
// It inspects behaviour, not code style: any solution that works, passes.
// Verdicts are Norwegian because the game shows them to the player.

/* eslint-disable @typescript-eslint/no-explicit-any -- this file pokes at user-written config */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SanityClient } from "@sanity/client";
import { isValidElement } from "react";
import config from "../sanity.config";

type Verdict = { done: boolean; message: string };

// --- setup ---------------------------------------------------------------------

function readEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(".env.local")) return env;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = { ...readEnv(), ...process.env } as Record<string, string | undefined>;
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const client: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion: "2024-01-01", useCdn: false, perspective: "published" })
  : null;

const cfg = config as any;
const types: any[] = Array.isArray(cfg.schema?.types) ? cfg.schema.types : [];
const item = types.find((t) => t?.name === "item");
const field = (name: string) => item?.fields?.find((f: any) => f?.name === name);

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));
const NO_ITEM = "Brann finner ingen `item`-type i skjemaet ditt.";

// --- Branns protokoll ----------------------------------------------------------

function checkLedger(): Verdict {
  if (!item) return { done: false, message: NO_ITEM };
  if (!item.icon) return { done: false, message: "Gjenstander har ikke noe `icon` ennå." };
  const preview = item.preview;
  if (typeof preview?.prepare !== "function")
    return { done: false, message: "Forhåndsvisningen har ingen `prepare()`, så ingenting gjør sprite-id-en om til et bilde." };

  const select: Record<string, string> = preview.select ?? {};
  const spriteKey = Object.keys(select).find((k) => select[k] === "sprite");
  if (!spriteKey) return { done: false, message: "`preview.select` henter ikke `sprite`-feltet." };

  // Feed prepare() the kind of values select would give it.
  const sample: Record<string, unknown> = {};
  for (const [key, path] of Object.entries(select))
    sample[key] = path === "sprite" ? "axe" : path === "kind" ? "weapon" : path === "name" ? "Testbladet" : undefined;

  try {
    const media = preview.prepare(sample)?.media;
    const drawable =
      isValidElement(media) || typeof media === "function" || (typeof media === "object" && media && "$$typeof" in media);
    if (!drawable) return { done: false, message: "`prepare()` returnerer ikke `media` som noe React kan tegne." };
  } catch (err) {
    return { done: false, message: `\`prepare()\` krasjet: ${errorText(err)}` };
  }
  return { done: true, message: "Brann kjenner igjen bladene sine med ett blikk." };
}

// --- Laugets lov -----------------------------------------------------------------

type Recorded = { fn: (value: unknown, context: unknown) => unknown; level: "error" | "warning" | "info" };

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

// Runs a `validation` function against a stand-in Rule that records every
// `custom()` and `required()` rule (and whether it's demoted to a warning), so
// we can call them with test documents.
function recordRules(validation: unknown): Recorded[] {
  const recorded: Recorded[] = [];
  const chain = (own: Recorded[]): any =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") return undefined;
          const add = (fn: Recorded["fn"]) => {
            const rule: Recorded = { fn, level: "error" };
            recorded.push(rule);
            own.push(rule);
            return chain(own);
          };
          if (prop === "custom") return (fn: Recorded["fn"]) => add(fn);
          if (prop === "required") return () => add((v) => (isEmpty(v) ? "Påkrevd" : true));
          if (prop === "error" || prop === "warning" || prop === "info")
            return () => {
              own.forEach((r) => (r.level = prop));
              return chain(own);
            };
          return () => chain(own);
        },
      },
    );
  const rule = new Proxy({}, { get: (_t, prop) => chain([])[prop] });
  for (const v of Array.isArray(validation) ? validation : [validation]) {
    if (typeof v === "function") v(rule);
  }
  return recorded;
}

const isInvalid = (result: unknown): boolean =>
  result === false ||
  typeof result === "string" ||
  (Array.isArray(result) ? result.some(isInvalid) : typeof result === "object" && result !== null && "message" in result);

type TestDoc = { name: string; kind: string; sprite?: string };

// Validates a test document the way the Studio would: every field's rules with
// that field's value, plus document-level rules with the whole document.
async function judge(test: TestDoc): Promise<{ refused: boolean; warned: boolean }> {
  const document: Record<string, unknown> = { _id: "drafts.winter-quest-check", _type: "item", ...test };
  let refused = false;
  let warned = false;
  const run = async (rules: Recorded[], value: unknown, path: string[], type: unknown) => {
    const context = {
      document,
      parent: document,
      path,
      type,
      getClient: (opts?: { apiVersion?: string }) => client!.withConfig({ apiVersion: opts?.apiVersion ?? "2024-01-01" }),
      i18n: { t: (key: string) => key },
      environment: "studio",
    };
    for (const r of rules) {
      if (!isInvalid(await r.fn(value, context))) continue;
      if (r.level === "error") refused = true;
      else warned = true;
    }
  };
  for (const f of item?.fields ?? []) await run(recordRules(f.validation), document[f.name], [f.name], f);
  await run(recordRules(item?.validation), document, [], item);
  return { refused, warned };
}

async function checkGuildLaw(): Promise<Verdict> {
  if (!item) return { done: false, message: NO_ITEM };
  if (!field("name") || !field("sprite"))
    return { done: false, message: "Gjenstander mangler `name`- eller `sprite`-feltet. Spillet trenger begge." };
  if (!client)
    return { done: false, message: "Ingen Sanity-prosjekt i `.env.local`, så Brann kan ikke lete etter like navn. Kjør `npm run setup`." };

  const fresh = () => `Stillebladet ${Math.floor(1000 + Math.random() * 9000)}`;
  const only = (r: { warned: boolean }, what: string) =>
    r.warned ? `${what} får bare en advarsel. Lauget vil at det skal nektes.` : null;

  try {
    const bare = await judge({ name: fresh(), kind: "weapon" });
    if (!bare.refused)
      return {
        done: false,
        message: only(bare, "Et våpen uten sprite") ?? "Tegnebordet godtar fortsatt et våpen uten sprite.",
      };
    if ((await judge({ name: fresh(), kind: "material" })).refused)
      return { done: false, message: "Regelen din nekter også et materiale uten sprite. Det er bare våpen som må ha en." };
    if ((await judge({ name: fresh(), kind: "weapon", sprite: "axe" })).refused)
      return { done: false, message: "Regelen din nekter et helt vanlig våpen med sprite og et nytt navn." };

    const existing = await client.fetch<string | null>(`*[_type == "item" && defined(name)][0].name`);
    if (!existing)
      return { done: false, message: "Publiser minst én gjenstand først, så Brann har et navn å teste tvillinger mot." };
    const twin = await judge({ name: existing, kind: "weapon", sprite: "axe" });
    if (!twin.refused)
      return {
        done: false,
        message: only(twin, `Et blad nummer to med navnet «${existing}»`) ?? `Tegnebordet godtar fortsatt et blad nummer to med navnet «${existing}».`,
      };
  } catch (err) {
    return { done: false, message: `En valideringsregel krasjet: ${errorText(err)}` };
  }
  return { done: true, message: "Laugets lov holder: ingen våpen uten utseende, ingen tvillinger." };
}

// --- Tegnebrettet ----------------------------------------------------------------

function checkDrawingBoard(): Verdict {
  const sprite = field("sprite");
  if (!sprite) return { done: false, message: "Brann finner ikke `sprite`-feltet. Spillet leser det, så behold navnet." };
  if (!sprite.components?.input) return { done: false, message: "Sprite-feltet bruker fortsatt standard-inputen." };
  return { done: true, message: "Et ordentlig tegnebrett. Brann er fornøyd." };
}

// --- Prøvestua -------------------------------------------------------------------

// A stand-in Structure Builder that accepts any chain of calls and remembers them.
function recordStructure() {
  const calls: { name: string; args: unknown[] }[] = [];
  const node = (name: string): any =>
    new Proxy(function () {}, {
      get: (_t, prop) => (prop === "then" || typeof prop === "symbol" ? undefined : node(prop)),
      apply: (_t, _this, args) => {
        calls.push({ name, args });
        return node(`${name}()`);
      },
    });
  return { S: node("S"), calls };
}

function checkProvingRoom(): Verdict {
  const structure = (cfg.plugins ?? []).find((p: any) => p?.name === "sanity/structure");
  const resolve = structure?.tools?.[0]?.options?.defaultDocumentNode;
  if (typeof resolve !== "function")
    return { done: false, message: "Brann finner ingen `defaultDocumentNode` på Structure-verktøyet ditt." };
  const { S, calls } = recordStructure();
  try {
    resolve(S, { schemaType: "item", documentId: "winter-quest-check" });
  } catch (err) {
    return { done: false, message: `\`defaultDocumentNode\` krasjet: ${errorText(err)}` };
  }
  const view = calls.some(
    (c) => c.name === "component" && c.args.some((a) => typeof a === "function" || (typeof a === "object" && a)),
  );
  if (!view) return { done: false, message: "Gjenstander har ingen komponentvisning ennå." };
  return { done: true, message: "Prøvestua står klar. Brann vil se hvert eneste blad der inne." };
}

// --- run -------------------------------------------------------------------------

const QUESTS: { id: string; title: string; run: () => Verdict | Promise<Verdict> }[] = [
  { id: "branns-ledger", title: "Branns protokoll", run: checkLedger },
  { id: "the-guilds-law", title: "Laugets lov", run: checkGuildLaw },
  { id: "the-drawing-board", title: "Tegnebrettet", run: checkDrawingBoard },
  { id: "the-proving-room", title: "Prøvestua", run: checkProvingRoom },
];

const color = (code: number) => (s: string) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = color(32);
const dim = color(2);
const amber = color(33);

const checks: Record<string, Verdict & { checkedAt: string }> = {};
console.log(`\n${amber("Brann ser over arbeidet ditt…")}\n`);
for (const quest of QUESTS) {
  let verdict: Verdict;
  try {
    verdict = await quest.run();
  } catch (err) {
    verdict = { done: false, message: `Selve sjekken feilet: ${errorText(err)}` };
  }
  checks[quest.id] = { ...verdict, checkedAt: new Date().toISOString() };
  console.log(`${verdict.done ? green("✓") : "·"} ${quest.title.padEnd(18)} ${verdict.done ? verdict.message : dim(verdict.message)}`);
}

mkdirSync(".quest", { recursive: true });
writeFileSync(join(".quest", "results.json"), JSON.stringify({ checks }, null, 2) + "\n");
console.log(`\n${dim("Gå tilbake til spillet og trykk")} Sjekk smia ${dim("(eller oppdateringsknappen), så ser Brann resultatet.")}\n`);
