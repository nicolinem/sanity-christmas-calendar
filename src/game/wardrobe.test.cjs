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
  assert.equal(gearSource("hat", "bobble"), "Gjemt et sted i verden");
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
  assert.deepEqual(gear, ["extra:lantern"]);
  for (const g of gear)
    assert.equal(gearSource(...g.split(":")), "Arkivarens spørsmål");
  assert.deepEqual([...ownedGear(archive)].sort(), [...gear].sort());
  assert.equal(
    ownedGear(archive).has("armour:chain"),
    false,
    "hidden gear has no source yet",
  );
});

test("the crown needs every core Bakery door on the same track", () => {
  assert.equal(gearSource("hat", "crown"), "Bakeren: fullført uke 3");
  for (const ids of [
    ["baker-template", "baker-forge", "baker-function"],
    ["baker-model", "baker-sign", "morning-rush"],
  ]) {
    const progress = (done) => ({
      completed: Object.fromEntries(done.map((id) => [id, "2026-12-01"])),
    });
    assert.equal(ownedGear(progress(ids.slice(0, 2))).has("hat:crown"), false);
    assert.equal(ownedGear(progress(ids.slice(1))).has("hat:crown"), false);
    assert.equal(ownedGear(progress(ids)).has("hat:crown"), true);
  }
  assert.equal(
    ownedGear({
      completed: {
        "baker-template": "yes",
        "baker-sign": "yes",
        "morning-rush": "yes",
      },
    }).has("hat:crown"),
    false,
  );
});

test("the scarf needs every core luke of week 1 on the same track", () => {
  assert.equal(gearSource("scarf", "scarf"), "Brann: fullført uke 1");
  const progress = (done) => ({
    completed: Object.fromEntries(done.map((id) => [id, "2026-12-01"])),
  });
  const editor = [
    "the-broken-forge",
    "weapon-description",
    "apprentice-mistake",
  ];
  assert.equal(
    ownedGear(progress(editor.slice(0, 2))).has("scarf:scarf"),
    false,
  );
  assert.equal(ownedGear(progress(editor)).has("scarf:scarf"), true);
  const tech = [
    "the-broken-forge",
    "branns-ledger",
    "the-guilds-law",
    "the-drawing-board",
  ];
  assert.equal(ownedGear(progress(tech)).has("scarf:scarf"), true);
});

test("a delivered side quest gives its gear; one still in progress does not", () => {
  const at = "2026-12-02T10:00:00.000Z";
  const taken = { completed: {}, side: { "warm-drink": { at, step: 1 } } };
  assert.equal(ownedGear(taken).has("hat:bobble"), false);
  const done = {
    completed: {},
    side: { "warm-drink": { at, step: 1, done: at } },
  };
  assert.equal(ownedGear(done).has("hat:bobble"), true);
  // Unknown or broken records give nothing.
  assert.equal(
    ownedGear({ completed: {}, side: { gone: { at, step: 0, done: at } } })
      .size,
    0,
  );
});

test("the chest on floor 5 gives the plate armour", () => {
  const none = ownedGear({ completed: {} });
  assert.equal(none.has("armour:plate"), false);
  const owned = ownedGear({ completed: {}, chests: { "cave-5": true } });
  assert.equal(owned.has("armour:plate"), true);
  assert.equal(gearSource("armour", "plate"), "Kista på etasje 5");
});
