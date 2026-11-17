/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");
const archive = require("./archive.ts");

const created = [];
let commits = 0;
const mod = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(`${__dirname}/../app/api/archive/route.ts`, "utf8"), {
    transforms: ["typescript", "imports"],
  }).code,
  {
    module: mod,
    exports: mod.exports,
    Buffer,
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
        "@/game/archive": archive,
        "next-sanity": {
          createClient: () => ({
            assets: { upload: async () => ({ _id: "image-footprints" }) },
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

const request = (origin = "https://game.example") => ({
  url: "https://game.example/api/archive",
  headers: { get: () => origin },
});

test("archive seed rejects cross-origin requests", async () => {
  const response = await mod.exports.POST(request("https://other.example"));
  assert.equal(response.status, 403);
  assert.equal(commits, 0);
});

test("archive seed creates five unknown clues without overwriting", async () => {
  const response = await mod.exports.POST(request());
  assert.equal(response.status, 200);
  assert.equal(commits, 1);
  const clues = created.filter(({ _type }) => _type === "observation");
  assert.equal(clues.length, 5);
  assert.ok(clues.every(({ status }) => status === "unknown"));
  const clueC = clues.find(({ _id }) => _id === "archive-c");
  assert.equal(clueC.place, undefined);
  assert.equal(clueC.placeNote, "bakriet");
});
