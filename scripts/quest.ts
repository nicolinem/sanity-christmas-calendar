// Brann's inspection: `npm run quest`
//
// Some quests can only be judged from your code (an icon, a validation rule, a
// custom input, a Studio view). This script loads your Studio config the same
// way the Studio does (it runs through `sanity exec`, so .tsx schemas work),
// tries what you built, and writes the verdicts to .quest/results.json. The
// game reads that file when you press "Check the forge" or refresh.
//
// It inspects behaviour, not code style: any solution that works, passes.

/* eslint-disable @typescript-eslint/no-explicit-any -- this file pokes at user-written config */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SanityClient } from "@sanity/client";
import { isValidElement } from "react";
import config from "../sanity.config";
import { readName } from "../src/game/magic";

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

// --- quest 3: Brann's Ledger ---------------------------------------------------

function checkLedger(): Verdict {
  if (!item) return { done: false, message: "Brann can't find an `item` type in your schema." };
  if (!item.icon) return { done: false, message: "Items have no `icon` yet." };
  const preview = item.preview;
  if (typeof preview?.prepare !== "function")
    return { done: false, message: "The preview has no `prepare()`, so nothing turns the sprite id into a picture." };

  const select: Record<string, string> = preview.select ?? {};
  const spriteKey = Object.keys(select).find((k) => select[k] === "sprite");
  if (!spriteKey) return { done: false, message: "`preview.select` doesn't fetch the `sprite` field." };

  // Feed prepare() the kind of values select would give it.
  const sample: Record<string, unknown> = {};
  for (const [key, path] of Object.entries(select))
    sample[key] = path === "sprite" ? "axe" : path === "kind" ? "weapon" : path === "name" ? "Test Blade" : undefined;

  try {
    const media = preview.prepare(sample)?.media;
    const drawable =
      isValidElement(media) || typeof media === "function" || (typeof media === "object" && media && "$$typeof" in media);
    if (!drawable)
      return { done: false, message: "`prepare()` doesn't return `media` as something React can draw." };
  } catch (err) {
    return { done: false, message: `\`prepare()\` crashed: ${errorText(err)}` };
  }
  return { done: true, message: "Brann can tell his blades apart at a glance." };
}

// --- quest 4: The Guild's Law --------------------------------------------------

type Recorded = { fn: (value: unknown, context: unknown) => unknown; level: "error" | "warning" | "info" };

// Runs a field's `validation` against a stand-in Rule that records every
// `custom()` rule (and whether it's demoted to a warning) so we can call them.
function recordCustomRules(validation: unknown): Recorded[] {
  const recorded: Recorded[] = [];
  const chain = (own: Recorded[]): any =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") return undefined;
          if (prop === "custom")
            return (fn: Recorded["fn"]) => {
              const rule: Recorded = { fn, level: "error" };
              recorded.push(rule);
              own.push(rule);
              return chain(own);
            };
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

async function judge(name: string): Promise<{ refused: boolean; warned: boolean }> {
  const document = { _id: "drafts.winter-quest-check", _type: "item", name, kind: "weapon" };
  const context = {
    document,
    parent: document,
    path: ["name"],
    type: field("name"),
    getClient: (opts?: { apiVersion?: string }) => client!.withConfig({ apiVersion: opts?.apiVersion ?? "2024-01-01" }),
    i18n: { t: (key: string) => key },
    environment: "studio",
  };
  const fieldRules = recordCustomRules(field("name")?.validation);
  const docRules = recordCustomRules(item?.validation);
  let refused = false;
  let warned = false;
  const run = async (rules: Recorded[], value: unknown) => {
    for (const r of rules) {
      if (!isInvalid(await r.fn(value, context))) continue;
      if (r.level === "error") refused = true;
      else warned = true;
    }
  };
  await run(fieldRules, name);
  await run(docRules, document);
  return { refused, warned };
}

async function checkGuildLaw(): Promise<Verdict> {
  if (!item) return { done: false, message: "Brann can't find an `item` type in your schema." };
  if (!field("name")) return { done: false, message: "Items have no `name` field. The game still needs it." };
  if (!client)
    return { done: false, message: "No Sanity project in `.env.local`, so Brann can't look for duplicate names. Run `npm run setup`." };

  const twoElements = "Flaming Frost Blade";
  const oneElement = "Flaming Blade";
  const unique = `Quietblade ${Math.floor(1000 + Math.random() * 9000)}`;
  if (readName(twoElements).kind !== "fizzle") throw new Error("Test name no longer carries two elements; update quest.ts");

  try {
    const fizzle = await judge(twoElements);
    if (!fizzle.refused)
      return {
        done: false,
        message: fizzle.warned
          ? `"${twoElements}" only gets a warning. The Guild wants names with two elements refused.`
          : `The Studio still accepts "${twoElements}", a name with two elements.`,
      };
    if ((await judge(oneElement)).refused)
      return { done: false, message: `Your rule also refuses "${oneElement}". One element is fine.` };

    const existing = await client.fetch<string | null>(`*[_type == "item" && defined(name)][0].name`);
    if (!existing)
      return { done: false, message: "Publish at least one item first, so Brann has a name to test duplicates against." };
    const dup = await judge(existing);
    if (!dup.refused)
      return {
        done: false,
        message: dup.warned
          ? `A second "${existing}" only gets a warning. The Guild wants duplicate names refused.`
          : `The Studio still accepts a second blade called "${existing}".`,
      };
    if ((await judge(unique)).refused)
      return { done: false, message: `Your rule refuses "${unique}", a name nobody has used.` };
  } catch (err) {
    return { done: false, message: `A validation rule crashed: ${errorText(err)}` };
  }
  return { done: true, message: "The Guild's law holds: no fizzling names, no twins." };
}

// --- quest 5: The Drawing Board ------------------------------------------------

function checkDrawingBoard(): Verdict {
  const sprite = field("sprite");
  if (!sprite) return { done: false, message: "Brann can't find the `sprite` field. The game reads it, so keep that name." };
  if (!sprite.components?.input) return { done: false, message: "The sprite field still uses the default input." };
  return { done: true, message: "A proper drawing board. Brann approves." };
}

// --- quest 6: The Proving Room -------------------------------------------------

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
    return { done: false, message: "Brann can't find a `defaultDocumentNode` on your Structure tool." };
  const { S, calls } = recordStructure();
  try {
    resolve(S, { schemaType: "item", documentId: "winter-quest-check" });
  } catch (err) {
    return { done: false, message: `\`defaultDocumentNode\` crashed: ${errorText(err)}` };
  }
  const view = calls.some(
    (c) => c.name === "component" && c.args.some((a) => typeof a === "function" || (typeof a === "object" && a)),
  );
  if (!view) return { done: false, message: "Items don't get a component view yet." };
  return { done: true, message: "The proving room is ready. Brann wants to see every blade in there." };
}

// --- run -----------------------------------------------------------------------

const QUESTS: { id: string; title: string; run: () => Verdict | Promise<Verdict> }[] = [
  { id: "branns-ledger", title: "Brann's Ledger", run: checkLedger },
  { id: "the-guilds-law", title: "The Guild's Law", run: checkGuildLaw },
  { id: "the-drawing-board", title: "The Drawing Board", run: checkDrawingBoard },
  { id: "the-proving-room", title: "The Proving Room", run: checkProvingRoom },
];

const color = (code: number) => (s: string) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = color(32);
const dim = color(2);
const amber = color(33);

const checks: Record<string, Verdict & { checkedAt: string }> = {};
console.log(`\n${amber("Brann inspects your work…")}\n`);
for (const quest of QUESTS) {
  let verdict: Verdict;
  try {
    verdict = await quest.run();
  } catch (err) {
    verdict = { done: false, message: `The check itself failed: ${errorText(err)}` };
  }
  checks[quest.id] = { ...verdict, checkedAt: new Date().toISOString() };
  console.log(`${verdict.done ? green("✓") : "·"} ${quest.title.padEnd(18)} ${verdict.done ? verdict.message : dim(verdict.message)}`);
}

mkdirSync(".quest", { recursive: true });
writeFileSync(join(".quest", "results.json"), JSON.stringify({ checks }, null, 2) + "\n");
console.log(`\n${dim("Back in the game, press")} Check the forge ${dim("(or the refresh button) so Brann sees the results.")}\n`);
