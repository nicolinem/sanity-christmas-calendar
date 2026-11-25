/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { spawnBrain, stepBrain } = require("./brain.ts");
const { scaleEnemy } = require("./combat.ts");

const free = (from, dx, dy) => ({ x: from.x + dx, y: from.y + dy });
const at = (x, y = 0) => ({ x, y });

test("an idle rat far away stays idle; nearer it closes in", () => {
  const rat = spawnBrain("rat", at(0), 1);
  const far = stepBrain(rat, at(200), 0, 0.1, free);
  assert.equal(far.brain.mode, "idle");
  assert.equal(far.brain.x, 0);
  const near = stepBrain(rat, at(100), 0, 0.1, free);
  assert.equal(near.brain.mode, "chase");
  assert.ok(near.brain.x > 0);
});

test("stepBrain does not mutate its input", () => {
  const rat = spawnBrain("rat", at(0), 1);
  const copy = JSON.parse(JSON.stringify(rat));
  stepBrain(rat, at(100), 0, 0.1, free);
  assert.deepEqual(rat, copy);
});

test("rat bite: tell, then strike only if still in range", () => {
  const rat = spawnBrain("rat", at(0), 1);
  const a = stepBrain(rat, at(14), 1000, 0.016, free);
  assert.equal(a.brain.mode, "tell");
  assert.equal(a.strike, 0);
  const early = stepBrain(a.brain, at(14), 1249, 0.016, free);
  assert.equal(early.strike, 0);
  assert.equal(early.brain.mode, "tell");
  const hit = stepBrain(a.brain, at(14), 1250, 0.016, free);
  assert.equal(hit.strike, rat.damage);
  assert.equal(hit.brain.mode, "rest");
  const miss = stepBrain(a.brain, at(30), 1250, 0.016, free);
  assert.equal(miss.strike, 0);
  assert.equal(miss.brain.mode, "rest");
  assert.equal(miss.brain.until, 1250 + 900);
});

test("a paused scene does not fire the tell early", () => {
  const rat = spawnBrain("rat", at(0), 1);
  const a = stepBrain(rat, at(14), 1000, 0.016, free);
  const b = stepBrain(a.brain, at(14), 1100, 0.016, free);
  assert.equal(b.strike, 0);
  assert.equal(b.brain.mode, "tell");
});

test("spider winds up on the scaled time and stands still", () => {
  const spider = spawnBrain("spider", at(0), 6);
  const a = stepBrain(spider, at(60), 500, 0.1, free);
  assert.equal(a.brain.mode, "windup");
  assert.equal(a.brain.until, 500 + scaleEnemy("spider", 6).windupMs);
  const b = stepBrain(a.brain, at(60), 600, 0.1, free);
  assert.equal(b.brain.mode, "windup");
  assert.equal(b.brain.x, 0);
});

function windedUp(player) {
  const a = stepBrain(spawnBrain("spider", at(0), 1), player, 0, 0.1, free);
  return stepBrain(a.brain, player, a.brain.until, 0.016, free).brain;
}

test("spider dashes along the locked direction, even if the player moves", () => {
  let b = windedUp(at(60));
  assert.equal(b.mode, "dash");
  b = stepBrain(b, at(0, 500), 2000, 0.1, free).brain;
  assert.ok(b.x > 0);
  assert.equal(b.y, 0);
});

test("spider dash stops at a wall and rests", () => {
  const b = windedUp(at(60));
  const wall = (from) => from;
  const r = stepBrain(b, at(60), 2000, 0.1, wall);
  assert.equal(r.brain.mode, "rest");
  assert.equal(r.brain.until, 2000 + 1000);
});

test("spider dash strikes once, ends at DASH_MAX, then rests", () => {
  let b = windedUp(at(60));
  let strikes = 0;
  let t = 2000;
  for (let i = 0; i < 40 && b.mode === "dash"; i++) {
    const r = stepBrain(b, at(30), t, 0.016, free);
    strikes += r.strike > 0 ? 1 : 0;
    b = r.brain;
    t += 16;
  }
  assert.equal(strikes, 1);
  assert.equal(b.mode, "rest");
  assert.ok(Math.abs(b.x - 80) < 1e-6);
});

test("a dash stepped with no time is not blocked", () => {
  const b = windedUp(at(60));
  const r = stepBrain(b, at(60), 2000, 0, free);
  assert.equal(r.brain.mode, "dash");
  assert.equal(r.brain.dashLeft, b.dashLeft);
});
