/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");
const {
  APPRENTICE_ITEM_ID,
  APPRENTICE_MISTAKE,
  BRANN_HAMMER,
} = require("./apprentice.ts");

let existing = null;
const writes = [];
const mod = { exports: {} };
vm.runInNewContext(
  transform(
    readFileSync(`${__dirname}/../app/api/apprentice/route.ts`, "utf8"),
    {
      transforms: ["typescript", "imports"],
    },
  ).code,
  {
    module: mod,
    exports: mod.exports,
    URL,
    Response,
    console,
    process: { env: { SANITY_AUTH_TOKEN: "test-token" } },
    require: (id) =>
      ({
        "@/sanity/env": {
          projectId: "test-project",
          dataset: "test",
          apiVersion: "test",
        },
        "@/game/apprentice": {
          APPRENTICE_ITEM_ID,
          APPRENTICE_MISTAKE,
          BRANN_HAMMER,
        },
        "next-sanity": {
          createClient: () => ({
            getDocument: async () => existing,
            create: async (doc) => writes.push(["create", doc]),
            patch: (id) => ({
              set: (fields) => ({
                commit: async () => writes.push(["patch", id, fields]),
              }),
            }),
          }),
        },
      })[id],
  },
);

const request = (origin = "https://game.example") => ({
  url: "https://game.example/api/apprentice",
  headers: { get: () => origin },
});

test("apprentice seed rejects cross-origin requests", async () => {
  const response = await mod.exports.POST(request("https://other.example"));
  assert.equal(response.status, 403);
  assert.equal(writes.length, 0);
});

test("apprentice seed writes two published revisions once", async () => {
  const response = await mod.exports.POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(writes, [
    ["create", BRANN_HAMMER],
    ["patch", APPRENTICE_ITEM_ID, APPRENTICE_MISTAKE],
  ]);

  existing = BRANN_HAMMER;
  await mod.exports.POST(request());
  assert.equal(
    writes.length,
    2,
    "an existing hammer must never be overwritten",
  );
});
