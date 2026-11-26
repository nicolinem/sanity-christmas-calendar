/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const {
  GHOST_SPEED,
  MAX_GHOSTS,
  DEV_GHOSTS,
  chooseGhosts,
  spawnGhosts,
  stepGhosts,
} = require("./ghosts.ts");
const { isPath, GHOST_SPOTS } = require("./village.ts");
const { DEFAULT_FIGURE } = require("./figure.ts");

// A small seeded random, so runs repeat.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const input = (id) => ({
  playerId: id,
  name: `Navn ${id}`,
  figure: DEFAULT_FIGURE,
  about: null,
});

test("chooseGhosts leaves out yourself and players without figure or name, at most 8", () => {
  const players = Array.from({ length: 12 }, (_, i) => ({
    playerId: `p${i}abcde`,
    name: `P${i}`,
    figure: DEFAULT_FIGURE,
    about: null,
  }));
  players.push({ playerId: "nofigure", name: "X", figure: null });
  players.push({ playerId: "noname11", name: null, figure: DEFAULT_FIGURE });
  const chosen = chooseGhosts(players, "p0abcde", seeded(1));
  assert.equal(chosen.length, MAX_GHOSTS);
  const ids = chosen.map((g) => g.playerId);
  assert.ok(!ids.includes("p0abcde"));
  assert.ok(!ids.includes("nofigure"));
  assert.ok(!ids.includes("noname11"));
  assert.equal(new Set(ids).size, ids.length);
});

test("ghosts start on different spots", () => {
  const ghosts = spawnGhosts([input("a"), input("b"), input("c")], seeded(2));
  const at = new Set(ghosts.map((g) => `${g.x},${g.y}`));
  assert.equal(at.size, 3);
  for (const g of ghosts)
    assert.ok(GHOST_SPOTS.some((s) => s.x === g.x && s.y === g.y));
});

test("a lone ghost never pairs up and only stands still on a path", () => {
  const random = seeded(3);
  const [g] = spawnGhosts([input("a")], random);
  let walked = false;
  for (let t = 0; t < 120000; t += 100) {
    stepGhosts([g], 100, { random, holdId: null });
    assert.equal(g.partner, null);
    assert.equal(g.bubble, false);
    if (g.walking) walked = true;
    else
      assert.ok(
        isPath(Math.floor(g.x / 16), Math.floor(g.y / 16)),
        `${g.x},${g.y}`,
      );
  }
  assert.ok(walked, "it walked somewhere");
});

test("after arriving alone, a ghost waits 3 to 9 seconds", () => {
  const random = seeded(4);
  const [g] = spawnGhosts([input("a")], random);
  let checked = 0;
  for (let t = 0; t < 120000 && checked < 3; t += 50) {
    const wasWalking = g.walking || g.route.length > 0;
    stepGhosts([g], 50, { random, holdId: null });
    if (wasWalking && g.route.length === 0) {
      assert.ok(g.waitMs >= 3000 && g.waitMs <= 9000, String(g.waitMs));
      checked++;
    }
  }
  assert.equal(checked, 3);
});

test("two ghosts meet, face each other with a bubble, and part again", () => {
  const random = () => 0.1; // always below the 25 % meeting chance
  const [a, b] = spawnGhosts([input("a"), input("b")], seeded(5));
  a.waitMs = 0;
  b.waitMs = 0;
  let met = false;
  let parted = false;
  for (let t = 0; t < 120000 && !parted; t += 100) {
    stepGhosts([a, b], 100, { random, holdId: null });
    if (a.bubble && b.bubble) {
      met = true;
      assert.equal(a.partner, "b");
      assert.equal(b.partner, "a");
      assert.equal(a.facing, Math.sign(b.x - a.x));
      assert.equal(b.facing, Math.sign(a.x - b.x));
    }
    if (met && !a.bubble && !b.bubble) {
      parted = true;
      assert.equal(a.partner, null);
      assert.equal(b.partner, null);
    }
  }
  assert.ok(met, "they met");
  assert.ok(parted, "they parted");
});

test("a ghost you talk to stops, faces you, and walks on from where it stood", () => {
  const random = seeded(6);
  const [g] = spawnGhosts([input("a")], random);
  g.waitMs = 0;
  for (let i = 0; i < 100 && !g.walking; i++)
    stepGhosts([g], 100, { random, holdId: null });
  stepGhosts([g], 300, { random, holdId: null });
  assert.ok(g.walking, "walking before the talk");
  const held = { x: g.x, y: g.y };
  const face = { x: g.x - 50, y: g.y };
  for (let t = 0; t < 5000; t += 100)
    stepGhosts([g], 100, { random, holdId: "a", face });
  assert.deepEqual({ x: g.x, y: g.y }, held);
  assert.equal(g.walking, false);
  assert.equal(g.facing, -1);
  stepGhosts([g], 100, { random, holdId: null });
  const moved = Math.hypot(g.x - held.x, g.y - held.y);
  assert.ok(moved > 0 && moved <= GHOST_SPEED * 0.1 + 1e-9, String(moved));
});

test("dev ghosts are four complete made-up players", () => {
  assert.equal(DEV_GHOSTS.length, 4);
  for (const g of DEV_GHOSTS) {
    assert.ok(g.name && g.figure);
    assert.ok(g.about && g.about.food && g.about.activity);
    assert.ok(g.about.topics.length >= 3);
  }
});
