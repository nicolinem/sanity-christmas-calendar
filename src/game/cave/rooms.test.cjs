/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const {
  CAVE_FRAMES,
  REST_ROOMS,
  ROOMS,
  ROOM_H,
  ROOM_W,
  mirror,
  reachable,
} = require("./rooms.ts");
const { ENEMIES, enemiesAt } = require("./enemies.ts");

const all = [...ROOMS, REST_ROOMS[5], REST_ROOMS[10]];
const cells = (rows, ch) => {
  const out = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => c === ch && out.push([x, y])),
  );
  return out;
};

test("frames are the decided ones", () => {
  assert.deepEqual(CAVE_FRAMES, {
    floor: 0,
    floorPebbles: 12,
    floorRocks: 24,
    wall: 40,
    wallVariants: [28, 57, 58, 59],
    wallFaces: [19, 20],
    torch: 29,
  });
});

test("there are 6 normal rooms with unique ids", () => {
  assert.equal(ROOMS.length, 6);
  const ids = all.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const room of all) {
  test(`room ${room.id} follows the rules`, () => {
    const { rows } = room;
    assert.equal(rows.length, ROOM_H);
    for (const row of rows) {
      assert.equal(row.length, ROOM_W);
      assert.match(row, /^[#.STmok]+$/);
    }
    for (let x = 0; x < ROOM_W; x++) {
      assert.equal(rows[0][x], "#");
      assert.equal(rows[ROOM_H - 1][x], "#");
    }
    for (const row of rows) {
      assert.equal(row[0], "#");
      assert.equal(row[ROOM_W - 1], "#");
    }
    const starts = cells(rows, "S");
    assert.equal(starts.length, 1);
    const [sx, sy] = starts[0];

    for (const variant of [rows, mirror(rows)]) {
      const [[vx, vy]] = cells(variant, "S");
      const reach = reachable(variant, [vx, vy]);
      for (const ch of "Tmk") {
        for (const [x, y] of cells(variant, ch)) {
          assert.ok(reach.has(`${x},${y}`), `${ch} at ${x},${y} unreachable`);
        }
      }
      for (const [x, y] of cells(variant, "o")) {
        const near = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ].some(([a, b]) => reach.has(`${a},${b}`));
        assert.ok(near, `o at ${x},${y} has no reachable neighbour`);
      }
    }

    for (const [x, y] of cells(rows, "m")) {
      assert.ok(Math.hypot(x - sx, y - sy) >= 4, `m at ${x},${y} too close`);
    }
  });
}

test("normal rooms have 2+ stairs, 3-8 monsters and no chest", () => {
  for (const { rows } of ROOMS) {
    assert.ok(cells(rows, "T").length >= 2);
    const m = cells(rows, "m").length;
    assert.ok(m >= 3 && m <= 8);
    assert.equal(cells(rows, "k").length, 0);
  }
});

test("rest rooms have one stairs, one chest and one boss spot", () => {
  for (const d of [5, 10]) {
    const { rows } = REST_ROOMS[d];
    for (const ch of "Tkm") assert.equal(cells(rows, ch).length, 1);
  }
});

test("mirror flips each row", () => {
  assert.deepEqual(mirror(["#.S"]), ["S.#"]);
});

test("enemiesAt skips bosses and respects depth", () => {
  assert.deepEqual(enemiesAt(1), ["rat", "slime"]);
  assert.ok(enemiesAt(5).includes("spider"));
  for (let n = 0; n <= 20; n++) {
    for (const id of enemiesAt(n)) assert.equal(ENEMIES[id].boss, undefined);
  }
  assert.equal(ENEMIES.yeti.from, 5);
  assert.equal(ENEMIES.drake.from, 10);
});

test("every normal room has at least 3 rocks", () => {
  for (const { id, rows } of ROOMS) {
    assert.ok(cells(rows, "o").length >= 3, `${id} has too few o`);
  }
});
