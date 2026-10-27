#!/usr/bin/env node
// Release check for organizers: `npm run verify-release [-- --build]`
//
// Makes sure no solution leaks into what players clone, and that every
// reference solution still passes. Each branch is checked out into a
// temporary git worktree (your working copy is left alone):
//
//   main       the starter players clone: no code quest may pass
//   solutions  the reference solutions: every code quest must pass
//
// Both must typecheck and pass Sanity's schema check (and `next build` with
// --build). Uses your .env.local so the Guild's Law check can query the dataset.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const BUILD = process.argv.includes("--build");
const TARGETS = [
  { ref: "main", expect: "none", label: "starter" },
  { ref: "solutions", expect: "all", label: "solutions" },
];

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", env: process.env });

const git = (...args) => run("git", args, ROOT).trim();

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  ${red("✗")} ${msg}`);
};
const pass = (msg) => console.log(`  ${green("✓")} ${msg}`);

function step(name, cwd, cmd, args) {
  try {
    run(cmd, args, cwd);
    pass(name);
    return true;
  } catch (err) {
    fail(`${name}\n${dim(String(err.stdout || "") + String(err.stderr || "")).trim().split("\n").slice(-15).join("\n")}`);
    return false;
  }
}

for (const target of TARGETS) {
  console.log(`\n${target.label} (${target.ref})`);
  try {
    git("rev-parse", "--verify", "--quiet", target.ref);
  } catch {
    fail(`branch "${target.ref}" doesn't exist`);
    continue;
  }

  const dir = mkdtempSync(join(tmpdir(), `winter-quest-${target.ref}-`));
  try {
    git("worktree", "add", "--detach", dir, target.ref);
    symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"), "dir");
    if (existsSync(join(ROOT, ".env.local"))) cpSync(join(ROOT, ".env.local"), join(dir, ".env.local"));

    step("typecheck", dir, "npx", ["tsc", "--noEmit"]);
    step("Sanity schema check", dir, "npx", ["sanity", "schema", "validate"]);

    if (step("npm run quest", dir, "npx", ["sanity", "exec", "scripts/quest.ts"])) {
      const { checks } = JSON.parse(readFileSync(join(dir, ".quest", "results.json"), "utf8"));
      for (const [id, check] of Object.entries(checks)) {
        if (target.expect === "none" && check.done) fail(`${id} already passes: a solution leaked into ${target.ref}`);
        else if (target.expect === "all" && !check.done) fail(`${id} doesn't pass: ${check.message}`);
        else pass(`${id} ${dim(target.expect === "none" ? "is open" : "passes")}`);
      }
    }

    if (BUILD) step("next build", dir, "npx", ["next", "build"]);
  } catch (err) {
    fail(`couldn't check out ${target.ref}: ${err.message}`);
  } finally {
    try {
      git("worktree", "remove", "--force", dir);
    } catch {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

console.log(failures ? `\n${red(`${failures} problem(s). Don't release yet.`)}\n` : `\n${green("Ready to release.")}\n`);
process.exit(failures ? 1 : 0);
