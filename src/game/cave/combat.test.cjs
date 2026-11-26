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
  monsterDrop,
  sturdyHp,
  HIT_ROLL_MAX,
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

test("damage is capped at 3 on depth 10, drake and aim time too", () => {
  for (const id of [...PLAYABLE, "drake"])
    assert.ok(scaleEnemy(id, 10).damage <= 3, id);
  assert.ok(scaleEnemy("cyclops", 10).aimMs >= 350);
  assert.ok(scaleEnemy("cyclops", 1).aimMs > scaleEnemy("cyclops", 6).aimMs);
  assert.equal(scaleEnemy("cyclops", 1).everyMs, 2200);
  assert.equal(scaleEnemy("rat", 1).aimMs, null);
  assert.equal(scaleEnemy("rat", 1).everyMs, null);
  assert.equal(scaleEnemy("drake", 1).windupMs, 600);
});

test("troll and cyclops are playable, bosses are not", () => {
  assert.ok(PLAYABLE.includes("troll") && PLAYABLE.includes("cyclops"));
  assert.ok(!PLAYABLE.includes("drake") && !PLAYABLE.includes("yeti"));
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

test("rock drops: malm 40 % everywhere, isskår 5 / 15 / 25 % by depth", () => {
  for (const depth of [1, 4, 9]) {
    assert.equal(rockDrop(0, depth), "malm");
    assert.equal(rockDrop(0.39, depth), "malm");
    assert.equal(rockDrop(0.9, depth), null);
  }
  assert.equal(rockDrop(0.44, 2), "isskar");
  assert.equal(rockDrop(0.46, 2), null);
  assert.equal(rockDrop(0.54, 3), "isskar");
  assert.equal(rockDrop(0.56, 4), null);
  assert.equal(rockDrop(0.64, 6), "isskar");
  assert.equal(rockDrop(0.66, 9), null);
});

test("a monster drops something one time in four, isskår more often deeper", () => {
  const share = (depth) => {
    let drops = 0;
    let isskar = 0;
    for (let i = 0; i < 1000; i++) {
      const item = monsterDrop(i / 1000, depth);
      if (item) drops++;
      if (item === "isskar") isskar++;
    }
    return { drops, isskar };
  };
  for (const depth of [1, 4, 9]) assert.equal(share(depth).drops, 250);
  assert.ok(share(1).isskar < share(4).isskar);
  assert.ok(share(4).isskar < share(9).isskar);
  assert.equal(monsterDrop(0.25, 1), null);
});

test("a normal monster always takes at least 2 swings, a slime 3, at any level", () => {
  for (const damage of FORGE_DAMAGE)
    for (let depth = 1; depth <= 10; depth++)
      for (const id of PLAYABLE) {
        if (ENEMIES[id].from > depth) continue;
        const attack = { damage, element: null };
        const hp = sturdyHp(id, scaleEnemy(id, depth).hp, attack);
        const hits = Math.ceil(hp / (damage + HIT_ROLL_MAX));
        assert.ok(
          hits >= (id === "slime" ? 3 : 2),
          `${id} at depth ${depth}, damage ${damage}: ${hits}`,
        );
      }
});

test("sturdyHp leaves bosses, weak weapons and no weapon alone", () => {
  const strong = { damage: 22, element: null };
  assert.equal(sturdyHp("yeti", 70, strong), 70);
  assert.equal(sturdyHp("rat", 12, null), 12);
  assert.equal(sturdyHp("rat", 12, { damage: 4, element: null }), 12);
  assert.equal(sturdyHp("rat", 12, strong), 25);
  assert.equal(sturdyHp("slime", 18, strong), 49);
});

test("an element the monster is weak to still pays off against sturdy hp", () => {
  const fire = { damage: 14, element: "fire" };
  const hp = sturdyHp("slime", scaleEnemy("slime", 1).hp, fire);
  const best = hitEnemy(fire, "slime", HIT_ROLL_MAX).damage;
  assert.ok(Math.ceil(hp / best) < 3);
});
