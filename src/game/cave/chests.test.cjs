/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { CHEST_TOASTS } = require("./chests.ts");
const { CAVE_FACT_XP } = require("../xp.ts");

test("each rest floor's chest has its own toast", () => {
  assert.deepEqual(CHEST_TOASTS["cave-5"], {
    title: "Rustning og en oppskrift",
    body: "Kista på etasje 5 hadde rustning og oppskriften på et isskjold.",
    tone: "lesson",
  });
  assert.deepEqual(CHEST_TOASTS["cave-10"], {
    title: "Kista på etasje 10",
    body: "Den var full av gamle notater, og ett var oppskriften på en ishjelm. Du fikk 100 XP.",
    tone: "lesson",
  });
  assert.equal(CHEST_TOASTS["cave-15"], undefined);
});

test("the floor-10 toast's XP is the XP the chest gives", () => {
  const xp = CAVE_FACT_XP.chests["cave-10"];
  assert.match(CHEST_TOASTS["cave-10"].body, new RegExp(`${xp} XP`));
});
