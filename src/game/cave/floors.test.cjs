/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { MAX_DEPTH, ROPE_FLOORS, ropeFloors } = require("./floors.ts");

test("the rope reaches the rest floors you have been to", () => {
  assert.deepEqual([...ROPE_FLOORS], [5, 10]);
  assert.deepEqual(ropeFloors(0), []);
  assert.deepEqual(ropeFloors(4), []);
  assert.deepEqual(ropeFloors(5), [5]);
  assert.deepEqual(ropeFloors(12), [5, 10]);
});

test("floor 10 is the bottom, and the deepest rope floor", () => {
  assert.equal(MAX_DEPTH, 10);
  assert.equal(Math.max(...ROPE_FLOORS), MAX_DEPTH);
});
