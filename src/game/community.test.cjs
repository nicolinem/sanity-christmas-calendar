/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  milestonesFor,
  characterFor,
  playersFromMilestones,
  sharesHints,
} = require("./community.ts");
const { DEFAULT_FIGURE } = require("./figure.ts");

test("only known quests create stable, deduplicated and server-titled events", () => {
  const input = {
    playerId: "abcdefgh",
    questIds: ["the-broken-forge", "the-broken-forge"],
  };
  assert.deepEqual(milestonesFor(input), [
    {
      _id: "questMilestone.abcdefgh.the-broken-forge",
      _type: "questMilestone",
      playerId: "abcdefgh",
      questId: "the-broken-forge",
      title: "Lag og publiser et våpen",
    },
  ]);
});

test("rejects unknown quest IDs, invalid player IDs and unbounded batches", () => {
  assert.equal(
    milestonesFor({ playerId: "demo", questIds: ["the-broken-forge"] }),
    null,
  );
  assert.equal(
    milestonesFor({ playerId: "abcdefgh", questIds: ["unknown"] }),
    null,
  );
  assert.equal(
    milestonesFor({ playerId: "abcdefgh", questIds: ["the-broken-forge", 5] }),
    null,
  );
  assert.equal(
    milestonesFor({
      playerId: "abcdefgh",
      questIds: Array(101).fill("the-broken-forge"),
    }),
    null,
  );
  assert.deepEqual(milestonesFor({ playerId: "abcdefgh", questIds: [] }), []);
});

test("player snapshot accepts only published weapon identifiers and short names", () => {
  assert.deepEqual(
    characterFor({
      playerId: "abcdefgh",
      character: {
        weapon: { name: "  Frostøksa  ", spriteId: "axe" },
      },
    }),
    {
      _id: "communityPlayer.abcdefgh",
      _type: "communityPlayer",
      playerId: "abcdefgh",
      visible: false,
      weapon: { name: "Frostøksa", spriteId: "axe" },
    },
  );
  assert.equal(
    characterFor({ playerId: "abcdefgh", character: { weapon: null } }).weapon,
    null,
  );
  // A bad weapon is left off instead of rejecting the whole player.
  for (const weapon of [
    { name: "", spriteId: "axe" },
    { name: "x".repeat(65), spriteId: "axe" },
    "sword",
  ])
    assert.equal(
      characterFor({ playerId: "abcdefgh", character: { weapon } }).weapon,
      null,
    );
  for (const spriteId of ["dragon", "other", "potion"])
    assert.deepEqual(
      characterFor({
        playerId: "abcdefgh",
        character: { weapon: { name: "Sword", spriteId } },
      }).weapon,
      { name: "Sword", spriteId: null },
    );
});

test("characters include players without milestones and count all unique milestones", () => {
  const players = playersFromMilestones(
    [
      { playerId: "abcdefgh", questId: "the-broken-forge" },
      { playerId: "abcdefgh", questId: "branns-ledger" },
      { playerId: "abcdefgh", questId: "branns-ledger" },
      { playerId: "ijklmnop", questId: "the-broken-forge" },
    ],
    [
      {
        playerId: "abcdefgh",
        weapon: { name: "Sverd", spriteId: "sword" },
        figure: DEFAULT_FIGURE,
        name: "Kari",
      },
      { playerId: "newcomer", weapon: null },
    ],
  );
  assert.deepEqual(players, [
    {
      playerId: "abcdefgh",
      completedCount: 2,
      completed: ["the-broken-forge", "branns-ledger"],
      forgeLevel: 2,
      weapon: { name: "Sverd", spriteId: "sword" },
      figure: DEFAULT_FIGURE,
      name: "Kari",
      hints: null,
      about: null,
    },
    {
      playerId: "ijklmnop",
      completedCount: 1,
      completed: ["the-broken-forge"],
      forgeLevel: 2,
      weapon: null,
      figure: null,
      name: null,
      hints: null,
      about: null,
    },
    {
      playerId: "newcomer",
      completedCount: 0,
      completed: [],
      forgeLevel: 1,
      weapon: null,
      figure: null,
      name: null,
      hints: null,
      about: null,
    },
  ]);
});
test("player snapshot stores a normalized figure and rejects oversized or odd ones", () => {
  const character = characterFor({
    playerId: "abcdefgh",
    character: {
      weapon: null,
      figure: { ...DEFAULT_FIGURE, hat: "none", skin: "no-such-skin" },
    },
  });
  assert.deepEqual(character.figure, { ...DEFAULT_FIGURE, hat: "none" });
  assert.equal(
    "figure" in
      characterFor({
        playerId: "abcdefgh",
        character: { weapon: null, figure: null },
      }),
    false,
  );
  for (const figure of [
    Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, "x"])),
    { hat: "x".repeat(25) },
    { hat: 5 },
    ["santa"],
    "santa",
  ])
    assert.equal(
      characterFor({
        playerId: "abcdefgh",
        character: { weapon: null, figure },
      }),
      null,
    );
});

test("player snapshot keeps a short, plain display name and omits a bad one", () => {
  assert.equal(
    characterFor({
      playerId: "abcdefgh",
      character: { weapon: null, name: "  Åse O'Neil-Berg 2 " },
    }).name,
    "Åse O'Neil-Berg 2",
  );
  for (const name of ["", "   ", "x".repeat(25), "<script>", 42]) {
    const character = characterFor({
      playerId: "abcdefgh",
      character: { weapon: null, name },
    });
    assert.ok(character);
    assert.equal("name" in character, false);
  }
});

test("player visibility requires explicit opt-in", () => {
  assert.equal(
    characterFor({ playerId: "abcdefgh", character: { visible: true } })
      .visible,
    true,
  );
  assert.equal(
    characterFor({ playerId: "abcdefgh", character: { visible: false } })
      .visible,
    false,
  );
  assert.equal(
    characterFor({ playerId: "abcdefgh", character: { visible: "yes" } }),
    null,
  );
});

test("hint counts are stored per luke only when shared, and stay small", () => {
  const shared = milestonesFor({
    playerId: "abcdefgh",
    questIds: ["the-broken-forge", "branns-ledger"],
    hints: { "the-broken-forge": 2 },
  });
  assert.deepEqual(
    shared.map(({ questId, hints }) => [questId, hints]),
    [
      ["the-broken-forge", 2],
      ["branns-ledger", 0],
    ],
  );
  assert.equal(
    milestonesFor({ playerId: "abcdefgh", questIds: [], hints: { x: 1 } }),
    null,
  );
  assert.equal(
    milestonesFor({
      playerId: "abcdefgh",
      questIds: [],
      hints: { "the-broken-forge": 99 },
    }),
    null,
  );
  assert.equal(sharesHints({ hints: {} }), true);
  assert.equal(sharesHints({ hints: null }), false);
  assert.equal(sharesHints({}), undefined);
  const players = playersFromMilestones(
    [
      { playerId: "abcdefgh", questId: "the-broken-forge", hints: 0 },
      { playerId: "ijklmnop", questId: "the-broken-forge" },
    ],
    [],
  );
  assert.deepEqual(players[0].hints, { "the-broken-forge": 0 });
  assert.equal(players[1].hints, null);
});

test("week progress counts a player's core lukes on their own track", () => {
  const { weekProgress } = require("./community.ts");
  const { CHAPTERS } = require("./quests/chapters.ts");
  const weeks = weekProgress(["the-broken-forge", "branns-ledger"]);
  assert.deepEqual(
    weeks.map((w) => w.week),
    CHAPTERS.map((c) => c.number),
  );
  assert.equal(weeks[0].done, 2);
  assert.ok(weeks.every((w) => w.total > 0 && w.done <= w.total));
  assert.equal(
    weekProgress([]).reduce((sum, w) => sum + w.done, 0),
    0,
  );
});

test("player snapshot stores a cleaned Om meg and rejects a broken one", () => {
  const base = {
    playerId: "abc123",
    character: { visible: true, weapon: null },
  };
  const ok = characterFor({
    ...base,
    character: {
      ...base.character,
      about: { food: " taco ", activity: "å bake", topics: ["GROQ"] },
    },
  });
  assert.deepEqual(ok.about, {
    food: "taco",
    activity: "bake",
    topics: ["GROQ"],
  });
  assert.equal(
    characterFor({
      ...base,
      character: { ...base.character, about: { topics: 5 } },
    }),
    null,
  );
  assert.equal("about" in characterFor(base), false);
});

test("players carry their Om meg, or null", () => {
  const about = { food: "taco", activity: "ski", topics: ["a", "b", "c"] };
  const players = playersFromMilestones(
    [],
    [
      { playerId: "aaa111", weapon: null, about },
      { playerId: "bbb222", weapon: null },
    ],
  );
  const byId = Object.fromEntries(players.map((p) => [p.playerId, p]));
  assert.deepEqual(byId.aaa111.about, about);
  assert.equal(byId.bbb222.about, null);
});
