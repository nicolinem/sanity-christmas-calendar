/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { floorLayout, stitchRooms } = require("./layout.ts");
const { ROOMS } = require("./rooms.ts");

const hall = ROOMS.find((r) => r.id === "hall").rows;
const rng = () => 0;

test("floorLayout: 2×1 on 1–2, 2×2 on normal floors, 1×1 on rest floors", () => {
  for (const d of [1, 2])
    assert.deepEqual(floorLayout(d), { cols: 2, rows: 1 });
  for (const d of [3, 4, 6, 9, 11])
    assert.deepEqual(floorLayout(d), { cols: 2, rows: 2 });
  for (const d of [5, 10])
    assert.deepEqual(floorLayout(d), { cols: 1, rows: 1 });
});

test("stitchRooms: two halls side by side get an opening on the same y", () => {
  const out = stitchRooms([[hall, hall]], rng);
  assert.equal(out.length, 14);
  assert.ok(out.every((row) => row.length === 48));
  const ys = [];
  out.forEach((row, y) => {
    if (row[23] !== "#" && row[24] !== "#") ys.push(y);
  });
  assert.ok(ys.length >= 1 && ys.length <= 2);
  for (const y of ys) {
    assert.equal(out[y][23], ".");
    assert.equal(out[y][24], ".");
  }
});

test("stitchRooms: null when B's column 1 is all wall", () => {
  const blocked = hall.map((row, y) =>
    y === 0 || y === 13 ? row : row[0] + "#" + row.slice(2),
  );
  assert.equal(stitchRooms([[hall, blocked]], rng), null);
});

test("stitchRooms: 2×2 opens vertical walls too", () => {
  const out = stitchRooms(
    [
      [hall, hall],
      [hall, hall],
    ],
    rng,
  );
  assert.equal(out.length, 28);
  assert.ok(out[13].slice(0, 24).includes("."));
  assert.ok(out[14].slice(0, 24).includes("."));
});
