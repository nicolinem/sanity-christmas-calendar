/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const path = require("node:path");
const vm = require("node:vm");
const { transform } = require("sucrase");

// Uke 2 in the code window: the GROQ trail, the Structure lists and
// Arkivarens five questions, run against the real practice dataset with the
// real groq-js. Our own answers must pass; the starters must not.

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
    require(name) {
      if (name === "@/game/archive") return load("src/game/archive.ts");
      if (name.endsWith("?raw")) return { __esModule: true, default: "" };
      if (name.endsWith("villageCanvas"))
        return {
          useVillageCanvas: () => ({ current: null }),
          VILLAGE_W: 864,
          VILLAGE_H: 480,
        };
      if (name.startsWith("./")) {
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
const { judgeTrail, trailTask } = load(`${dir}/groqTrail.tsx`);
const { judgeStructure, structureTask } = load(`${dir}/structureLists.tsx`);
const { questionsTask, judgeQuestions } = load(`${dir}/archiveQuestions.tsx`);
const archive = load("src/game/archive.ts");

const queryOf = (q) => ({ query: q });
const labels = (v) => ({
  ...Object.fromEntries(v.requirements.map((r) => [r.label, r.done])),
});
const plain = (x) => JSON.parse(JSON.stringify(x));

test("the trail: our query passes and ends at the bakery", async () => {
  const v = await judgeTrail(queryOf(trailTask.ours));
  assert.equal(v.done, true);
  assert.equal(JSON.stringify(v.solvedAs), "{}");
  assert.equal(v.data.points.at(-1).name, "Bakeriet");
  assert.equal(v.data.points[0].name, "Skogkanten");
});

test("the trail: without a filter the rumours pull it to the square", async () => {
  const q = trailTask.ours.replace(' && status == "confirmed"', "");
  const v = await judgeTrail(queryOf(q));
  assert.equal(v.done, false);
  assert.deepEqual(labels(v), {
    "Bare bekreftede": false,
    "I tidsrekkefølge": true,
    "Med sted på kartet": true,
  });
  const square = v.data.points.filter((p) => p.name === "Torget").length;
  assert.ok(square > v.data.points.length / 3);
});

test("the trail: the starter runs but passes nothing", async () => {
  const exports = {};
  new Function(
    "exports",
    trailTask.starter
      .replace("export const", "exports.query =")
      .replace(/^\/\/.*$/gm, ""),
  )(exports);
  const v = await judgeTrail(exports);
  assert.equal(v.done, false);
  assert.equal(v.data.points.length, 0);
});

test("the trail: a GROQ syntax error is explained, not thrown", async () => {
  const v = await judgeTrail(queryOf("*[_type == ]"));
  assert.equal(v.done, false);
  assert.match(v.error, /GROQ-feil/);
});

function structureFrom(items) {
  return {
    structure: new Function(
      "S",
      `return S.list().title("Content").items([${items}...S.documentTypeListItems()])`,
    ),
  };
}

test("structure: our lists pass", async () => {
  const v = await judgeStructure(structureFrom(structureTask.ours));
  assert.equal(v.done, true, JSON.stringify(v.requirements));
  const perPlace = v.data.root.find((r) => r.title === "Per sted");
  const bakery = perPlace.pane.places.find((p) => p.name === "Bakeriet");
  assert.equal(bakery.rows.length, 4);
});

test("structure: the starter keeps the standard types and nothing else", async () => {
  const v = await judgeStructure(structureFrom(""));
  assert.deepEqual(labels(v), {
    "«Bare bekreftede» viser de bekreftede": false,
    "«Per sted» viser observasjonene der": false,
    "De vanlige typene er der fortsatt": true,
  });
});

test("structure: a fixed place instead of the parameter is caught", async () => {
  const wrong = structureTask.ours.replace(
    "references($placeId)",
    'references("place-torget")',
  );
  const v = await judgeStructure(structureFrom(wrong));
  assert.equal(labels(v)["«Per sted» viser observasjonene der"], false);
});

// Runs a starter or answer file the way the window does, minus the imports.
function exportsOf(source) {
  const exports = {};
  new Function(
    "exports",
    source.replace(/export const (\w+) =/g, "exports.$1 ="),
  )(exports);
  return exports;
}

test("Arkivarens questions: one luke, five answers, the starter solves none", async () => {
  const start = await judgeQuestions(exportsOf(questionsTask.starter));
  assert.equal(start.requirements.length, 5);
  assert.equal(start.requirements.filter((r) => r.done).length, 0);
  assert.equal(start.done, false);
});

test("Arkivarens questions: our five answers pass", async () => {
  const answers = {};
  for (const [i, block] of questionsTask.ours
    .split(/\n\n(?=\/\/ \d\.)/)
    .entries())
    answers[`svar${i + 1}`] = block.replace(/^\/\/.*\n/, "");
  const v = await judgeQuestions(answers);
  assert.equal(v.done, true, JSON.stringify(v.requirements));
});

test("Arkivarens questions: partial answers count, and the rule may not use status", async () => {
  const v = await judgeQuestions({
    svar1: 'count(*[_type == "observation" && status == "rumor"])',
    svar5:
      '*[_type == "observation" && status == "confirmed"] | order(time asc) { time, what }',
  });
  const done = v.requirements.map((r) => r.done);
  assert.deepEqual([...done], [true, false, false, false, false]);
  assert.match(v.requirements[4].message, /status/);
});

test("the non-technical checks count right answers, never more", () => {
  const right = archive.WHO_IS_LYING.map((s) => ({
    _id: s._id,
    status: s.expected,
  }));
  assert.deepEqual(plain(archive.sourceCheckScore(right)), {
    right: 5,
    total: 5,
  });
  const trap = right.map((d) =>
    d._id === "archive-e" ? { ...d, status: "confirmed" } : d,
  );
  assert.deepEqual(plain(archive.sourceCheckScore(trap)), {
    right: 4,
    total: 5,
  });
  assert.deepEqual(plain(archive.sourceCheckScore([])), { right: 0, total: 5 });
  assert.deepEqual(
    plain(archive.linkScore([{ _id: "archive-c", place: "place-bakeriet" }])),
    { right: 1, total: 1 },
  );
});

test("the player's starting documents follow Arkivaren's rule", () => {
  // Confirmed: seen with a picture, or the same event seen by another witness.
  const clues = archive.WHO_IS_LYING.map((clue) => ({
    ...clue,
    place: clue._id === "archive-c" ? "bakeriet" : clue.place,
  }));
  for (const s of clues) {
    const others = clues.filter(
      (o) =>
        o.what === s.what && o.place === s.place && o.witness !== s.witness,
    );
    const confirmed = s.seen && (Boolean(s.image) || others.length > 0);
    assert.equal(confirmed ? "confirmed" : "rumor", s.expected, s._id);
  }
});
