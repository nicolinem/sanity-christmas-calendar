/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");

// The shipped calendar: luke 1 on 26 November, weeks on 1, 7 and 14 December.
process.env.NEXT_PUBLIC_CALENDAR_START = "2026-12-01";
process.env.NEXT_PUBLIC_SETUP_DAY = "2026-11-26";
const { STUDIO_TYPE_OPENERS, studioTypesOpen } = require("./studioTypes.ts");
const { chaptersForTrack } = require("./quests/engine.ts");
const { CHAPTERS } = require("./quests/chapters.ts");
const { EMPTY_PROGRESS } = require("./quests/progress.ts");
const { SIDE_QUESTS } = require("./sideQuests/data.ts");

const WEEK_1 = new Date("2026-12-02T12:00:00");
const WEEK_2 = new Date("2026-12-08T12:00:00");
const WEEK_3 = new Date("2026-12-15T12:00:00");

// Like «Hopp hit» in the dev panel: every luke before `questId` is done.
function jumpTo(track, questId) {
  const order = chaptersForTrack(CHAPTERS, track).flatMap((c) =>
    c.quests.map((q) => q.id),
  );
  const before = questId ? order.slice(0, order.indexOf(questId)) : order;
  assert.ok(!questId || order.includes(questId), `${questId} in ${track}`);
  return {
    ...EMPTY_PROGRESS,
    track,
    completed: Object.fromEntries(before.map((id) => [id, "2026-12-01"])),
  };
}

function shown(track, questId, now, ignoreDates) {
  return studioTypesOpen(
    chaptersForTrack(CHAPTERS, track),
    jumpTo(track, questId),
    now,
    ignoreDates,
  ).sort();
}

const WEEK_2_TYPES = ["observation", "place", "witness"];

test("week 1 shows only Item, in both tracks", () => {
  assert.deepEqual(shown("technical", "the-broken-forge", WEEK_1), []);
  assert.deepEqual(shown("nonTechnical", "the-broken-forge", WEEK_1), []);
  // Week 1 finished, but week 2 hasn't come yet.
  assert.deepEqual(shown("technical", "follow-the-trail", WEEK_1), []);
  assert.deepEqual(shown("nonTechnical", "archive-model", WEEK_1), []);
});

test("technical track: the types come with the lukes that use them", () => {
  assert.deepEqual(shown("technical", "follow-the-trail", WEEK_2), [
    ...WEEK_2_TYPES,
  ]);
  // Week 2 finished, waiting for week 3: still no orders.
  assert.deepEqual(shown("technical", "baker-template", WEEK_2), [
    ...WEEK_2_TYPES,
  ]);
  assert.deepEqual(
    shown("technical", "baker-template", WEEK_3),
    ["bakeryOrder", ...WEEK_2_TYPES].sort(),
  );
  assert.deepEqual(
    shown("technical", "baker-forge", WEEK_3),
    ["bakeryOrder", ...WEEK_2_TYPES].sort(),
  );
  // Luke 11's function writes to the sign.
  assert.deepEqual(
    shown("technical", "baker-function", WEEK_3),
    ["bakeryOrder", "bakerySign", ...WEEK_2_TYPES].sort(),
  );
  // The saksmappe is a non-technical luke: Case never shows here.
  assert.ok(!shown("technical", null, WEEK_3).includes("case"));
});

test("non-technical track: Case with luke 6, Bodskilt with luke 8", () => {
  assert.deepEqual(shown("nonTechnical", "archive-model", WEEK_2), [
    ...WEEK_2_TYPES,
  ]);
  assert.deepEqual(shown("nonTechnical", "who-is-lying", WEEK_2), [
    ...WEEK_2_TYPES,
  ]);
  assert.deepEqual(
    shown("nonTechnical", "case-file", WEEK_2),
    ["case", ...WEEK_2_TYPES].sort(),
  );
  assert.deepEqual(
    shown("nonTechnical", "baker-model", WEEK_3),
    ["bakeryOrder", "case", ...WEEK_2_TYPES].sort(),
  );
  assert.deepEqual(
    shown("nonTechnical", "baker-sign", WEEK_3),
    ["bakeryOrder", "bakerySign", "case", ...WEEK_2_TYPES].sort(),
  );
});

test("?dev skips the dates, but the lukes before must still be done", () => {
  const today = new Date("2026-11-27T12:00:00");
  assert.deepEqual(shown("technical", "follow-the-trail", today), []);
  assert.deepEqual(shown("technical", "follow-the-trail", today, true), [
    ...WEEK_2_TYPES,
  ]);
  assert.deepEqual(shown("technical", "the-broken-forge", today, true), []);
});

test("every opener is a luke or a side quest, and each week opens with its types", () => {
  const ids = new Set([
    ...CHAPTERS.flatMap((c) => c.quests.map((q) => q.id)),
    ...SIDE_QUESTS.map((q) => q.id),
  ]);
  for (const [type, openers] of Object.entries(STUDIO_TYPE_OPENERS))
    for (const id of openers) assert.ok(ids.has(id), `${type}: ${id}`);
  for (const track of ["technical", "nonTechnical"]) {
    const chapters = chaptersForTrack(CHAPTERS, track);
    const first = (n) => chapters.find((c) => c.number === n).quests[0].id;
    for (const type of WEEK_2_TYPES)
      assert.ok(STUDIO_TYPE_OPENERS[type].includes(first(2)), track);
    assert.ok(STUDIO_TYPE_OPENERS.bakeryOrder.includes(first(3)), track);
  }
});

test("every locked type is a document type in the schema", () => {
  const dir = `${__dirname}/../sanity/schemaTypes`;
  const names = new Set(
    require("node:fs")
      .readdirSync(dir)
      .flatMap((file) => [
        ...readFileSync(`${dir}/${file}`, "utf8").matchAll(
          /defineType\(\{\s*name: "(\w+)"/g,
        ),
      ])
      .map((match) => match[1]),
  );
  assert.ok(names.has("item"));
  for (const type of Object.keys(STUDIO_TYPE_OPENERS))
    assert.ok(names.has(type), type);
});

test("«Det Kari så» waits for a week 2 luke, so its types are already there", () => {
  const kari = SIDE_QUESTS.find((q) => q.id === "kari-saw");
  for (const luke of kari.requires.luke) {
    const { track } = CHAPTERS.flatMap((c) => c.quests).find(
      (q) => q.id === luke,
    );
    const types = shown(track, luke, WEEK_2);
    for (const type of WEEK_2_TYPES) assert.ok(types.includes(type), luke);
  }
});

// --- The Studio: lists and «+» --------------------------------------------------

function load(file, dependencies) {
  const mod = { exports: {} };
  vm.runInNewContext(
    transform(readFileSync(`${__dirname}/../../${file}`, "utf8"), {
      transforms: ["typescript", "imports"],
    }).code,
    {
      module: mod,
      exports: mod.exports,
      require: (id) => {
        assert.ok(
          Object.hasOwn(dependencies, id),
          `Unexpected dependency: ${id}`,
        );
        return dependencies[id];
      },
    },
  );
  return mod.exports;
}

// Just enough of the Structure Builder: every call chains, and ids are kept.
function builder(types) {
  const node = (state = {}) => {
    const proxy = new Proxy(state, {
      get(target, key) {
        if (key === "getId") return () => target.id;
        if (key === "getItems") return () => target.items;
        return (value) => {
          if (key === "id" || key === "items") target[key] = value;
          return proxy;
        };
      },
    });
    return proxy;
  };
  return {
    list: () => node(),
    listItem: () => node(),
    documentList: () => node(),
    documentTypeList: () => node(),
    document: () => node(),
    divider: () => node({ id: "-" }),
    documentTypeListItems: () => types.map((id) => node({ id })),
  };
}

const ALL_TYPES = [
  "item",
  "observation",
  "place",
  "witness",
  "case",
  "bakeryOrder",
  "bakerySign",
];

function loadStructure(state) {
  let onChange = () => {};
  const { structure } = load("src/sanity/studio/structure.ts", {
    rxjs: require("rxjs"),
    "@sanity/icons/CheckmarkCircle": { CheckmarkCircleIcon: () => null },
    "@sanity/icons/Pin": { PinIcon: () => null },
    "../lib/solved": {
      isSolved: (id) => Boolean(state.solved?.[id]),
      isTrack: (track) => (state.track ?? "technical") === track,
      isTypeShown: (type) => type === "item" || state.types.includes(type),
      watchProgress: (callback) => {
        onChange = callback;
        return () => {};
      },
    },
    "./ObservationsHere": { ObservationsHere: () => null },
    "../../game/archive": { ARCHIVE_IDS: [] },
  });
  const lists = [];
  structure(builder(ALL_TYPES)).subscribe((list) =>
    lists.push(Array.from(list.getItems(), (item) => item.getId())),
  );
  return { lists, change: () => onChange() };
}

test("Studio lists: Item alone in week 1, then each type as it opens", () => {
  const state = { types: [] };
  const { lists, change } = loadStructure(state);
  assert.deepEqual(lists, [["item"]]);

  // The game saves progress that changes nothing here: no new list.
  change();
  assert.equal(lists.length, 1);

  state.types = [...WEEK_2_TYPES];
  change();
  assert.deepEqual(lists.at(-1), ["item", "observation", "place", "witness"]);

  state.types = ["bakeryOrder", "bakerySign", ...WEEK_2_TYPES];
  change();
  assert.deepEqual(lists.at(-1), [
    "item",
    "observation",
    "place",
    "witness",
    "bakeryOrder",
    "baker-skilt",
  ]);
});

test("Studio lists: the non-technical track gets Case and its own Observations", () => {
  const state = {
    track: "nonTechnical",
    types: [...WEEK_2_TYPES, "case"],
    solved: { "archive-model": true },
  };
  const { lists } = loadStructure(state);
  assert.deepEqual(lists.at(-1), [
    "bekreftede",
    "per-sted",
    "-",
    "item",
    "place",
    "witness",
    "case",
    "player-observations",
  ]);
});

test("«+» leaves out the types that haven't opened", () => {
  const shownTypes = new Set(["item", "place"]);
  const config = load("src/sanity/studio/config.ts", {
    "../../../sanity.config": {
      __esModule: true,
      default: {
        name: "test",
        document: {
          // The player's own filter still runs first.
          newDocumentOptions: (previous) =>
            previous.filter((o) => o.templateId !== "order-Kari"),
        },
      },
    },
    "../lib/solved": {
      isTypeShown: (type) => shownTypes.has(type) || !STUDIO_TYPE_OPENERS[type],
    },
  }).default;
  const options = [
    "item",
    "observation",
    "place",
    "witness",
    "case",
    "bakeryOrder",
    "bakerySign",
    "order-Kari",
  ].map((templateId) => ({ templateId }));
  assert.equal(config.name, "test");
  assert.deepEqual(
    Array.from(
      config.document.newDocumentOptions(options),
      (o) => o.templateId,
    ),
    ["item", "place"],
  );
});
