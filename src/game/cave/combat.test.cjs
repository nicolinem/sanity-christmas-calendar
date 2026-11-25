/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const {
  scaleEnemy,
  hitEnemy,
  canSwing,
  inSwing,
  canDrink,
  xpFor,
  rockDrop,
  PLAYER_MAX_HP,
} = require("./combat.ts");
const { PLAYABLE, ENEMIES } = require("./enemies.ts");
const { FORGE_DAMAGE } = require("../rules.ts");

test("every playable kind takes 2-5 hits at the matching forge level", () => {
  for (let depth = 1; depth <= 10; depth++) {
    const level = Math.ceil(depth / 2) + 1;
    const damage = FORGE_DAMAGE[level - 1];
    for (const id of PLAYABLE) {
      if (ENEMIES[id].from > depth) continue;
      const hits = Math.ceil(scaleEnemy(id, depth).hp / damage);
      assert.ok(
        hits >= 2 && hits <= 5,
        `${id} at depth ${depth}: ${hits} hits`,
      );
    }
  }
});

test("enemy damage stays at or under 3 on depth 10", () => {
  for (const id of PLAYABLE) assert.ok(scaleEnemy(id, 10).damage <= 3, id);
});

test("scaling grows with depth and windup is floored", () => {
  assert.ok(scaleEnemy("rat", 5).hp > scaleEnemy("rat", 1).hp);
  assert.ok(
    scaleEnemy("spider", 6).windupMs < scaleEnemy("spider", 1).windupMs,
  );
  assert.equal(scaleEnemy("spider", 10).windupMs, 350);
  assert.equal(scaleEnemy("rat", 3).windupMs, null);
  assert.ok(scaleEnemy("rat", 1).damage >= 1);
});

test("elements and weapons", () => {
  assert.deepEqual(hitEnemy({ damage: 6, element: "fire" }, "slime", 0), {
    damage: 9,
    affinity: "weak",
  });
  assert.deepEqual(hitEnemy({ damage: 6, element: "poison" }, "troll", 1), {
    damage: 0,
    affinity: "immune",
  });
  assert.equal(hitEnemy(null, "rat", 2).damage, 0);
  assert.deepEqual(hitEnemy({ damage: 6, element: null }, "rat", 2), {
    damage: 8,
  });
});

test("swing cooldown", () => {
  assert.equal(canSwing(null, 0), true);
  assert.equal(canSwing(1000, 1349), false);
  assert.equal(canSwing(1000, 1350), true);
});

test("swing reach and arc", () => {
  const o = { x: 0, y: 0 };
  assert.equal(inSwing(o, "right", { x: 17, y: 0 }), true);
  assert.equal(inSwing(o, "right", { x: -10, y: 0 }), false);
  assert.equal(inSwing(o, "right", { x: 19, y: 0 }), false);
  assert.equal(inSwing(o, "up", { x: 0, y: -10 }), true);
  assert.equal(inSwing(o, "up", { x: 0, y: 10 }), false);
  assert.equal(inSwing(o, "right", { x: 8, y: 8 }), true);
  assert.equal(inSwing(o, "right", { x: 2, y: 10 }), false);
});

test("drinks", () => {
  assert.equal(canDrink([], "a", PLAYER_MAX_HP), "full");
  assert.equal(canDrink(["a"], "a", 5), "again");
  assert.equal(canDrink(["a", "b", "c"], "d", 5), "limit");
  assert.equal(canDrink(["a"], "b", 5), "ok");
});

test("xp grows with depth", () => {
  assert.equal(xpFor("rat", 1), 10);
  assert.equal(xpFor("rat", 4), 16);
});

test("rock drops", () => {
  assert.equal(rockDrop(0.39), "malm");
  assert.equal(rockDrop(0.5), "isskar");
  assert.equal(rockDrop(0.9), null);
});
