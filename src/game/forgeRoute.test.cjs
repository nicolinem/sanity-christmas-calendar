/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");
const recipes = require("./recipes.ts");
const routeSource = readFileSync(
  `${__dirname}/../app/api/forge/route.ts`,
  "utf8",
);

function load({ token = "test-token", client = null } = {}) {
  const created = [];
  let commits = 0;
  const mod = { exports: {} };
  vm.runInNewContext(
    transform(routeSource, { transforms: ["typescript", "imports"] }).code,
    {
      module: mod,
      exports: mod.exports,
      URL,
      Response,
      console,
      process: { env: token ? { SANITY_AUTH_TOKEN: token } : {} },
      require: (id) =>
        ({
          "@/sanity/client": { getSanityClient: () => client },
          "@/sanity/env": {
            projectId: "test-project",
            dataset: "test",
            apiVersion: "test",
          },
          "@/game/recipes": recipes,
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
  return { route: mod.exports, created, commits: () => commits };
}

const request = (origin = "https://game.example") => ({
  url: "https://game.example/api/forge",
  headers: { get: () => origin },
});

test("forge seed creates the two recipes with keyed ingredients", async () => {
  const { route, created, commits } = load();
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal(commits(), 1);
  assert.deepEqual(
    created.map(({ _id, _type }) => [_id, _type]),
    [
      ["recipe-isskjold", "recipe"],
      ["recipe-ishjelm", "recipe"],
    ],
  );
  const shield = created[0];
  assert.equal(shield.gear, "extra:shield");
  assert.deepEqual(
    shield.ingredients.map(({ _key, material, count }) => [
      _key,
      material,
      count,
    ]),
    [
      ["malm", "malm", 4],
      ["isskar", "isskar", 2],
    ],
  );
});

test("forge seed rejects cross-origin requests and a missing token", async () => {
  const a = load();
  assert.equal(
    (await a.route.POST(request("https://other.example"))).status,
    403,
  );
  assert.equal(a.commits(), 0);
  const b = load({ token: "" });
  assert.equal((await b.route.POST(request())).status, 503);
});

test("GET without a client is not configured", async () => {
  const { route } = load();
  assert.deepEqual(await (await route.GET()).json(), {
    configured: false,
    forgings: [],
    recipes: [],
  });
});

test("GET passes a forging without a recipe on unchanged", async () => {
  const forging = { _id: "f1", name: "Hjelm", recipe: null };
  const client = {
    fetch: async (query) => (query.includes('"forging"') ? [forging] : []),
  };
  const { route } = load({ client });
  const body = await (await route.GET()).json();
  assert.equal(body.configured, true);
  assert.deepEqual(body.forgings, [forging]);
  assert.deepEqual(body.recipes, []);
});

test("GET reports fetch_failed", async () => {
  const client = {
    fetch: async () => {
      throw new Error("x");
    },
  };
  const { route } = load({ client });
  assert.deepEqual(await (await route.GET()).json(), {
    configured: true,
    forgings: [],
    recipes: [],
    error: "fetch_failed",
  });
});
