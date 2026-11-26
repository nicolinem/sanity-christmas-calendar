/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");
const progressMerge = require("./quests/progressMerge.ts");
const { EMPTY_PROGRESS, PROGRESS_DOC_ID, PROGRESS_DOC_TYPE } = progressMerge;

let doc = null;
const writes = [];

function loadRoute(env) {
  const mod = { exports: {} };
  vm.runInNewContext(
    transform(
      readFileSync(`${__dirname}/../app/api/progress/route.ts`, "utf8"),
      { transforms: ["typescript", "imports"] },
    ).code,
    {
      module: mod,
      exports: mod.exports,
      URL,
      Response,
      JSON,
      console,
      process: { env },
      require: (id) =>
        ({
          "@/sanity/env": {
            projectId: "test-project",
            dataset: "test",
            apiVersion: "test",
          },
          "@/game/quests/progressMerge": progressMerge,
          "next-sanity": {
            createClient: () => ({
              getDocument: async (id) => (id === PROGRESS_DOC_ID ? doc : null),
              createOrReplace: async (next) => {
                writes.push(next);
                doc = next;
              },
            }),
          },
        })[id],
    },
  );
  return mod.exports;
}

const route = loadRoute({ SANITY_AUTH_TOKEN: "test-token" });

const request = (body, origin = "https://game.example") => ({
  url: "https://game.example/api/progress",
  headers: { get: () => origin },
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

const AT = "2026-12-01T10:00:00.000Z";
const LATER = "2026-12-02T10:00:00.000Z";

test("the progress backup rejects other origins, no token and bad bodies", async () => {
  const player = { ...EMPTY_PROGRESS, savedAt: AT };
  assert.equal(
    (await route.POST(request(player, "https://other.example"))).status,
    403,
  );
  assert.equal((await route.POST(request(player, null))).status, 403);
  const untokened = loadRoute({});
  assert.equal((await untokened.POST(request(player))).status, 503);
  for (const bad of ["not json", "[]", "null", "x".repeat(300_000)])
    assert.equal((await route.POST(request(bad))).status, 400);
  assert.equal(writes.length, 0);
});

test("the first backup is one hidden document in the player's project", async () => {
  const player = {
    ...EMPTY_PROGRESS,
    trackChosen: true,
    completed: { "first-weapon": AT },
    savedAt: AT,
  };
  const response = await route.POST(request(player));
  assert.equal(response.status, 200);
  assert.equal(writes.length, 1);
  assert.equal(doc._id, PROGRESS_DOC_ID);
  // A dot in the id: a public dataset doesn't show it without a token.
  assert.match(doc._id, /\./);
  assert.equal(doc._type, PROGRESS_DOC_TYPE);
  assert.equal(doc.savedAt, AT);
  assert.deepEqual(JSON.parse(doc.progress).completed, {
    "first-weapon": AT,
  });
  const { progress } = await response.json();
  assert.deepEqual(progress.completed, { "first-weapon": AT });
});

test("a copy with less on it never takes finished lukes out of the backup", async () => {
  writes.length = 0;
  const otherBrowser = {
    ...EMPTY_PROGRESS,
    trackChosen: true,
    completed: { "second-weapon": LATER },
    hints: { "second-weapon": 1 },
    savedAt: LATER,
  };
  const response = await route.POST(request(otherBrowser));
  const { progress } = await response.json();
  assert.deepEqual(progress.completed, {
    "first-weapon": AT,
    "second-weapon": LATER,
  });
  assert.deepEqual(JSON.parse(doc.progress).completed, progress.completed);
  assert.equal(writes.length, 1);

  // The same copy again changes nothing, so nothing is written.
  await route.POST(request(progress));
  assert.equal(writes.length, 1);
});

test("a broken backup is replaced by the game's copy", async () => {
  writes.length = 0;
  doc = { ...doc, progress: "{broken" };
  const player = { ...EMPTY_PROGRESS, introSeen: true, savedAt: LATER };
  assert.equal((await route.POST(request(player))).status, 200);
  assert.equal(JSON.parse(doc.progress).introSeen, true);
});
