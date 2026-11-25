/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const {
  FORGE_DAMAGE,
  MAX_FORGE_LEVEL,
  MAX_LEVEL,
  forgedPower,
  levelForXp,
  totalXpForLevel,
  xpProgress,
} = require("./rules.ts");

test("the XP curve: each level needs 100 more than the last", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 10].map(totalXpForLevel),
    [0, 100, 300, 600, 4500],
  );
});
test("level from XP, capped at 10", () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(4499), 9);
  assert.equal(levelForXp(99999), 10);
  assert.equal(levelForXp(-5), 1);
  assert.equal(levelForXp(Number.NaN), 1);
});
test("progress towards the next level, full at the top", () => {
  assert.deepEqual(xpProgress(150), { level: 2, into: 50, needed: 200 });
  assert.deepEqual(xpProgress(5000), { level: 10, into: 0, needed: 0 });
});
test("damage keeps the first four forge levels and grows by 2 after", () => {
  assert.deepEqual([...FORGE_DAMAGE], [4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
  assert.equal(MAX_FORGE_LEVEL, MAX_LEVEL);
  assert.equal(forgedPower(10).damage, 22);
});
