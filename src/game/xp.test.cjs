/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { totalXp, playerLevel } = require("./xp.ts");
const { levelForXp } = require("./rules.ts");
const { chaptersForTrack, forgeLevelFor } = require("./quests/engine.ts");
const { CHAPTERS } = require("./quests/chapters.ts");
const { addItems, MATERIALS } = require("./materials.ts");
const { EMPTY_PROGRESS } = require("./quests/progress.ts");

const AT = "2026-12-02T10:00:00.000Z";

test("lukes give 100 XP, optional ones 50, counted over both tracks", () => {
  const completed = {
    "the-broken-forge": AT,
    "archive-questions": AT,
    "weapon-description": AT,
  };
  assert.equal(totalXp({ completed, side: {}, xp: 0 }), 100 + 50 + 100);
});

test("delivered side quests give their reward.xp; taken ones give nothing", () => {
  const side = {
    "warm-drink": { at: AT, step: 1, done: AT },
    "flour-sack": { at: AT, step: 1 },
  };
  assert.equal(totalXp({ completed: {}, side, xp: 0 }), 30);
});

test("stored monster XP is added; unknown ids are ignored", () => {
  assert.equal(
    totalXp({
      completed: { gone: AT },
      side: { gone: { at: AT, step: 0, done: AT } },
      xp: 40,
    }),
    40,
  );
});

test("addItems adds counts and never goes below zero or keeps fractions", () => {
  const p = addItems({ ...EMPTY_PROGRESS }, [{ id: "isskar", count: 2 }]);
  assert.equal(addItems(p, [{ id: "isskar", count: 1 }]).inventory.isskar, 3);
  assert.equal(addItems(p, [{ id: "isskar", count: -5 }]).inventory.isskar, 0);
  assert.equal(addItems(p, [{ id: "isskar", count: 1.9 }]).inventory.isskar, 3);
});

test("materials are defined with name, sprite and description", () => {
  assert.equal(MATERIALS.isskar.name, "Isskår");
  assert.deepEqual(MATERIALS.malm.sprite, { sheet: "dungeon", frame: 42 });
});

const rewardLukes = [
  "the-broken-forge",
  "weapon-description",
  "apprentice-mistake",
  "archive-model",
  "who-is-lying",
  "case-file",
  "baker-model",
];
const chapters = chaptersForTrack(CHAPTERS, "nonTechnical");
const progress = {
  ...EMPTY_PROGRESS,
  track: "nonTechnical",
  completed: Object.fromEntries(rewardLukes.map((id) => [id, AT])),
};

test("with the flag off the level is the forge level, capped at 4", () => {
  assert.equal(playerLevel(chapters, progress, false), 4);
  assert.equal(
    playerLevel(chapters, progress, false),
    forgeLevelFor(chapters, progress),
  );
});

test("with the flag on the level comes from XP", () => {
  assert.equal(
    playerLevel(chapters, progress, true),
    levelForXp(totalXp(progress)),
  );
});
