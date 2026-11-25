/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { spawnProjectile, stepProjectile } = require("./projectiles.ts");
const { PROJECTILE_SPEED, PROJECTILE_RANGE } = require("./combat.ts");

const open = () => false;
const far = { x: 1000, y: 1000 };
const shot = { x: 0, y: 0, dir: { x: 1, y: 0 }, damage: 2 };

test("a projectile flies straight", () => {
  const r = stepProjectile(spawnProjectile(shot), 0.5, open, far);
  assert.equal(r.p.x, PROJECTILE_SPEED * 0.5);
  assert.equal(r.p.y, 0);
  assert.equal(r.p.travelled, PROJECTILE_SPEED * 0.5);
  assert.equal(r.p.alive, true);
  assert.equal(r.hit, 0);
});

test("it dies at the first blocked point", () => {
  const r = stepProjectile(spawnProjectile(shot), 0.5, (x) => x >= 20, far);
  assert.equal(r.p.alive, false);
  assert.equal(r.hit, 0);
});

test("it dies after its range", () => {
  let p = spawnProjectile(shot);
  let steps = 0;
  while (p.alive && steps < 100) {
    p = stepProjectile(p, 0.5, open, far).p;
    steps++;
  }
  assert.equal(p.alive, false);
  assert.ok(p.travelled > PROJECTILE_RANGE);
  assert.ok(steps < 100);
});

test("it hits the player once, then is dead", () => {
  const player = { x: 30, y: 0 };
  const r = stepProjectile(spawnProjectile(shot), 0.5, open, player);
  assert.equal(r.hit, 2);
  assert.equal(r.p.alive, false);
  const again = stepProjectile(r.p, 0.5, open, player);
  assert.equal(again.hit, 0);
  assert.deepEqual(again.p, r.p);
});

test("no time means no movement and no hit", () => {
  const p = spawnProjectile(shot);
  const r = stepProjectile(p, 0, open, { x: 0, y: 0 });
  assert.deepEqual(r.p, p);
  assert.equal(r.hit, 0);
});

test("it does not mutate its input", () => {
  const p = spawnProjectile(shot);
  const copy = JSON.parse(JSON.stringify(p));
  stepProjectile(p, 0.5, open, far);
  assert.deepEqual(p, copy);
});
