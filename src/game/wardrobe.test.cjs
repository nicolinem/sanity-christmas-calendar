/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { DEFAULT_FIGURE, FIGURE_OPTIONS } = require("./figure.ts");
const {
  GEAR_REWARDS,
  gearSource,
  isGear,
  ownedGear,
  wearable,
} = require("./wardrobe.ts");

const none = { completed: {} };
const archive = {
  completed: { "archive-questions": "2026-11-16T10:00:00.000Z" },
};

test("only options with an unlock are gear", () => {
  assert.equal(isGear("hat", "bobble"), true);
  assert.equal(isGear("hat", "none"), false);
  assert.equal(isGear("skin", "light"), false);
  assert.equal(gearSource("hat", "bobble"), "Arkivarens spørsmål");
  assert.equal(gearSource("hat", "none"), undefined);
});

test("non-gear choices are always kept", () => {
  assert.deepEqual(wearable(DEFAULT_FIGURE, new Set()), DEFAULT_FIGURE);
});

test("gear not owned is removed, owned gear is kept", () => {
  const choice = {
    ...DEFAULT_FIGURE,
    hat: "bobble",
    scarf: "scarf",
    armour: "chain",
  };
  const bare = wearable(choice, new Set());
  assert.equal(bare.hat, "none");
  assert.equal(bare.scarf, "none");
  assert.equal(bare.armour, "none");
  const kept = wearable(choice, new Set(["hat:bobble"]));
  assert.equal(kept.hat, "bobble");
  assert.equal(kept.scarf, "none");
  assert.equal(choice.hat, "bobble", "the input is not changed");
});

test("dev owns all gear", () => {
  const owned = ownedGear(none, { dev: true });
  for (const key of Object.keys(FIGURE_OPTIONS))
    for (const o of FIGURE_OPTIONS[key])
      if (o.unlock) assert.ok(owned.has(`${key}:${o.id}`), `${key}:${o.id}`);
  assert.equal(ownedGear(none).size, 0);
});

test("completing the archive quest gives its items", () => {
  const gear = GEAR_REWARDS["archive-questions"];
  assert.ok(gear.includes("hat:bobble") && gear.includes("scarf:scarf"));
  for (const g of gear)
    assert.equal(gearSource(...g.split(":")), "Arkivarens spørsmål");
  assert.deepEqual([...ownedGear(archive)].sort(), [...gear].sort());
  assert.equal(
    ownedGear(archive).has("armour:chain"),
    false,
    "village gear has no source yet",
  );
});

test("the crown needs every core Bakery door on the same track", () => {
  assert.equal(gearSource("hat", "crown"), "Bakeren: fullført uke 3");
  for (const ids of [
    ["baker-template", "baker-forge", "baker-function"],
    ["baker-first-order", "baker-sign", "baker-ready"],
  ]) {
    const progress = (done) => ({ completed: Object.fromEntries(done.map((id) => [id, "2026-12-01"])) });
    assert.equal(ownedGear(progress(ids.slice(0, 2))).has("hat:crown"), false);
    assert.equal(ownedGear(progress(ids.slice(1))).has("hat:crown"), false);
    assert.equal(ownedGear(progress(ids)).has("hat:crown"), true);
  }
  assert.equal(ownedGear({ completed: { "baker-template": "yes", "baker-sign": "yes", "baker-ready": "yes" } }).has("hat:crown"), false);
});
