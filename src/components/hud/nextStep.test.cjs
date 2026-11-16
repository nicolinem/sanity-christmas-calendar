/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");
const { CHAPTERS } = require("../../game/quests/chapters.ts");

const loaded = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(path.resolve(__dirname, "nextStep.ts"), "utf8"), {
    transforms: ["typescript", "imports"],
  }).code,
  {
    module: loaded,
    exports: loaded.exports,
    require(name) {
      if (name === "@/game/village")
        return require(path.resolve(__dirname, "../../game/village.ts"));
      if (name === "@/game/quests/label") {
        const { NPCS } = require(path.resolve(__dirname, "../../game/village.ts"));
        return { giverOf: (q) => NPCS[q.giver ?? "brann"] };
      }
      return require(name);
    },
  },
);
const nextStep = (state) =>
  JSON.parse(JSON.stringify(loaded.exports.nextStep(state)));

const door = (quest, status = "active") => ({
  quest: { id: "q", door: 4, ...quest },
  status,
});

test("an offered door sends you to its giver: Brann unless another is named", () => {
  const brann = nextStep(door({ checkedBy: "window" }, "offered"));
  assert.equal(brann.kind, "giver");
  assert.equal(brann.site, "forge");
  assert.equal(brann.label, "Gå til Brann");
  const arkivaren = nextStep(door({ checkedBy: "window", giver: "arkivaren" }, "offered"));
  assert.equal(arkivaren.site, "square");
  assert.equal(arkivaren.label, "Gå til Arkivaren");
});

test("a code-window door opens the window from anywhere, with no place line", () => {
  for (const villageSite of [undefined, "westHouse"]) {
    const step = nextStep(door({ checkedBy: "window", villageSite }));
    assert.equal(step.kind, "code");
    assert.equal(step.where, undefined);
  }
});

test("a content door with a place walks there, otherwise opens the Studio", () => {
  assert.equal(
    nextStep(door({ checkedBy: "game", villageSite: "noticeboard" })).kind,
    "travel",
  );
  assert.equal(
    nextStep(door({ checkedBy: "game", villageSite: "forge" })).kind,
    "studio",
  );
  assert.equal(
    nextStep(door({ checkedBy: "game", giver: "bakeren", villageSite: "bakery" })).kind,
    "studio",
  );
});

test("a door waiting at its place sends you there to pick it up", () => {
  const step = nextStep({
    ...door({ checkedBy: "window", villageSite: "westHouse" }, "offered"),
    pickup: "westHouse",
  });
  assert.equal(step.kind, "travel");
  assert.equal(step.site, "westHouse");
  assert.match(step.where, /hente den/);
});

test("week-three quests never send a player back to their giver after briefing", () => {
  const { NPCS } = require("../../game/village.ts");
  for (const quest of CHAPTERS[2].quests) {
    const giver = NPCS[quest.giver ?? "brann"];
    const step = nextStep(door(quest));
    assert.notEqual(step.site, giver.site, quest.id);
    assert.equal(nextStep(door(quest, "offered")).site, giver.site, quest.id);
  }
});
