/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const { BLACKSMITH, NPCS, QUEST_SITES, isPath, pathRoute } = require("./village.ts");

test("the bodskilt has its own reachable interaction zone, outside Baker range", () => {
  const sign = QUEST_SITES.bakerySign;
  const baker = NPCS.bakeren;
  assert.ok(Math.hypot(sign.x - baker.x, sign.y - baker.y) > 56);
  assert.equal(isPath(Math.floor(sign.x / 16), Math.floor(sign.y / 16)), true);
});

test("walking to a place follows the paths and ends at the place", () => {
  for (const site of Object.values(QUEST_SITES)) {
    const route = pathRoute(BLACKSMITH, site);
    assert.deepEqual(route.at(-1), site);
    for (const point of route.slice(0, -1))
      assert.ok(
        isPath(Math.floor(point.x / 16), Math.floor(point.y / 16)),
        `${point.x},${point.y} is on a path`,
      );
  }
});
