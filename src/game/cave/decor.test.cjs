/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { decorate } = require("./decor.ts");
const { rng } = require("./random.ts");
const { CAVE_FRAMES, ROOMS } = require("./rooms.ts");

const isFront = (rows, x, y) =>
  rows[y][x] === "#" && y + 1 < rows.length && rows[y + 1][x] !== "#";
const faces = (tiles) =>
  tiles.flat().filter((f) => CAVE_FRAMES.wallFaces.includes(f)).length;

test("fronts are # with floor below, every other # is roof", () => {
  const rows = ["####", "#..#", "####"];
  const { roof } = decorate(rows, rng(1));
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== "#") return;
      assert.equal(roof[y][x], !isFront(rows, x, y), `${x},${y}`);
    }),
  );
  assert.equal(roof[0][1], false);
  assert.equal(roof[0][2], false);
  assert.equal(roof[2][1], true);
});

test("S, T, m, o and k below a wall also make it a front", () => {
  const rows = ["######", "#STmok", "######"];
  const { roof } = decorate(rows, rng(1));
  for (let x = 1; x <= 5; x++) assert.equal(roof[0][x], false);
});

test("torches sit on fronts, 4+ apart, 2-4 of them", () => {
  const room = ROOMS[0];
  for (let seed = 0; seed < 200; seed++) {
    const { torches, tiles } = decorate(room.rows, rng(seed));
    assert.ok(torches.length >= 2 && torches.length <= 4, `seed ${seed}`);
    const t = torches.map((p) => [(p.x - 8) / 16, (p.y - 8) / 16]);
    for (const [x, y] of t) {
      assert.ok(isFront(room.rows, x, y));
      assert.equal(tiles[y][x], CAVE_FRAMES.torch);
    }
    for (let i = 0; i < t.length; i++)
      for (let j = i + 1; j < t.length; j++)
        assert.ok(
          Math.max(Math.abs(t[i][0] - t[j][0]), Math.abs(t[i][1] - t[j][1])) >=
            4,
        );
  }
});

test("few fronts: as many torches as fit", () => {
  const { torches } = decorate(["####", "#..#", "####"], rng(3));
  assert.ok(torches.length >= 1 && torches.length <= 1);
});

test("at most one wall face per call", () => {
  for (let seed = 0; seed < 500; seed++)
    assert.ok(faces(decorate(ROOMS[0].rows, rng(seed)).tiles) <= 1);
});

test("floor tiles: no rocks, pebbles 1-3.5 %", () => {
  let pebbles = 0,
    floor = 0;
  for (let seed = 0; seed < 200; seed++) {
    const rows = ROOMS[1].rows;
    const { tiles } = decorate(rows, rng(seed));
    rows.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === "#") return;
        floor++;
        assert.notEqual(tiles[y][x], CAVE_FRAMES.floorRocks);
        if (tiles[y][x] === CAVE_FRAMES.floorPebbles) pebbles++;
      }),
    );
  }
  assert.ok(pebbles / floor > 0.01 && pebbles / floor < 0.035);
});

test("ice lumps only on . tiles, at tile centres", () => {
  let n = 0;
  for (let seed = 0; seed < 200; seed++)
    for (const room of ROOMS) {
      const { decor } = decorate(room.rows, rng(seed));
      for (const d of decor) {
        n++;
        assert.deepEqual([d.sheet, d.frame], ["ski", 95]);
        assert.equal(room.rows[(d.y - 8) / 16][(d.x - 8) / 16], ".");
      }
    }
  assert.ok(n > 0);
});

test("the same seed gives the same result", () => {
  assert.deepEqual(
    decorate(ROOMS[2].rows, rng(9)),
    decorate(ROOMS[2].rows, rng(9)),
  );
});
