#!/usr/bin/env node
// Release check for organizers: `npm run verify-release [-- --build]`
//
// Checks out main into a temporary git worktree (your working copy is left
// alone), the way a player gets it, and makes sure it typechecks, passes
// Sanity's schema check and the tests. With --build it also gets a clean
// `npm ci` and `next build`, like a fresh clone (slower).

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const BUILD = process.argv.includes("--build");
const TARGETS = [{ ref: "main", label: "what players clone" }];

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });

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
    fail(
      `${name}\n${dim(String(err.stdout || "") + String(err.stderr || ""))
        .trim()
        .split("\n")
        .slice(-15)
        .join("\n")}`,
    );
    return false;
  }
}

// The values every player's clone gets from src/game/release.ts.
function checkRelease(dir) {
  const file = join(dir, "src/game/release.ts");
  if (!existsSync(file)) return fail("src/game/release.ts is missing");
  const source = readFileSync(file, "utf8");
  const value = (name) => source.match(new RegExp(`${name} = "([^"]*)"`))?.[1];
  const url = value("RELEASE_COMMUNITY_URL");
  if (!url)
    fail(
      "community URL isn't set in src/game/release.ts: «Hvem er med» will be empty for everyone",
    );
  else if (!/^https:\/\/[^/]+\/api\/community$/.test(url))
    fail(`community URL should be https://<host>/api/community, not ${url}`);
  else pass(`community URL ${dim(url)}`);
  const start = value("RELEASE_CALENDAR_START");
  if (!start) fail("calendar start isn't set: every week is open from day one");
  else pass(`calendar starts ${dim(start)}`);
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
    // Quick checks borrow your node_modules. A build needs a real install
    // (Turbopack won't compile through a symlink outside the project), which
    // is also exactly what a player's fresh clone goes through.
    if (BUILD)
      step("npm ci", dir, "npm", [
        "ci",
        "--prefer-offline",
        "--no-audit",
        "--no-fund",
      ]);
    else
      symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"), "dir");
    if (existsSync(join(ROOT, ".env.local")))
      cpSync(join(ROOT, ".env.local"), join(dir, ".env.local"));

    // A fresh checkout has no .next/, where Next keeps its generated route types.
    step("generate Next route types", dir, "npx", ["next", "typegen"]);
    step("typecheck", dir, "npx", ["tsc", "--noEmit"]);
    step("Sanity schema check", dir, "npx", ["sanity", "schema", "validate"]);

    step("tests", dir, "npm", ["test"]);
    checkRelease(dir);

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

console.log(
  failures
    ? `\n${red(`${failures} problem(s). Don't release yet.`)}\n`
    : `\n${green("Ready to release.")}\n`,
);
process.exit(failures ? 1 : 0);
