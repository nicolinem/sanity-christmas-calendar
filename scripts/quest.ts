// The checker for code doors: `npm run quest`
//
// Repo-based quests are judged here. This script loads your Studio config the
// same way the Studio does (it runs through `sanity exec`, so .tsx schemas
// work), tries what you built, and writes verdicts to .quest/results.json.
// The game reads that file when you press "Sjekk på nytt" or refresh.
//
// It inspects behaviour, not code style: any solution that works, passes.
// Verdicts are Norwegian because the game shows them to the player.

/* eslint-disable @typescript-eslint/no-explicit-any -- this file pokes at user-written config */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import config from "../sanity.config";

type Verdict = { done: boolean; message: string };

// --- setup ---------------------------------------------------------------------

const cfg = config as any;

const errorText = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

// Luke 2 (icon and preview) is checked in the game's code window, not here:
// src/components/hud/codeWindow/tasks/preview.tsx.

// Luke 3 (validation) is checked in the game's code window, not here:
// src/components/hud/codeWindow/tasks/validation.tsx.

// Luke 4 (custom input) is checked in the game's code window, not here:
// src/components/hud/codeWindow/tasks/drawingBoard.tsx.

// --- Luke 5: document view -------------------------------------------------------------------

// A stand-in Structure Builder that accepts any chain of calls and remembers them.
function recordStructure() {
  const calls: { name: string; args: unknown[] }[] = [];
  const node = (name: string): any =>
    new Proxy(function () {}, {
      get: (_t, prop) =>
        prop === "then" || typeof prop === "symbol" ? undefined : node(prop),
      apply: (_t, _this, args) => {
        calls.push({ name, args });
        return node(`${name}()`);
      },
    });
  return { S: node("S"), calls };
}

function checkProvingRoom(): Verdict {
  const structure = (cfg.plugins ?? []).find(
    (p: any) => p?.name === "sanity/structure",
  );
  const resolve = structure?.tools?.[0]?.options?.defaultDocumentNode;
  if (typeof resolve !== "function")
    return {
      done: false,
      message: "Fant ingen `defaultDocumentNode` på `structureTool()`.",
    };
  const { S, calls } = recordStructure();
  try {
    resolve(S, { schemaType: "item", documentId: "winter-quest-check" });
  } catch (err) {
    return {
      done: false,
      message: `\`defaultDocumentNode\` krasjet: ${errorText(err)}`,
    };
  }
  const view = calls.some(
    (c) =>
      c.name === "component" &&
      c.args.some(
        (a) => typeof a === "function" || (typeof a === "object" && a),
      ),
  );
  if (!view)
    return {
      done: false,
      message: "`item` har ingen `S.view.component` ennå.",
    };
  // A views list replaces the default one, so dropping `S.view.form()` leaves nothing to edit with.
  if (!calls.some((c) => c.name === "form"))
    return {
      done: false,
      message:
        "Fanene dine mangler skjemaet. Ta med `S.view.form()` først i lista.",
    };
  return { done: true, message: "Items har en egen fane i Studio." };
}

// --- run -------------------------------------------------------------------------

const QUESTS: {
  id: string;
  title: string;
  run: () => Verdict | Promise<Verdict>;
}[] = [{ id: "the-proving-room", title: "Luke 5", run: checkProvingRoom }];

const color = (code: number) => (s: string) =>
  process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
const green = color(32);
const dim = color(2);
const amber = color(33);

const checks: Record<string, Verdict & { checkedAt: string }> = {};
console.log(`\n${amber("Sjekker lukene…")}\n`);
for (const quest of QUESTS) {
  let verdict: Verdict;
  try {
    verdict = await quest.run();
  } catch (err) {
    verdict = {
      done: false,
      message: `Selve sjekken feilet: ${errorText(err)}`,
    };
  }
  checks[quest.id] = { ...verdict, checkedAt: new Date().toISOString() };
  // The game styles *terms*; the terminal just shows the words.
  const message = verdict.message.replace(/\*([^*]+)\*/g, "$1");
  console.log(
    `${verdict.done ? green("✓") : "·"} ${quest.title.padEnd(8)} ${verdict.done ? message : dim(message)}`,
  );
}

mkdirSync(".quest", { recursive: true });
writeFileSync(
  join(".quest", "results.json"),
  JSON.stringify({ checks }, null, 2) + "\n",
);
console.log(
  `\n${dim("Gå tilbake til spillet og trykk")} Sjekk på nytt ${dim("(eller oppdateringsknappen).")}\n`,
);
