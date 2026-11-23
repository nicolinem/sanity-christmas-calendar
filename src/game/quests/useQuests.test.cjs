/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");

// The real engine captures calendar configuration on import. Disable date
// gating explicitly; the VM also disables dev unlock regardless of the host.
const previousStart = process.env.NEXT_PUBLIC_CALENDAR_START;
let engine;
try {
  // Empty, not missing: missing falls back to the release date.
  process.env.NEXT_PUBLIC_CALENDAR_START = "";
  process.env.NEXT_PUBLIC_SETUP_DAY = "";
  delete require.cache[require.resolve("../release.ts")];
  delete require.cache[require.resolve("./engine.ts")];
  engine = require("./engine.ts");
} finally {
  if (previousStart === undefined)
    delete process.env.NEXT_PUBLIC_CALENDAR_START;
  else process.env.NEXT_PUBLIC_CALENDAR_START = previousStart;
}
const { EMPTY_PROGRESS } = require("./progress.ts");
const rules = require("../rules.ts");
const { CHAPTERS: REAL_CHAPTERS } = require("./chapters.ts");
const AT = "2026-01-01T00:00:00.000Z";
const STUDIO = "branns-ledger";
const STUDIO_NEXT = "the-guilds-law";

// A second engine with a calendar start, for date-gated quests.
function loadEngineWithCalendar(calendarStart) {
  const previous = process.env.NEXT_PUBLIC_CALENDAR_START;
  process.env.NEXT_PUBLIC_CALENDAR_START = calendarStart;
  process.env.NEXT_PUBLIC_SETUP_DAY = "";
  try {
    delete require.cache[require.resolve("../release.ts")];
    delete require.cache[require.resolve("./engine.ts")];
    return require("./engine.ts");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_CALENDAR_START;
    else process.env.NEXT_PUBLIC_CALENDAR_START = previous;
  }
}

function quest(id, door, options = {}) {
  return {
    id,
    door,
    title: id,
    intro: [],
    goal: id,
    hints: [],
    lesson: { title: `Lesson ${id}`, text: id },
    checkedBy: "code",
    check: ({ codeChecks }) => ({ done: Boolean(codeChecks[id]?.done) }),
    ...options,
  };
}

const CHAPTERS = [
  {
    number: 1,
    title: "Start",
    quests: [
      quest("shared", 1, { reward: { forgeLevel: 1 } }),
      quest("tech", 2, { track: "technical", reward: { forgeLevel: 1 } }),
      quest("editor", 3, { track: "nonTechnical", reward: { forgeLevel: 2 } }),
      quest("tech-later", 4, { track: "technical" }),
    ],
  },
  { number: 2, title: "Later", quests: [quest("shared-tail", 5)] },
];
const filename = path.resolve(__dirname, "../../components/hud/useQuests.ts");
const source = transform(readFileSync(filename, "utf8"), {
  transforms: ["typescript", "imports"],
  filePath: filename,
}).code;

// Integration checks of real hook bodies + engine, not React lifecycle/browser
// tests. Effects are collected and can be replayed against the same snapshot.
function harness(
  initial = {},
  { chapters = CHAPTERS, engineModule = engine, fixedNow } = {},
) {
  let saved = { ...EMPTY_PROGRESS, ...initial };
  let effects = [];
  const toasts = [];
  const events = [];
  const dependencies = {
    react: {
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useEffect: (fn) => effects.push(fn),
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    "@/game/quests/chapters": { CHAPTERS: chapters },
    "@/game/quests/engine": engineModule,
    "@/game/rules": rules,
    "@/game/quests/progress": {
      EMPTY_PROGRESS,
      PROGRESS_PROJECT: "test",
      readProgress: () => saved,
      updateProgress: (_project, change) => {
        saved = change(saved);
      },
      resetProgress: () => {
        saved = EMPTY_PROGRESS;
      },
      subscribeProgress: () => () => {},
    },
    "@/game/bridge": {
      bridge: {
        on: () => () => {},
        emit: (...args) => events.push(args),
      },
    },
    "@/game/bakery": require("../bakery.ts"),
    "./richText": { plainText: (text) => text },
    "./Toasts": { pushToast: (toast) => toasts.push({ ...toast }) },
  };
  const exports = {};
  vm.runInNewContext(
    source,
    {
      exports,
      require: (id) => {
        assert.ok(
          Object.hasOwn(dependencies, id),
          `Unexpected dependency: ${id}`,
        );
        return dependencies[id];
      },
      process: { env: { NODE_ENV: "production" } },
      window: { location: { search: "?dev" } },
      URLSearchParams,
      Date: fixedNow
        ? class extends Date {
            constructor(...args) {
              super(...(args.length ? args : [fixedNow]));
            }
          }
        : Date,
    },
    { filename },
  );

  return {
    get saved() {
      return saved;
    },
    set saved(next) {
      saved = next;
    },
    toasts,
    events,
    render(input = {}) {
      effects = [];
      const progress = exports.useProgress();
      const result = exports.useQuestBoard({
        items: [],
        codeChecks: {},
        sanityConfigured: true,
        wraithDefeatedNow: false,
        progress: progress.progress,
        ...input,
      });
      return {
        ...progress,
        board: result,
        effects: [...effects],
      };
    },
  };
}

test("finishing the first Bakery order remembers its published ID", () => {
  const h = harness(
    { track: "nonTechnical", briefed: { "baker-model": true } },
    {
      chapters: [
        {
          number: 3,
          title: "Bakeren",
          quests: [
            quest("baker-model", 7, {
              track: "nonTechnical",
              checkedBy: "game",
              check: ({ bakeryOrders }) => ({
                done: Boolean(bakeryOrders?.length),
              }),
            }),
          ],
        },
      ],
    },
  );
  const orders = [
    {
      _id: "bakery-sample-brann",
      item: "Lussekatter",
      date: "2026-12-14",
      status: "ny",
    },
    { _id: "order-1", item: "Julekake", date: "2026-12-14", status: "ny" },
    {
      _id: "order-2",
      item: "Lussekatter",
      date: "2026-12-14",
      status: "ny",
      createdAt: "2026-12-15",
    },
  ];
  const { effects } = h.render({ bakeryOrders: orders });
  effects.forEach((effect) => effect());
  assert.equal(h.saved.bakeryOrderId, "order-2");
});

for (const [track, selected, foreign, total, level] of [
  ["technical", "tech", "editor", 4, 3],
  ["nonTechnical", "editor", "tech", 3, 4],
]) {
  test(`${track}: hooks use selected board totals and shared/track forge rewards`, () => {
    const h = harness({
      track,
      completed: { shared: AT, tech: AT, editor: AT },
    });
    const { board, forgeLevel } = h.render();
    assert.equal(board.total, total);
    assert.equal(board.completedCount, 2);
    assert.equal(forgeLevel, level);
    assert.equal(
      board.states.some(({ quest }) => quest.id === foreign),
      false,
    );
    assert.equal(
      board.states.some(({ quest }) => quest.id === selected),
      true,
    );
    assert.equal(
      board.current.quest.id,
      track === "technical" ? "tech-later" : "shared-tail",
    );

    h.saved = { ...h.saved, completed: { [foreign]: AT } };
    const foreignOnly = h.render();
    assert.equal(foreignOnly.forgeLevel, 1);
    assert.equal(foreignOnly.board.completedCount, 0);
  });

  test(`${track}: captured dev jump uses latest saved track and preserves other-track facts`, () => {
    const h = harness({
      track: track === "technical" ? "nonTechnical" : "technical",
    });
    const { jumpTo } = h.render();
    const completed = {
      shared: AT,
      tech: AT,
      editor: AT,
      "tech-later": AT,
      "shared-tail": AT,
    };
    const briefed = Object.fromEntries(
      Object.keys(completed).map((id) => [id, true]),
    );
    h.saved = { ...h.saved, track, completed, briefed };
    const before = h.saved;
    jumpTo(foreign, true);
    assert.equal(h.saved, before, "foreign IDs must be a true no-op");
    jumpTo("missing", true);
    assert.equal(h.saved, before, "missing IDs must be a true no-op");

    jumpTo(selected, true);
    assert.equal(h.saved.track, track);
    assert.deepEqual(
      Object.keys(h.saved.completed).sort(),
      [
        "shared",
        foreign,
        ...(track === "nonTechnical" ? ["tech-later"] : []),
      ].sort(),
    );
    assert.ok(Number.isFinite(Date.parse(h.saved.completed.shared)));
    assert.equal(h.saved.completed[foreign], AT);
    assert.equal(h.saved.briefed[foreign], true);
    assert.equal(h.saved.briefed[selected], true);
    assert.equal(h.saved.briefed["shared-tail"], undefined);
    assert.equal(h.saved.introSeen, true);
    assert.equal(h.saved.metBlacksmith, true);
    assert.equal(h.saved.wraithDefeated, true);
    if (track === "nonTechnical") {
      assert.equal(h.saved.completed["tech-later"], AT);
      assert.equal(h.saved.briefed["tech-later"], true);
    } else {
      assert.equal(h.saved.briefed["tech-later"], undefined);
    }

    jumpTo(selected, false);
    assert.equal(h.saved.briefed[selected], undefined);
    jumpTo("__end", true);
    assert.deepEqual(
      Object.keys(h.saved.completed).sort(),
      Object.keys(completed).sort(),
    );
    assert.deepEqual({ ...h.saved.briefed }, briefed);
    assert.equal(h.saved.completed[foreign], AT);
    assert.equal(h.saved.completed.__end, undefined);
    assert.equal(h.saved.briefed.__end, undefined);
    const end = h.render();
    assert.equal(end.board.completedCount, total);
    assert.equal(end.board.current, null);
    assert.equal(end.forgeLevel, level);
  });

  test(`${track}: only active passing quests complete, selected rewards survive effect replay`, () => {
    const h = harness({
      track,
      completed: { [foreign]: AT },
      briefed: { [selected]: true },
    });
    const codeChecks = Object.fromEntries(
      CHAPTERS.flatMap(({ quests }) =>
        quests.map(({ id }) => [id, { done: true }]),
      ),
    );
    const offered = h.render({ codeChecks });
    assert.equal(offered.board.current.status, "offered");
    assert.equal(
      offered.board.states.find(({ quest }) => quest.id === selected).status,
      "locked",
    );
    assert.ok(offered.board.states.every(({ result }) => result.done));
    const unchanged = h.saved;
    offered.effects.forEach((effect) => effect());
    assert.equal(h.saved, unchanged);
    assert.deepEqual(h.toasts, []);
    assert.deepEqual(h.events, []);

    h.saved = { ...h.saved, briefed: { ...h.saved.briefed, shared: true } };
    for (const [id, expectedLevel, damage] of [
      ["shared", 2, 6],
      [selected, level, track === "technical" ? 8 : 10],
    ]) {
      const active = h.render({ codeChecks });
      assert.equal(active.board.current.quest.id, id);
      assert.equal(active.board.current.status, "active");
      active.effects.forEach((effect) => effect());
      assert.ok(Number.isFinite(Date.parse(h.saved.completed[id])));
      assert.equal(h.saved.completed[foreign], AT);
      assert.equal(h.saved.completed["shared-tail"], undefined);
      assert.equal(h.saved.completed["tech-later"], undefined);
      const task = CHAPTERS[0].quests.find((q) => q.id === id);
      assert.deepEqual(
        h.toasts,
        [],
        "reward is shown in the celebration, not behind it",
      );
      assert.equal(h.events.at(-2)[0], "questCelebration");
      assert.equal(h.events.at(-2)[1].door, task.door);
      assert.equal(h.events.at(-2)[1].title, task.title);
      assert.equal(h.events.at(-2)[1].lesson, `Lesson ${id}`);
      assert.equal(
        h.events.at(-2)[1].nextDoor,
        id === "shared"
          ? track === "technical"
            ? 2
            : 3
          : track === "technical"
            ? 4
            : 5,
      );
      assert.deepEqual(
        { ...h.events.at(-2)[1].level },
        { number: expectedLevel, damage },
      );
      assert.deepEqual(h.events.at(-1), ["forgeLevelUp", expectedLevel]);
      const saved = h.saved;
      const toastCount = h.toasts.length;
      const eventCount = h.events.length;
      active.effects.forEach((effect) => effect());
      assert.equal(
        h.saved,
        saved,
        "replaying the same render must not write completion again",
      );
      assert.equal(h.toasts.length, toastCount);
      assert.equal(h.events.length, eventCount);
      assert.equal(h.render({ codeChecks }).forgeLevel, expectedLevel);
    }
    assert.equal(h.render({ codeChecks }).board.completedCount, 2);
    assert.equal(h.toasts.length, 0);
    assert.equal(h.events.length, 4);
  });
}

// Code-window quests run against the real chapters.
const stateOf = (board, id) =>
  board.states.find(({ quest }) => quest.id === id);

function studioHarness(initial = {}, options = {}) {
  return harness(
    {
      track: "technical",
      completed: { "the-broken-forge": AT },
      briefed: { [STUDIO]: true },
      fetched: { [STUDIO]: true },
      solved: { [STUDIO]: { at: AT } },
      ...initial,
    },
    { chapters: REAL_CHAPTERS, ...options },
  );
}

test("solving code completes the quest and offers the next without a Studio visit", () => {
  const h = studioHarness({ solved: {} });
  let view = h.render();
  view.effects.forEach((effect) => effect());
  assert.equal(view.board.current.quest.id, STUDIO);
  assert.equal(view.board.current.status, "active");
  assert.equal(view.board.current.result.done, false);
  assert.equal(h.saved.completed[STUDIO], undefined);

  h.saved = { ...h.saved, solved: { [STUDIO]: { at: AT } } };
  view = h.render({ codeQuestId: STUDIO });
  assert.equal(view.board.current.result.done, true);
  view.effects.forEach((effect) => effect());
  assert.equal(h.saved.completed[STUDIO], undefined);
  assert.deepEqual(
    h.events,
    [],
    "no celebration while the code window is open",
  );

  view = h.render({ codeQuestId: null });
  view.effects.forEach((effect) => effect());
  const completed = h.saved.completed;
  assert.ok(Number.isFinite(Date.parse(completed[STUDIO])));
  assert.deepEqual(h.toasts, []);
  assert.equal(h.events.at(-1)[0], "questCelebration");
  assert.equal(h.events.at(-1)[1].door, 2);
  assert.equal(h.events.at(-1)[1].title, "Ikon og preview i lista");
  assert.deepEqual(Array.from(h.events.at(-1)[1].objectives), [
    "Koden er bestått",
  ]);
  assert.equal(h.events.at(-1)[1].nextDoor, 3);
  assert.equal(h.events.at(-1)[1].lesson, "*Previews*");

  view = h.render();
  view.effects.forEach((effect) => effect());
  assert.equal(h.saved.completed, completed, "completion is not written twice");
  assert.equal(h.toasts.length, 0);
  assert.equal(stateOf(view.board, STUDIO).status, "done");
  assert.equal(stateOf(view.board, STUDIO_NEXT).status, "offered");
});

test("finishing before the next week's calendar date does not announce a new door", () => {
  const h = harness(
    {
      track: "technical",
      completed: { shared: AT, tech: AT },
      briefed: { "tech-later": true },
    },
    {
      engineModule: loadEngineWithCalendar("2026-12-01"),
      fixedNow: "2026-12-02T12:00:00Z",
    },
  );
  const view = h.render({ codeChecks: { "tech-later": { done: true } } });
  assert.equal(view.board.current.quest.id, "tech-later");
  view.effects.forEach((effect) => effect());
  assert.equal(h.events.at(-1)[0], "questCelebration");
  assert.equal(h.events.at(-1)[1].nextDoor, undefined);
  assert.equal(h.render().board.current, null);
});
