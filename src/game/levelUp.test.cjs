/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { levelUpToast } = require("./levelUp.ts");
const { forgedPower } = require("./rules.ts");

test("no toast on the same level or a lower one", () => {
  assert.equal(levelUpToast(3, 3, false), null);
  assert.equal(levelUpToast(3, 2, false), null);
});

test("no toast when a luke's celebration already showed the level", () => {
  assert.equal(levelUpToast(2, 3, true), null);
});

test("a new level names itself and the damage from forgedPower", () => {
  assert.deepEqual(levelUpToast(2, 3, false), {
    title: "Nivå 3",
    body: `Våpnene dine gjør nå ${forgedPower(3).damage} skade.`,
  });
});
