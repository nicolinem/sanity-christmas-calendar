/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { moveBox, tileRoute, routeFromOwnTile } = require("./walk.ts");

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

test("moveBox is blocked on both axes in a corner", () => {
  const solids = [
    { x: 40, y: 0, w: 16, h: 64 },
    { x: 0, y: 40, w: 64, h: 16 },
  ];
  assert.deepEqual(moveBox({ x: 36, y: 38 }, 10, 10, solids), {
    x: 36,
    y: 38,
  });
});

test("tileRoute gives nothing when the start tile is a wall", () => {
  const rows = ["####", "#..#", "####"];
  assert.deepEqual(tileRoute(rows, centre(0, 0), centre(1, 1)), []);
});

test("a tap route from an off-centre start next to a rock arrives", () => {
  const rows = ["#####", "#...#", "#.o.#", "#...#", "#...#", "#...#", "#####"];
  const solids = [];
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      if (c === "#" || c === "o")
        solids.push({ x: x * 16, y: y * 16, w: 16, h: 16 });
    }),
  );
  const walk = (start, withCentre) => {
    let pos = start;
    const from = { x: start.x, y: start.y - 2 };
    const to = { x: 24, y: 24 };
    const route = withCentre
      ? routeFromOwnTile(rows, from, to)
      : tileRoute(rows, from, to);
    const step = 64 / 60;
    let stuck = 0;
    for (let f = 0; f < 2000; f++) {
      const t = route[0];
      if (!t) return { arrived: true, pos };
      if (stuck > 8) return { arrived: false, pos };
      const dx = t.x - pos.x;
      const dy = t.y - pos.y;
      const len = Math.hypot(dx, dy);
      if (len < 2) {
        route.shift();
        stuck = 0;
        continue;
      }
      const before = pos;
      pos = moveBox(pos, (dx / len) * step, 0, solids);
      pos = moveBox(pos, 0, (dy / len) * step, solids);
      const moved = Math.hypot(pos.x - before.x, pos.y - before.y);
      stuck = moved < step * 0.3 ? stuck + 1 : 0;
    }
    return { arrived: false, pos };
  };
  const start = { x: 31.5, y: 62 };
  assert.equal(walk(start, false).arrived, false, "plain route stalls");
  assert.equal(walk(start, true).arrived, true);
});
