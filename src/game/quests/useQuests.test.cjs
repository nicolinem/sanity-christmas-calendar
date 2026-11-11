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
  delete process.env.NEXT_PUBLIC_CALENDAR_START;
  delete require.cache[require.resolve("./engine.ts")];
  engine = require("./engine.ts");
} finally {
  if (previousStart === undefined)
    delete process.env.NEXT_PUBLIC_CALENDAR_START;
  else process.env.NEXT_PUBLIC_CALENDAR_START = previousStart;
}
const { EMPTY_PROGRESS } = require("./progress.ts");
const rules = require("../rules.ts");
const AT = "2026-01-01T00:00:00.000Z";

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
function harness(initial = {}) {
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
    "@/game/quests/chapters": { CHAPTERS },
    "@/game/quests/engine": engine,
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
      window: { location: { search: "?dev=quests" } },
      URLSearchParams,
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
      const board = exports.useQuestBoard({
        items: [],
        codeChecks: {},
        sanityConfigured: true,
        wraithDefeatedNow: false,
        progress: progress.progress,
        ...input,
      });
      return { ...progress, board, effects: [...effects] };
    },
  };
}

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
      assert.deepEqual(h.toasts.slice(-3), [
        { title: `Luke ${task.door} ferdig`, body: id, tone: "quest" },
        {
          title: `Lærdom: Lesson ${id}`,
          body: "Står under Lærdommer i kalenderen.",
          tone: "lesson",
        },
        {
          title: `Nivå ${expectedLevel}: våpnene blir sterkere`,
          body: `Alle våpnene dine gjør nå ${damage} skade.`,
          tone: "forge",
        },
      ]);
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
    assert.equal(h.toasts.length, 6);
    assert.equal(h.events.length, 2);
  });
}
