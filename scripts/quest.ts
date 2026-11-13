// Optional repo-based quest checks. Week one currently has no active checks here.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Verdict = { done: boolean; message: string };

const errorText = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

const QUESTS: {
  id: string;
  title: string;
  run: () => Verdict | Promise<Verdict>;
}[] = [];

const color = (code: number) => (s: string) =>
  process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
const green = color(32);
const dim = color(2);
const amber = color(33);

const checks: Record<string, Verdict & { checkedAt: string }> = {};
console.log(
  QUESTS.length
    ? `\n${amber("Sjekker repo-oppgavene…")}\n`
    : `\n${dim("Ingen aktive repo-oppgaver å sjekke.")}\n`,
);
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
