/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");
const { SAMPLE_ORDERS } = require("./bakery.ts");

const created = [];
let commits = 0;
const mod = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(`${__dirname}/../app/api/bakery/route.ts`, "utf8"), {
    transforms: ["typescript", "imports"],
  }).code,
  {
    module: mod,
    exports: mod.exports,
    URL,
    Response,
    console,
    process: { env: { SANITY_AUTH_TOKEN: "test-token" } },
    require: (id) =>
      ({
        "@/sanity/client": { getSanityClient: () => null },
        "@/sanity/env": {
          projectId: "test-project",
          dataset: "test",
          apiVersion: "test",
        },
        "@/game/bakery": { SAMPLE_ORDERS },
        "next-sanity": {
          createClient: () => ({
            transaction: () => ({
              createIfNotExists: (doc) => created.push(doc),
              commit: async () => {
                commits++;
              },
            }),
          }),
        },
      })[id],
  },
);

test("bakery seed rejects cross-origin requests", async () => {
  const response = await mod.exports.POST({
    url: "https://game.example/api/bakery",
    headers: { get: () => "https://other.example" },
  });
  assert.equal(response.status, 403);
  assert.equal(commits, 0);
});

test("bakery seed uses createIfNotExists for exactly three inert sample orders", async () => {
  const response = await mod.exports.POST({
    url: "https://game.example/api/bakery",
    headers: { get: () => "https://game.example" },
  });
  assert.equal(response.status, 200);
  assert.equal(commits, 1);
  assert.deepEqual(
    created.map((doc) => doc._id),
    SAMPLE_ORDERS.map((doc) => doc._id),
  );
  assert.ok(created.every((doc) => doc.orderedBy && doc.status === "venter"));
});
