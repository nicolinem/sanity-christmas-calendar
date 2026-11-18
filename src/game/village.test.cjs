/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  BLACKSMITH,
  NPCS,
  QUEST_SITES,
  isPath,
  npcQuestLine,
  pathRoute,
  shouldShowQuestNpc,
} = require("./village.ts");
const { CHAPTERS } = require("./quests/chapters.ts");

test("the bodskilt has its own reachable interaction zone, outside Baker range", () => {
  const sign = QUEST_SITES.bakerySign;
  const baker = NPCS.bakeren;
  assert.ok(Math.hypot(sign.x - baker.x, sign.y - baker.y) > 56);
  assert.equal(isPath(Math.floor(sign.x / 16), Math.floor(sign.y / 16)), true);
});

test("Kari waits at the west house where the player can ask about her order", () => {
  assert.equal(NPCS.kari.name, "Kari");
  assert.equal(NPCS.kari.site, "westHouse");
  assert.equal(NPCS.kari.x, QUEST_SITES.westHouse.x);
  assert.equal(NPCS.kari.y, QUEST_SITES.westHouse.y);
  assert.equal(npcQuestLine("kari", "morning-rush"), "Julekake, selvfølgelig!");
  assert.equal(npcQuestLine("kari", "baker-sign"), undefined);
});

test("Kari's map marker is limited to the active quest that asks for her", () => {
  const morningRush = CHAPTERS.flatMap((chapter) => chapter.quests).find(
    (quest) => quest.id === "morning-rush",
  );
  assert.equal(morningRush.asksNpc, "kari");
  assert.equal(NPCS.kari.at, "ved huset vest i bygda");
  for (const status of ["done", "offered", "locked"]) {
    assert.equal(
      shouldShowQuestNpc({ quest: morningRush, status }, "kari"),
      false,
    );
  }
  assert.equal(
    shouldShowQuestNpc({ quest: morningRush, status: "active" }, "kari"),
    true,
  );
  assert.equal(
    shouldShowQuestNpc(
      { quest: { ...morningRush, asksNpc: undefined }, status: "active" },
      "kari",
    ),
    false,
  );
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
