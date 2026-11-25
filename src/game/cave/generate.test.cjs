/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { generateFloor } = require("./generate.ts");
const { reachable } = require("./rooms.ts");

test("the same seed gives the same floor", () => {
  assert.deepEqual(generateFloor(3, 42), generateFloor(3, 42));
});

test("never the same room twice in a row", () => {
  for (let seed = 0; seed < 200; seed++) {
    const first = generateFloor(2, seed);
    assert.notEqual(generateFloor(3, seed + 1, first.room).room, first.room);
  }
});

test("floors 5 and 10 are rest floors with a boss and a chest; never locked", () => {
  const five = generateFloor(5, 1);
  assert.equal(five.rest, true);
  assert.equal(five.locked, false);
  assert.deepEqual(
    five.spawns.map((s) => s.enemy),
    ["yeti"],
  );
  assert.equal(five.chest.id, "cave-5");
  assert.deepEqual(
    generateFloor(10, 1).spawns.map((s) => s.enemy),
    ["drake"],
  );
  assert.equal(generateFloor(10, 1).sheet, "caveDeep");
});

test("monster count grows with depth: 2–3 on floor 1, at most 6", () => {
  for (let seed = 0; seed < 300; seed++) {
    const n1 = generateFloor(1, seed).spawns.length;
    assert.ok(n1 >= 2 && n1 <= 3);
    assert.ok(generateFloor(9, seed).spawns.length <= 6);
  }
});

test("only monsters that belong at that depth", () => {
  for (let seed = 0; seed < 300; seed++)
    for (const s of generateFloor(2, seed).spawns)
      assert.ok(["rat", "slime"].includes(s.enemy));
});

test("floor 1 and rest floors are never locked; about one in four others is", () => {
  let locked = 0;
  for (let seed = 0; seed < 1000; seed++) {
    assert.equal(generateFloor(1, seed).locked, false);
    if (generateFloor(3, seed).locked) locked++;
  }
  assert.ok(locked > 180 && locked < 320);
});

test("1 000 seeds on depths 1–12: no errors, and the stairs are always reachable", () => {
  const tile = (p) => [(p.x - 8) / 16, (p.y - 8) / 16];
  for (let depth = 1; depth <= 12; depth++) {
    for (let seed = 0; seed < 1000; seed++) {
      const floor = generateFloor(depth, seed);
      const [sx, sy] = tile(floor.start);
      const [tx, ty] = tile(floor.stairs);
      assert.ok(reachable(floor.rows, [sx, sy]).has(`${tx},${ty}`));
      for (const s of floor.spawns)
        assert.equal(floor.rows[(s.y - 8) / 16][(s.x - 8) / 16], "m");
      for (const o of floor.rocks)
        assert.equal(floor.rows[(o.y - 8) / 16][(o.x - 8) / 16], "o");
      const walls = floor.rows.join("").split("#").length - 1;
      assert.equal(floor.solids.length, walls);
    }
  }
});
