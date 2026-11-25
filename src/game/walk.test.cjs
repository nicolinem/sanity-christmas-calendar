/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { moveBox, tileRoute } = require("./walk.ts");

test("moveBox stops at a wall and slides along it", () => {
  const wall = [{ x: 40, y: 0, w: 16, h: 64 }];
  assert.deepEqual(moveBox({ x: 20, y: 20 }, 10, 0, wall), { x: 30, y: 20 });
  assert.deepEqual(moveBox({ x: 30, y: 20 }, 10, 5, wall), { x: 30, y: 25 });
});

const open = (c) => c === "." || c === "S" || c === "T";
const centre = (x, y) => ({ x: x * 16 + 8, y: y * 16 + 8 });

test("tileRoute goes round walls and rocks, never through them", () => {
  const rows = ["#####", "#S.o#", "#.#.#", "#...#", "#####"];
  const from = centre(1, 1);
  const to = centre(3, 2);
  const route = tileRoute(rows, from, to);
  assert.deepEqual(route[route.length - 1], to);
  let cur = from;
  for (const p of route) {
    assert.ok(p.x === cur.x || p.y === cur.y, "legs are straight");
    const dx = Math.sign(p.x - cur.x);
    const dy = Math.sign(p.y - cur.y);
    let x = cur.x;
    let y = cur.y;
    while (x !== p.x || y !== p.y) {
      x += dx * 16;
      y += dy * 16;
      assert.ok(open(rows[(y - 8) / 16][(x - 8) / 16]));
    }
    cur = p;
  }
});

test("tileRoute gives nothing for a wall, a rock or a cut-off tile", () => {
  const rows = ["#######", "#S.o.##", "#.###.#", "#######"];
  assert.deepEqual(tileRoute(rows, centre(1, 1), centre(0, 0)), []);
  assert.deepEqual(tileRoute(rows, centre(1, 1), centre(3, 1)), []);
  assert.deepEqual(tileRoute(rows, centre(1, 1), centre(4, 1)), []);
  assert.deepEqual(tileRoute(rows, centre(1, 1), centre(5, 2)), []);
});
