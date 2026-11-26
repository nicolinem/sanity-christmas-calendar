/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { addToTrip, bankTrip, dropTrip, secureTrip } = require("./trip.ts");
const { EMPTY_PROGRESS } = require("../quests/progress.ts");

test("addToTrip adds up without mutating", () => {
  const once = addToTrip(EMPTY_PROGRESS, "malm", 1);
  const twice = addToTrip(once, "malm", 1);
  assert.equal(twice.trip.malm, 2);
  assert.equal(once.trip.malm, 1);
  assert.deepEqual(EMPTY_PROGRESS.trip, {});
});

test("addToTrip floors and never goes below zero", () => {
  assert.equal(addToTrip(EMPTY_PROGRESS, "malm", 1.9).trip.malm, 1);
  assert.equal(addToTrip(EMPTY_PROGRESS, "malm", -4).trip.malm, 0);
});

test("bankTrip moves the trip into the inventory and leaves the cave", () => {
  const p = {
    ...EMPTY_PROGRESS,
    inventory: { malm: 1 },
    trip: { malm: 2, isskar: 1 },
    inCave: true,
  };
  const banked = bankTrip(p);
  assert.deepEqual(banked.inventory, { malm: 3, isskar: 1 });
  assert.deepEqual(banked.trip, {});
  assert.equal("inCave" in banked, false);
  assert.equal(p.inCave, true);
});

test("dropTrip empties the trip and keeps everything else", () => {
  const p = {
    ...EMPTY_PROGRESS,
    xp: 40,
    inventory: { malm: 1 },
    deepest: 4,
    completed: { a: "2026-11-30T12:00:00Z" },
    side: { s: true },
    trip: { malm: 2 },
    inCave: true,
  };
  const dropped = dropTrip(p);
  assert.deepEqual(dropped.trip, {});
  assert.equal("inCave" in dropped, false);
  for (const key of ["xp", "inventory", "deepest", "completed", "side"]) {
    assert.deepEqual(dropped[key], p[key]);
  }
});

test("secureTrip banks the trip and keeps the player in the cave", () => {
  const p = addToTrip(
    { ...EMPTY_PROGRESS, inCave: true, inventory: { malm: 1 } },
    "malm",
    2,
  );
  const safe = secureTrip(p);
  assert.equal(safe.inventory.malm, 3);
  assert.deepEqual(safe.trip, {});
  assert.equal(safe.inCave, true);
  assert.equal(p.trip.malm, 2);
});

test("caveFinds lists each material with what is safe and what is on the trip", () => {
  const { caveFinds } = require("./trip.ts");
  assert.deepEqual(caveFinds({ malm: 3 }, { malm: 2, isskar: 1 }), [
    { id: "isskar", safe: 0, trip: 1 },
    { id: "malm", safe: 3, trip: 2 },
  ]);
  assert.deepEqual(caveFinds({ isskar: 0 }, {}), []);
  // Ids the game no longer knows are left out.
  assert.deepEqual(caveFinds({ gull: 4 }, { gull: 1 }), []);
});

test("findsText says a trip's finds in words", () => {
  const { findsText } = require("./trip.ts");
  assert.equal(findsText({}), "");
  assert.equal(findsText({ malm: 0 }), "");
  assert.equal(findsText({ malm: 1 }), "1 gammel malm");
  assert.equal(findsText({ malm: 2, isskar: 1 }), "1 isskår og 2 gammel malm");
});
