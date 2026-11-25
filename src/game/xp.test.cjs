/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { totalXp } = require("./xp.ts");
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
