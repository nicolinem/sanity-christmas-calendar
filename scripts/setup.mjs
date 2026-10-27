#!/usr/bin/env node
// Connects your clone of Winter Quest to your own Sanity project.
//
//   npm run setup                     create a project, no account needed
//   npm run setup -- --project <id>   use a project you already have
//   npm run setup -- --cors           after claiming: allow the Studio on more ports
//
// Every player gets their own project, so you own everything in it: content,
// schema and Studio. The game only ever reads published content.
//
// No dependencies on purpose: this has to run on a fresh clone.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";
import { resolve } from "node:path";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const API_VERSION = "2024-01-01";
const STUDIO_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[22m`,
  dim: (s) => `\x1b[2m${s}\x1b[22m`,
  amber: (s) => `\x1b[33m${s}\x1b[39m`,
  cyan: (s) => `\x1b[36m${s}\x1b[39m`,
  red: (s) => `\x1b[31m${s}\x1b[39m`,
  green: (s) => `\x1b[32m${s}\x1b[39m`,
};
const say = (s = "") => console.log(s);
const fail = (s) => {
  console.error(`\n${c.red("✗")} ${s}\n`);
  process.exit(1);
};

// --- env file -----------------------------------------------------------------

function readEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const COMMENTS = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: "Your Sanity project. Not secret: it's part of the public API URL.",
  SANITY_AUTH_TOKEN:
    "SECRET. Lets the Sanity CLI act on the project until you claim it and run `sanity login`.\n# Never rename it to NEXT_PUBLIC_*, that would ship it to every browser.",
  SANITY_CLAIM_URL: "SECRET. Whoever opens this link becomes the owner. Claim it before the date below.",
};

// Updates keys in place and appends new ones, keeping anything else the
// player has put in the file. A null value removes the key and its comment.
function writeEnv(values) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split("\n") : [];
  const pending = new Map(Object.entries(values));
  const out = [];
  for (const line of lines) {
    const key = line.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1];
    if (!key || !pending.has(key)) {
      out.push(line);
      continue;
    }
    const v = pending.get(key);
    pending.delete(key);
    if (v !== null) {
      out.push(`${key}=${v}`);
      continue;
    }
    while (out.length && out[out.length - 1].startsWith("#")) out.pop();
  }
  for (const [key, v] of pending) if (v === null) pending.delete(key);
  if (out.length === 0) out.push("# Written by `npm run setup`. Gitignored; keep it that way.");
  for (const [key, v] of pending) {
    if (COMMENTS[key]) out.push("", `# ${COMMENTS[key]}`);
    out.push(`${key}=${v}`);
  }
  writeFileSync(ENV_FILE, out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");
}

// --- helpers ------------------------------------------------------------------

function checkNode() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) {
    fail(`The Sanity CLI needs Node.js 22.12 or newer. You have ${process.versions.node}.`);
  }
}

function sanity(args, { capture = false, env = {} } = {}) {
  return spawnSync("npx", ["--yes", "sanity@latest", ...args], {
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

// The game reads published content without a token, so the dataset must be public.
async function checkPublicRead(projectId, dataset) {
  const url = `https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent("count(*)")}`;
  try {
    const res = await fetch(url);
    if (res.ok) return "ok";
    if (res.status === 401 || res.status === 403) return "private";
    if (res.status === 404) return "missing";
    return `http ${res.status}`;
  } catch {
    return "offline";
  }
}

function explainRead(result, projectId, dataset) {
  if (result === "ok") {
    say(`${c.green("✓")} The game can read published content from ${c.bold(`${projectId}/${dataset}`)}.`);
    return;
  }
  if (result === "private") {
    say(`${c.amber("!")} Dataset ${c.bold(dataset)} is private, so the game can't read it. Make it public:`);
    say(`  ${c.cyan(`npx sanity@latest datasets visibility set ${dataset} public`)}`);
  } else if (result === "missing") {
    say(`${c.amber("!")} Couldn't find dataset ${c.bold(dataset)} in project ${c.bold(projectId)}. Check both values in .env.local.`);
  } else {
    say(`${c.amber("!")} Couldn't check the project (${result}). The game will tell you if it can't fetch items.`);
  }
}

function formatDeadline(iso) {
  const d = new Date(iso);
  const hours = Math.round((d.getTime() - Date.now()) / 36e5);
  const when = d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return hours > 0 ? `${when} (in about ${hours} h)` : `${when} (passed)`;
}

function studioSignInUrl(token, claimUrl) {
  // An unclaimed project has no users, so the Studio signs in with the token in
  // the URL hash. Only localhost:3000 (and 3333) are allowed before claiming.
  return `http://localhost:3000/studio#token=${encodeURIComponent(token)}&claim=${encodeURIComponent(claimUrl)}`;
}

function nextSteps() {
  // Setup runs fine without dependencies (it fetches the Sanity CLI itself),
  // so a fresh clone can get here before `npm install`.
  const installed = existsSync(resolve(process.cwd(), "node_modules", "next"));
  const steps = [
    ...(installed ? [] : [`${c.cyan("npm install")}  ${c.dim("(the game's dependencies aren't installed yet)")}`]),
    `${c.cyan("npm run dev")}  ${c.dim("(on port 3000, the only one allowed until you claim)")}`,
    `Open ${c.cyan("http://localhost:3000")}, find Brann at the forge and press ${c.bold("E")}.`,
  ];
  say();
  say(c.bold("Next"));
  steps.forEach((step, i) => say(`  ${i + 1}. ${step}`));
  say();
}

// --- commands -----------------------------------------------------------------

async function createProject() {
  const name = `Winter Quest (${userInfo().username})`;
  say(`Creating ${c.bold(name)} on Sanity. No account needed…`);
  const run = sanity(["new", name, "--json", "--yes"], { capture: true });
  if (run.status !== 0) fail("`sanity new` didn't finish. See the message above.");

  let project;
  try {
    project = JSON.parse(run.stdout.slice(run.stdout.indexOf("{")));
  } catch {
    fail("Couldn't read the project details from `sanity new`. Run `npx sanity@latest projects unclaimed` to recover them.");
  }
  const { projectId, dataset, token, claimUrl, expiresAt } = project;
  if (!projectId || !dataset || !token || !claimUrl) fail("`sanity new` returned incomplete project details.");

  writeEnv({
    NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
    NEXT_PUBLIC_SANITY_DATASET: dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: API_VERSION,
    SANITY_AUTH_TOKEN: token,
    SANITY_CLAIM_URL: claimUrl,
    SANITY_CLAIM_EXPIRES: expiresAt,
  });

  say(`${c.green("✓")} Project ${c.bold(projectId)} created and saved to .env.local.`);
  explainRead(await checkPublicRead(projectId, dataset), projectId, dataset);
  printClaim(claimUrl, expiresAt);
  say(c.bold("Sign in to your Studio"));
  say(`  Start the game, then open this once. It holds your project's access token, so keep it private:`);
  say(`  ${c.cyan(studioSignInUrl(token, claimUrl))}`);
  nextSteps();
}

function printClaim(claimUrl, expiresAt) {
  say();
  say(c.bold(c.amber("Claim your project, or it's deleted")));
  say(`  ${c.cyan(claimUrl)}`);
  say(`  Deadline: ${formatDeadline(expiresAt)}. Free, about a minute, needs a Sanity account.`);
  say(`  ${c.dim("Treat the link like a password: whoever opens it owns the project. Don't paste it into chats.")}`);
  say();
}

async function connectProject(projectId, dataset) {
  if (!/^[a-z0-9]+$/.test(projectId)) fail(`"${projectId}" doesn't look like a Sanity project ID.`);
  // A token or claim link from an earlier project would now point at the wrong one.
  writeEnv({
    NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
    NEXT_PUBLIC_SANITY_DATASET: dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: API_VERSION,
    SANITY_AUTH_TOKEN: null,
    SANITY_CLAIM_URL: null,
    SANITY_CLAIM_EXPIRES: null,
  });
  say(`${c.green("✓")} Saved project ${c.bold(projectId)} (${dataset}) to .env.local.`);
  explainRead(await checkPublicRead(projectId, dataset), projectId, dataset);
  say();
  say(`Allow the Studio to talk to your project from this app (needs ${c.cyan("npx sanity@latest login")} first):`);
  for (const origin of STUDIO_ORIGINS) say(`  ${c.cyan(`npx sanity@latest cors add ${origin} --credentials`)}`);
  say(`${c.dim("Or run")} ${c.cyan("npm run setup -- --cors")} ${c.dim("to do both.")}`);
  nextSteps();
}

function addCors(env) {
  if (!env.NEXT_PUBLIC_SANITY_PROJECT_ID) fail("No project in .env.local yet. Run `npm run setup` first.");
  say(`Allowing the Studio on ${STUDIO_ORIGINS.join(" and ")} for project ${c.bold(env.NEXT_PUBLIC_SANITY_PROJECT_ID)}…`);
  for (const origin of STUDIO_ORIGINS) {
    const run = sanity(["cors", "add", origin, "--credentials", "--project-id", env.NEXT_PUBLIC_SANITY_PROJECT_ID]);
    if (run.status !== 0) {
      say(`${c.amber("!")} Couldn't add ${origin}. If the project isn't claimed yet, claim it first, then try again.`);
    }
  }
  say();
}

async function status(env) {
  const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset = "production" } = env;
  say(`${c.green("✓")} Already connected to project ${c.bold(projectId)} (${dataset}).`);
  explainRead(await checkPublicRead(projectId, dataset), projectId, dataset);
  if (env.SANITY_CLAIM_URL && env.SANITY_CLAIM_EXPIRES) {
    printClaim(env.SANITY_CLAIM_URL, env.SANITY_CLAIM_EXPIRES);
    say(`${c.dim("Claimed already? Delete the SANITY_CLAIM_* lines from .env.local, then run")} ${c.cyan("npm run setup -- --cors")}${c.dim(".")}`);
    if (env.SANITY_AUTH_TOKEN) {
      say();
      say(c.bold("Studio sign-in link"));
      say(`  ${c.cyan(studioSignInUrl(env.SANITY_AUTH_TOKEN, env.SANITY_CLAIM_URL))}`);
    }
  }
  say();
  say(`${c.dim("Start over with a different project:")} ${c.cyan("npm run setup -- --project <id>")}`);
  nextSteps();
}

// --- main ---------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : (args[i + 1] ?? "");
};

checkNode();
say();
say(c.bold("❄  Winter Quest setup"));
say();

const env = readEnv();
if (args.includes("--cors")) addCors(env);
else if (flag("--project") !== undefined) await connectProject(flag("--project"), flag("--dataset") || "production");
else if (env.NEXT_PUBLIC_SANITY_PROJECT_ID) await status(env);
else await createProject();
