/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const { SIDE_QUESTS, SIDE_SPOTS } = require("./data.ts");
const { CHAPTERS } = require("../quests/chapters.ts");
const { EMPTY_PROGRESS } = require("../quests/progress.ts");
const { FIGURE_OPTIONS, HIDDEN_GEAR } = require("../figure.ts");
const { BUILTIN_ITEMS, DEMO_ITEMS } = require("../items.ts");
const {
  BUILDINGS,
  DOOR_ANCHORS,
  NPCS,
  PROPS,
  QUEST_SITES,
  WRAITH_HOME,
  isPath,
} = require("../village.ts");

// Interaction ranges in WinterQuestScene.ts: two zones never overlap when
// their centres are at least the sum of their ranges apart.
const FORGE_RANGE = 28;
const WRAITH_RANGE = 40;

const LUKE_IDS = new Set(
  CHAPTERS.flatMap((chapter) => chapter.quests.map((quest) => quest.id)),
);

const texts = (quest) => [
  quest.title,
  ...quest.ask,
  quest.goal,
  quest.thanks,
  ...quest.steps.map((step) => step.label),
  ...(quest.hint ? [quest.hint.text] : []),
];

test("side quest ids are unique and never a luke id", () => {
  const ids = SIDE_QUESTS.map((quest) => quest.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.equal(LUKE_IDS.has(id), false, id);
});

test("every page the giver says is at most two sentences", () => {
  for (const quest of SIDE_QUESTS)
    for (const page of quest.ask) {
      const sentences = page.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim());
      assert.ok(sentences.length <= 2, `${quest.id}: «${page}»`);
    }
});

test("no emoji in side quest text", () => {
  for (const quest of SIDE_QUESTS)
    for (const text of texts(quest))
      assert.doesNotMatch(text, /\p{Extended_Pictographic}/u, quest.id);
});

test("each reward unlocks hidden gear, and no gear has two sources", () => {
  const seen = new Set();
  for (const quest of SIDE_QUESTS)
    for (const unlock of quest.reward.unlock ?? []) {
      const [kind, part, id] = unlock.split(":");
      assert.equal(kind, "gear", unlock);
      const option = FIGURE_OPTIONS[part]?.find((o) => o.id === id);
      assert.equal(option?.unlock, HIDDEN_GEAR, unlock);
      assert.equal(seen.has(unlock), false, `${unlock} has two sources`);
      seen.add(unlock);
    }
});

test("find steps point at spots that exist, and spot ids are unique", () => {
  const ids = SIDE_SPOTS.map((spot) => spot.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const quest of SIDE_QUESTS)
    for (const step of quest.steps)
      if (step.kind === "find")
        assert.ok(ids.includes(step.spot), `${quest.id}: ${step.spot}`);
});

test("spots keep clear of every luke place, person and the wraith", () => {
  const taken = [
    ...Object.entries(QUEST_SITES).map(([id, s]) => [`site ${id}`, s]),
    ...Object.entries(DOOR_ANCHORS).map(([id, s]) => [`door ${id}`, s]),
    ...Object.values(NPCS).map((n) => [`npc ${n.id}`, n]),
  ];
  for (const spot of SIDE_SPOTS) {
    for (const [name, at] of taken) {
      const d = Math.hypot(spot.x - at.x, spot.y - at.y);
      assert.ok(d >= 2 * FORGE_RANGE, `${spot.id} er ${d}px fra ${name}`);
    }
    const w = Math.hypot(spot.x - WRAITH_HOME.x, spot.y - WRAITH_HOME.y);
    assert.ok(
      w >= FORGE_RANGE + WRAITH_RANGE,
      `${spot.id} er ${w}px fra draugen`,
    );
    for (const other of SIDE_SPOTS) {
      if (other === spot) continue;
      const d = Math.hypot(spot.x - other.x, spot.y - other.y);
      assert.ok(d >= 2 * FORGE_RANGE, `${spot.id} er ${d}px fra ${other.id}`);
    }
  }
});

test("spots stand where the knight can walk: by a path, clear of houses and props", () => {
  for (const spot of SIDE_SPOTS) {
    const tx = Math.floor(spot.x / 16);
    const ty = Math.floor(spot.y / 16);
    const byPath = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => isPath(tx + dx, ty + dy));
    assert.ok(byPath, `${spot.id} ligger ikke ved en sti`);
    assert.equal(
      PROPS.some((p) => p.x === tx && p.y === ty),
      false,
      spot.id,
    );
    assert.equal(
      BUILDINGS.some(
        (b) =>
          tx >= b.x &&
          tx < b.x + b.rows[0].length &&
          ty >= b.y &&
          ty <= b.y + b.rows.length,
      ),
      false,
      spot.id,
    );
  }
});

const studioCheck = (id) =>
  SIDE_QUESTS.find((quest) => quest.id === id).steps.find(
    (step) => step.kind === "studio",
  ).check;

const ctx = (items) => ({
  items,
  progress: EMPTY_PROGRESS,
  codeChecks: {},
  sanityConfigured: true,
});

test("Noe varmt needs a drink the player published, not a built-in one", () => {
  const check = studioCheck("warm-drink");
  assert.equal(check(ctx([...BUILTIN_ITEMS, ...DEMO_ITEMS])).done, false);
  const built = { ...DEMO_ITEMS[0], kind: "potion" };
  assert.equal(check(ctx([built])).done, false);
  const mine = { ...built, source: "sanity" };
  assert.equal(check(ctx([mine])).done, true);
});

test("Malm til smia needs a published material with a real description", () => {
  const check = studioCheck("ore-for-the-forge");
  const ore = {
    ...DEMO_ITEMS[1],
    source: "sanity",
    kind: "material",
    description: "",
  };
  assert.equal(check(ctx([DEMO_ITEMS[1]])).done, false);
  assert.equal(check(ctx([ore])).done, false);
  assert.equal(check(ctx([{ ...ore, description: "Malm" }])).done, false);
  assert.equal(
    check(ctx([{ ...ore, description: "Funnet i bekken ved skogkanten." }]))
      .done,
    true,
  );
  assert.equal(
    check(
      ctx([
        {
          ...ore,
          kind: "weapon",
          description: "Funnet i bekken ved skogkanten.",
        },
      ]),
    ).done,
    false,
  );
});

test("Det Kari så needs Kari as witness and Gjerdet as place", () => {
  const check = studioCheck("kari-saw");
  const run = (ownObservations) => check({ ...ctx([]), ownObservations }).done;
  assert.equal(run(null), false);
  assert.equal(run([]), false);
  assert.equal(
    run([{ _id: "o1", witness: "witness-kari", place: "place-torget" }]),
    false,
  );
  assert.equal(
    run([{ _id: "o1", witness: "witness-ola", place: "place-gjerdet" }]),
    false,
  );
  assert.equal(
    run([{ _id: "o1", witness: "witness-kari", place: "place-gjerdet" }]),
    true,
  );
  // The wrong place gets its own message.
  assert.match(
    check({
      ...ctx([]),
      ownObservations: [{ _id: "o1", witness: "witness-kari" }],
    }).message,
    /ikke Gjerdet/,
  );
});

test("Kurven needs three different sprites, not weapons and not built-ins", () => {
  const check = studioCheck("market-basket");
  const item = (id, kind, spriteId, source = "sanity") => ({
    id,
    kind,
    spriteId,
    source,
  });
  assert.equal(
    check(
      ctx([
        item("a", "potion", "potion"),
        item("b", "potion", "potion"),
        item("c", "material", "ice-cube"),
      ]),
    ).done,
    false,
  );
  assert.equal(
    check(
      ctx([
        item("a", "potion", "potion"),
        item("b", "material", "ice-cube"),
        item("c", "weapon", "sword"),
        item("d", "material", "gem", "builtin"),
      ]),
    ).done,
    false,
  );
  const three = check(
    ctx([
      item("a", "potion", "potion"),
      item("b", "material", "ice-cube"),
      item("c", "material", "gem"),
    ]),
  );
  assert.equal(three.done, true);
  assert.match(check(ctx([item("a", "potion", "potion")])).message, /1 av 3/);
});

test("Kari's second wish waits for her first and for the saksmappe", () => {
  const quest = SIDE_QUESTS.find((q) => q.id === "kari-saw");
  assert.deepEqual(quest.requires.side, ["warm-drink"]);
  assert.ok(quest.requires.luke.includes("case-file"));
  assert.ok(quest.requires.luke.includes("who-points-here"));
});
