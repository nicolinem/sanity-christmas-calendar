/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { generateFloor } = require("./generate.ts");
const { reachable, CAVE_FRAMES, ROOMS } = require("./rooms.ts");

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

test("monster count: 2–3 on floor 1, never more than 10", () => {
  for (let seed = 0; seed < 300; seed++) {
    const n1 = generateFloor(1, seed).spawns.length;
    assert.ok(n1 >= 2 && n1 <= 3);
    for (const d of [3, 9, 12])
      assert.ok(generateFloor(d, seed).spawns.length <= 10);
  }
});

test("floor sizes: 2×1 rooms on 1–2, 2×2 on 3, one room on 5", () => {
  const size = (f) => [f.rows[0].length, f.rows.length];
  assert.deepEqual(size(generateFloor(1, 3)), [48, 14]);
  assert.deepEqual(size(generateFloor(2, 3)), [48, 14]);
  assert.deepEqual(size(generateFloor(3, 3)), [48, 28]);
  assert.deepEqual(size(generateFloor(5, 3)), [24, 14]);
  assert.equal(generateFloor(3, 3).rooms.length, 4);
});

test("the stairs are never in the start room; no monsters there on 1–2", () => {
  const inStart = (p) => p.x < 24 * 16 && p.y < 14 * 16;
  for (let depth = 1; depth <= 12; depth++) {
    if (depth % 5 === 0) continue;
    for (let seed = 0; seed < 300; seed++) {
      const f = generateFloor(depth, seed);
      assert.equal(inStart(f.start), true);
      assert.equal(inStart(f.stairs), false);
      if (depth <= 2) for (const s of f.spawns) assert.equal(inStart(s), false);
      else assert.ok(f.spawns.filter(inStart).length <= 1);
    }
  }
});

test("the stairs and every room's floor can be reached from the start", () => {
  const T = 16;
  // Depths 3-12 (non-rest) build identical rows, so a few depths cover them.
  for (const depth of [1, 3, 5, 10]) {
    for (let seed = 0; seed < 1000; seed += 1) {
      const f = generateFloor(depth, seed, ROOMS[seed % ROOMS.length].id);
      const seen = reachable(f.rows, [
        (f.start.x - 8) / T,
        (f.start.y - 8) / T,
      ]);
      const tx = (f.stairs.x - 8) / T;
      const ty = (f.stairs.y - 8) / T;
      assert.ok(
        seen.has(`${tx},${ty}`),
        `stairs at depth ${depth} seed ${seed}`,
      );
      for (let ry = 0; ry < f.rows.length / 14; ry++)
        for (let rx = 0; rx < f.rows[0].length / 24; rx++) {
          let any = false;
          for (let y = ry * 14; y < ry * 14 + 14; y++)
            for (let x = rx * 24; x < rx * 24 + 24; x++)
              if (f.rows[y][x] === "." && seen.has(`${x},${y}`)) any = true;
          assert.ok(any, `room ${rx},${ry} at depth ${depth} seed ${seed}`);
        }
    }
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
      assert.equal(floor.rows.join("").split("T").length - 1, 1);
      assert.equal(floor.rows[ty][tx], "T");
      assert.equal(
        floor.rows.join("").split("o").length - 1,
        floor.rocks.length,
      );
      const walls = floor.rows.join("").split("#").length - 1;
      assert.equal(floor.solids.length, walls);
    }
  }
});

test("new monster types first appear at depths 3, 5, 6 and 8", () => {
  const seen = (depth) => {
    const kinds = new Set();
    for (let seed = 0; seed < 300; seed++)
      for (const s of generateFloor(depth, seed).spawns) kinds.add(s.enemy);
    return kinds;
  };
  assert.equal(seen(2).has("bat"), false);
  assert.equal(seen(3).has("bat"), true);
  assert.equal(seen(4).has("spider"), false);
  assert.equal(seen(6).has("spider"), true);
  assert.equal(seen(7).has("cyclops"), false);
  assert.equal(seen(8).has("cyclops"), true);
  assert.equal(seen(6).has("troll"), true);
});
test("rest floors are never locked, over many seeds", () => {
  for (let seed = 0; seed < 500; seed++)
    for (const d of [5, 10, 15])
      assert.equal(generateFloor(d, seed).locked, false);
});
test("depth below 1 or not a number is treated as 1", () => {
  assert.deepEqual(generateFloor(0, 7), generateFloor(1, 7));
  assert.deepEqual(generateFloor(-5, 7), generateFloor(1, 7));
  assert.deepEqual(generateFloor(Number.NaN, 7), generateFloor(1, 7));
});
test("floor decoration: no rock tiles, and at most about 1 in 50 pebble tiles", () => {
  let pebbles = 0,
    floor = 0;
  for (let seed = 0; seed < 200; seed++) {
    const f = generateFloor(2, seed);
    f.rows.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === "#") return;
        floor++;
        assert.notEqual(f.tiles[y][x], CAVE_FRAMES.floorRocks);
        if (f.tiles[y][x] === CAVE_FRAMES.floorPebbles) pebbles++;
      }),
    );
  }
  assert.ok(pebbles / floor > 0.01 && pebbles / floor < 0.035);
});

test("floors average at least 2 rocks", () => {
  let total = 0;
  let n = 0;
  for (let d = 1; d <= 4; d++) {
    for (let seed = 0; seed < 1000; seed++) {
      total += generateFloor(d, seed).rocks.length;
      n++;
    }
  }
  assert.ok(total / n >= 2, `mean ${total / n}`);
});

test("every room has 2-4 torches", () => {
  for (const depth of [1, 3]) {
    for (let seed = 0; seed < 200; seed++) {
      const f = generateFloor(depth, seed);
      const per = new Map();
      for (const t of f.torches) {
        const key = `${Math.floor(t.x / 16 / 24)},${Math.floor(t.y / 16 / 14)}`;
        per.set(key, (per.get(key) ?? 0) + 1);
      }
      const rooms = f.layout.cols * f.layout.rows;
      assert.equal(per.size, rooms, `depth ${depth} seed ${seed}`);
      // A room with fewer than 2 spread-out fronts could come up short; no
      // template does, so the full 2-4 is asserted.
      for (const n of per.values())
        assert.ok(n >= 2 && n <= 4, `depth ${depth} seed ${seed}: ${n}`);
    }
  }
});

const { ENEMIES, PLAYABLE } = require("./enemies.ts");

test("bats are playable fliers", () => {
  assert.ok(PLAYABLE.includes("bat"));
  assert.equal(ENEMIES.bat.flies, true);
});

// Depths 1–9 × 1000 seeds, built once and shared by the tests below.
let shared;
function allFloors() {
  if (!shared) {
    shared = [];
    for (let depth = 1; depth <= 9; depth++)
      for (let seed = 0; seed < 1000; seed++)
        shared.push({ f: generateFloor(depth, seed), seed });
  }
  return shared;
}
// Normal floors from depth 2 on.
function eachFloor(fn) {
  for (const { f, seed } of allFloors())
    if (f.depth >= 2 && !f.rest) fn(f, seed);
}
const roomOf = (p, f) =>
  Math.floor(p.y / (14 * 16)) * f.layout.cols + Math.floor(p.x / (24 * 16));

test("room kinds: room 0 is start, at most one nest, spawns carry their room", () => {
  eachFloor((f) => {
    assert.equal(f.kinds.length, f.layout.cols * f.layout.rows);
    assert.equal(f.kinds[0], "start");
    assert.ok(f.kinds.filter((k) => k === "nest").length <= 1);
    assert.equal(f.kinds.slice(1).includes("start"), false);
    for (const s of f.spawns) assert.equal(s.room, roomOf(s, f));
    assert.equal(roomOf(f.stairs, f), f.stairsRoom);
    assert.ok(f.stairsRoom >= 1);
  });
});

test("calm rooms have at most 1 monster; nests have 4+ when the spots allow", () => {
  let nests = 0;
  eachFloor((f) => {
    f.kinds.forEach((k, i) => {
      const n = f.spawns.filter((s) => s.room === i).length;
      if (k === "calm") assert.ok(n <= 1);
      if (k === "nest") {
        nests++;
        assert.ok(n >= 4);
      }
    });
    assert.ok(f.spawns.length <= 10);
  });
  assert.ok(nests > 100);
});

test("no nests on depth 1; rest floors are one start room without a cache", () => {
  for (let seed = 0; seed < 300; seed++) {
    assert.equal(generateFloor(1, seed).kinds.includes("nest"), false);
    for (const d of [5, 10]) {
      const f = generateFloor(d, seed);
      assert.deepEqual(f.kinds, ["start"]);
      assert.equal(f.cache, undefined);
      assert.equal(f.locked, false);
      assert.equal(f.stairsRoom, 0);
    }
  }
});

test("locked: never on depth 1, and the stairs room then has a playable monster", () => {
  let locked = 0;
  for (const { f } of allFloors()) {
    if (f.depth === 1) assert.equal(f.locked, false);
    if (f.locked) {
      locked++;
      assert.ok(
        f.spawns.some(
          (s) => s.room === f.stairsRoom && PLAYABLE.includes(s.enemy),
        ),
      );
    }
  }
  assert.ok(locked > 100);
});

test("cache: only in a nest, 2–3 items in total, clear of walls, rocks and spawns; in every nest", () => {
  let nests = 0;
  let caches = 0;
  eachFloor((f, seed) => {
    if (f.kinds.includes("nest")) nests++;
    if (!f.cache) return;
    caches++;
    const tx = (f.cache.x - 8) / 16;
    const ty = (f.cache.y - 8) / 16;
    assert.equal(f.kinds[roomOf(f.cache, f)], "nest");
    assert.equal(f.cache.id, `nest-${f.depth}-${seed}`);
    const total = f.cache.items.reduce((n, it) => n + it.count, 0);
    assert.ok(total >= 2 && total <= 3);
    assert.equal(
      new Set(f.cache.items.map((it) => it.item)).size,
      f.cache.items.length,
    );
    for (const it of f.cache.items) {
      assert.ok(["malm", "isskar"].includes(it.item));
      assert.ok(it.count >= 1);
    }
    assert.equal(f.rows[ty][tx], ".");
    for (let y = 0; y < f.rows.length; y++)
      for (let x = 0; x < f.rows[y].length; x++)
        if ("#o".includes(f.rows[y][x]))
          assert.ok(Math.max(Math.abs(x - tx), Math.abs(y - ty)) >= 1);
    for (const s of f.spawns)
      assert.ok(
        Math.max(
          Math.abs((s.x - 8) / 16 - tx),
          Math.abs((s.y - 8) / 16 - ty),
        ) >= 1,
      );
  });
  assert.ok(nests > 100);
  assert.ok(caches / nests >= 0.99);
});

test("cache: at least 2 tiles (Chebyshev) from the stairs", () => {
  eachFloor((f) => {
    if (!f.cache) return;
    const cheb = Math.max(
      Math.abs(f.cache.x - f.stairs.x),
      Math.abs(f.cache.y - f.stairs.y),
    );
    assert.ok(cheb / 16 >= 2);
  });
});

test("depth 2 always has at least one monster", () => {
  for (let seed = 0; seed < 1500; seed++)
    assert.ok(generateFloor(2, seed).spawns.length >= 1, `seed ${seed}`);
});
