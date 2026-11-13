/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const path = require("node:path");
const vm = require("node:vm");
const { transform } = require("sucrase");

// «Hvem peker hit?»: the player's document view is rendered for two places
// against the real practice dataset. Our solution passes; the starter and the
// usual mistakes don't.

const root = path.join(__dirname, "../../../../..");
const cache = {};
function load(file) {
  const full = path.join(root, file);
  if (cache[full]) return cache[full];
  const mod = { exports: {} };
  cache[full] = mod.exports;
  const code = transform(readFileSync(full, "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code;
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    setTimeout,
    require(name) {
      if (name === "@/game/archive") return load("src/game/archive.ts");
      if (name.endsWith("?raw")) return { __esModule: true, default: "" };
      if (name.startsWith("./") || name.startsWith("../")) {
        const base = path.join(path.dirname(file), name);
        for (const ext of [".ts", ".tsx"])
          try {
            readFileSync(path.join(root, base + ext));
            return load(base + ext);
          } catch {}
      }
      return require(name);
    },
  });
  cache[full] = mod.exports;
  return mod.exports;
}

const dir = "src/components/hud/codeWindow/tasks";
const { judgeWhoPointsHere, whoPointsHereTask: task } = load(`${dir}/whoPointsHere.tsx`);
const { runModule } = load("src/components/hud/codeWindow/runCode.ts");

const FETCH_COMMENT = /    \/\/ Hent observasjonene[^\n]*\n    \/\/ props\.documentId[^\n]*\n/;

// The starter with the effect body replaced by `body`.
function withBody(body) {
  assert.match(task.starter, FETCH_COMMENT);
  return task.starter.replace(FETCH_COMMENT, `${body}\n`);
}

async function judge(source) {
  const loaded = runModule(source, task.modules);
  assert.equal(loaded.ok, true, loaded.message);
  return judgeWhoPointsHere(loaded.exports);
}

const labels = (v) => Object.fromEntries(v.requirements.map((r) => [r.label, r.done]));
const BAKERY = "Bakeriet viser observasjonene der";
const OWN = "Hvert sted viser sine egne";
const PARAM = "Id-en sendes som parameter";

test("our solution passes", async () => {
  const v = await judge(withBody(task.ours));
  assert.equal(v.done, true, JSON.stringify(v.requirements));
  assert.equal(JSON.stringify(v.solvedAs), "{}");
});

test("the starter passes nothing", async () => {
  const v = await judge(task.starter);
  assert.equal(v.done, false);
  assert.equal(v.requirements.filter((r) => r.done).length, 0);
  assert.match(v.requirements[0].message, /henter ingenting/);
});

test("a hard-coded place shows the bakery everywhere", async () => {
  const v = await judge(
    withBody(`client.fetch('*[_type == "observation" && references("place-bakeriet")] | order(time asc)').then(setRows)`),
  );
  assert.equal(v.done, false);
  assert.deepEqual(labels(v), { [BAKERY]: true, [OWN]: false, [PARAM]: false });
});

test("the id pasted into the query string fails the parameter check", async () => {
  const v = await judge(
    withBody(
      "client.fetch(`*[_type == \"observation\" && references(\"${props.documentId}\")]`).then(setRows)",
    ),
  );
  assert.deepEqual(labels(v), { [BAKERY]: true, [OWN]: true, [PARAM]: false });
  assert.match(v.requirements[2].message, /\{ id: props\.documentId \}/);
});

test("the displayed id can be a draft id, and the message says so", async () => {
  const v = await judge(
    withBody(
      `client.fetch('*[_type == "observation" && references($id)]', { id: props.document.displayed._id }).then(setRows)`,
    ),
  );
  assert.equal(v.done, false);
  assert.equal(labels(v)[BAKERY], false);
  assert.match(v.requirements[0].message, /draft/);
  assert.match(v.requirements[0].message, /props\.documentId/);
});

test("a missing $param is explained, a missing apiVersion too", async () => {
  const v = await judge(withBody(`client.fetch('*[references($id)]', {}).then(setRows).catch(() => {})`));
  assert.match(v.requirements[0].message, /\$id/);
  const loaded = runModule(withBody("").replace('{ apiVersion: "2024-01-01" }', "{}"), task.modules);
  const w = await judgeWhoPointsHere(loaded.exports);
  assert.match(w.requirements[0].message, /apiVersion/);
});
