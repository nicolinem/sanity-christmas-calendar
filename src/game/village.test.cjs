/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  BLACKSMITH,
  BUILDINGS,
  CAVE_ENTRANCE,
  CAVE_MOUTH,
  DOOR_ANCHORS,
  NPCS,
  PROPS,
  QUEST_SITES,
  WRAITH_HOME,
  isPath,
  npcQuestLine,
  pathRoute,
  shouldShowQuestNpc,
  villagePaths,
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
  // Beside the door, out of reach of the luke picked up there.
  const apart = Math.hypot(
    NPCS.kari.x - QUEST_SITES.westHouse.x,
    NPCS.kari.y - QUEST_SITES.westHouse.y,
  );
  assert.ok(apart > 28 && apart < 64, `Kari står ${apart}px fra døra`);
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

test("walks along the paths go round the well and other solid props", () => {
  const { PROPS, WRAITH_HOME } = require("./village.ts");
  const solid = new Set(
    PROPS.filter((p) => p.solid).map((p) => `${p.x},${p.y}`),
  );
  const trips = [
    [BLACKSMITH, { x: WRAITH_HOME.x - 24, y: WRAITH_HOME.y }],
    [QUEST_SITES.bakery, BLACKSMITH],
    [QUEST_SITES.westHouse, QUEST_SITES.bakery],
  ];
  for (const [from, to] of trips) {
    const route = [from, ...pathRoute(from, to)];
    // Every point on the way, a few pixels apart, stays off a solid prop.
    for (let i = 1; i < route.length - 1; i++) {
      const a = route[i - 1];
      const b = route[i];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
      for (let s = 0; s <= steps; s++) {
        const x = a.x + ((b.x - a.x) * s) / Math.max(1, steps);
        const y = a.y + ((b.y - a.y) * s) / Math.max(1, steps);
        const tile = `${Math.floor(x / 16)},${Math.floor(y / 16)}`;
        if (i > 1)
          assert.equal(solid.has(tile), false, `ruta går gjennom ${tile}`);
      }
    }
  }
});

const TODAYS_PATHS = [
  { x: 22, y: 7, w: 2, h: 8 },
  { x: 17, y: 14, w: 12, h: 4 },
  { x: 10, y: 9, w: 2, h: 4 },
  { x: 10, y: 11, w: 13, h: 2 },
  { x: 33, y: 8, w: 2, h: 8 },
  { x: 28, y: 15, w: 10, h: 2 },
  { x: 21, y: 18, w: 2, h: 12 },
  { x: 6, y: 20, w: 2, h: 3 },
  { x: 6, y: 21, w: 15, h: 2 },
];

test("the village paths are unchanged without the cave, and gain the way to the cave with it", () => {
  assert.deepEqual(villagePaths(false), TODAYS_PATHS);
  assert.deepEqual(villagePaths(true), [
    ...TODAYS_PATHS,
    { x: 16, y: 4, w: 2, h: 7 },
  ]);
});

test("the way to the cave runs on free ground and meets the west lane", () => {
  const way = { x: 16, y: 4, w: 2, h: 7 };
  for (let y = way.y; y < way.y + way.h; y++)
    for (let x = way.x; x < way.x + way.w; x++) {
      assert.equal(
        PROPS.some((p) => p.solid && p.x === x && p.y === y),
        false,
      );
      assert.equal(
        BUILDINGS.some(
          (b) =>
            x >= b.x &&
            x < b.x + b.rows[0].length &&
            y >= b.y &&
            y < b.y + b.rows.length,
        ),
        false,
      );
    }
  const westLane = TODAYS_PATHS[3];
  assert.equal(way.y + way.h, westLane.y);
  assert.ok(way.x >= westLane.x && way.x + way.w <= westLane.x + westLane.w);
});

test("the cave mouth stays clear of the HUD's left column on desktop", () => {
  // At 1280×720 the village is drawn at zoom 2 and the camera stops at the
  // world's west edge, so a tile's screen x is its world x × 2. The quest
  // tracker's column ends at about 324 css px.
  for (const [x] of CAVE_MOUTH) assert.ok(x * 16 * 2 > 340);
});

test("the cave zone keeps clear of the other zones", () => {
  const apart = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  for (const site of Object.values(QUEST_SITES))
    assert.ok(apart(CAVE_ENTRANCE, site) >= 56);
  for (const anchor of Object.values(DOOR_ANCHORS))
    assert.ok(apart(CAVE_ENTRANCE, anchor) >= 56);
  for (const npc of Object.values(NPCS))
    assert.ok(apart(CAVE_ENTRANCE, npc) >= 56);
  assert.ok(apart(CAVE_ENTRANCE, WRAITH_HOME) >= 68);
});

test("the cave mouth is on free ground, not on a prop or in a building", () => {
  for (const [x, y] of CAVE_MOUTH) {
    assert.equal(
      PROPS.some((p) => p.x === x && p.y === y),
      false,
    );
    assert.equal(
      BUILDINGS.some(
        (b) =>
          x >= b.x &&
          x < b.x + b.rows[0].length &&
          y >= b.y &&
          y < b.y + b.rows.length,
      ),
      false,
    );
  }
});
