/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { addToTrip, bankTrip, dropTrip } = require("./trip.ts");
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
