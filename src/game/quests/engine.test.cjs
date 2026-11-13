/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

// engine.ts captures the calendar environment at import time.
function loadEngine(calendarStart) {
  const previous = process.env.NEXT_PUBLIC_CALENDAR_START;
  if (calendarStart === undefined)
    delete process.env.NEXT_PUBLIC_CALENDAR_START;
  else process.env.NEXT_PUBLIC_CALENDAR_START = calendarStart;
  try {
    delete require.cache[require.resolve("./engine.ts")];
    return require("./engine.ts");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_CALENDAR_START;
    else process.env.NEXT_PUBLIC_CALENDAR_START = previous;
  }
}

const { chaptersForTrack, evaluateQuests, forgeLevelFor } = loadEngine();
const { EMPTY_PROGRESS } = require("./progress.ts");
const { CHAPTERS, theForgeButton } = require("./chapters.ts");
const NOW = new Date("2026-12-01T12:00:00Z");
const COMPLETED_AT = "2026-11-30T12:00:00Z";

function quest(id, options = {}) {
  return {
    id,
    door: 1,
    title: id,
    intro: [],
    goal: id,
    hints: [],
    lesson: { title: id, text: id },
    checkedBy: "code",
    check: ({ codeChecks }) => ({ done: Boolean(codeChecks[id]?.done) }),
    ...options,
  };
}

function chapter(number, quests = []) {
  return { number, title: `Chapter ${number}`, quests };
}

function context(progress = {}, codeChecks = {}) {
  return {
    items: [],
    progress: { ...EMPTY_PROGRESS, ...progress },
    codeChecks,
    sanityConfigured: true,
  };
}

function ids(chapters) {
  return chapters.map(({ quests }) => quests.map(({ id }) => id));
}

test("track selection filters within each chapter, retaining shared tasks and metadata", () => {
  const chapters = [
    chapter(1, [
      quest("shared"),
      quest("tech", { track: "technical" }),
      quest("editor", { track: "nonTechnical" }),
    ]),
    {
      ...chapter(2, [quest("tech-two", { track: "technical" })]),
      teaser: ["Later"],
    },
    chapter(3),
  ];
  const original = ids(chapters);
  const technical = chaptersForTrack(chapters, "technical");
  const nonTechnical = chaptersForTrack(chapters, "nonTechnical");

  assert.deepEqual(ids(technical), [["shared", "tech"], ["tech-two"], []]);
  assert.deepEqual(ids(nonTechnical), [["shared", "editor"], [], []]);
  assert.deepEqual(
    nonTechnical.map(({ number }) => number),
    [1, 2, 3],
  );
  assert.deepEqual(nonTechnical[1].teaser, ["Later"]);
  assert.equal(technical[0].title, chapters[0].title);
  assert.equal(technical[0].quests[0], chapters[0].quests[0]);
  assert.deepEqual(
    ids(chapters),
    original,
    "selection must not mutate the source",
  );

  for (const [track, selected, total] of [
    ["technical", technical, 3],
    ["nonTechnical", nonTechnical, 2],
  ]) {
    const board = evaluateQuests(selected, context({ track }), NOW);
    assert.equal(board.total, total);
    assert.equal(board.completedCount, 0);
    assert.equal(board.current.quest.id, "shared");
  }
});

test("passing a check never grants completion or bypasses a strict predecessor", () => {
  const chapters = [
    chapter(1, [quest("first"), quest("second")]),
    chapter(2, [quest("third")]),
  ];
  const checks = { first: { done: true }, second: { done: true } };
  const ctx = context({ briefed: { second: true, third: true } }, checks);
  let board = evaluateQuests(chapters, ctx, NOW);
  assert.deepEqual(
    board.states.map(({ status }) => status),
    ["offered", "locked", "locked"],
  );
  assert.equal(board.states[0].result.done, true);
  assert.equal(board.states[1].result.done, true);
  assert.equal(board.completedCount, 0);
  assert.equal(board.previous, null);
  assert.deepEqual(ctx.progress.completed, {});

  ctx.progress = {
    ...ctx.progress,
    briefed: { ...ctx.progress.briefed, first: true },
  };
  board = evaluateQuests(chapters, ctx, NOW);
  assert.equal(board.current.status, "active");
  assert.equal(board.states[1].status, "locked");

  ctx.progress = { ...ctx.progress, completed: { first: COMPLETED_AT } };
  board = evaluateQuests(chapters, ctx, NOW);
  assert.deepEqual(
    board.states.map(({ status }) => status),
    ["done", "active", "locked"],
  );
  assert.equal(board.current.quest.id, "second");
  assert.equal(board.previous.quest.id, "first");
  assert.equal(board.completedCount, 1);

  ctx.progress = {
    ...ctx.progress,
    completed: { first: COMPLETED_AT, second: COMPLETED_AT },
  };
  board = evaluateQuests(chapters, ctx, NOW);
  assert.equal(board.current.quest.id, "third");
  assert.equal(
    board.states[0].status,
    "done",
    "earned completion survives a failing check",
  );
  assert.equal(
    evaluateQuests(chapters, context(ctx.progress), NOW).states[0].result.done,
    false,
  );
});

test("an unfinished bonus never blocks the next core task, and bonuses never affect totals", () => {
  const chapters = [
    chapter(1, [
      quest("first"),
      quest("bonus", { bonus: true }),
      quest("next"),
    ]),
  ];
  for (const bonusDone of [false, true]) {
    const completed = {
      first: COMPLETED_AT,
      ...(bonusDone ? { bonus: COMPLETED_AT } : {}),
    };
    const board = evaluateQuests(chapters, context({ completed }), NOW);
    assert.equal(board.total, 2);
    assert.equal(board.completedCount, 1);
    assert.equal(board.states[1].status, bonusDone ? "done" : "offered");
    assert.equal(board.states[2].status, "offered");
  }
  const blocked = evaluateQuests(
    chapters,
    context({ completed: { bonus: COMPLETED_AT } }),
    NOW,
  );
  assert.equal(
    blocked.states[2].status,
    "locked",
    "a bonus cannot replace the preceding core",
  );
});

test("a mid-week start opens week 1 on that day and later weeks on Mondays", () => {
  const engine = loadEngine("2026-12-01");
  const opens = [1, 2, 3].map((n) =>
    engine.chapterOpensAt(chapter(n, [])).getTime(),
  );
  assert.deepEqual(opens, [
    new Date("2026-12-01T00:00:00").getTime(),
    new Date("2026-12-07T00:00:00").getTime(),
    new Date("2026-12-14T00:00:00").getTime(),
  ]);
});

test("weekly gating uses chapter numbers even when track selection leaves empty weeks", () => {
  const engine = loadEngine("2026-11-30");
  const chapters = chaptersForTrack(
    [
      chapter(1, [quest("shared")]),
      chapter(2, [quest("tech-only", { track: "technical" })]),
      chapter(3, [quest("editor", { track: "nonTechnical" })]),
    ],
    "nonTechnical",
  );
  const ctx = context({
    track: "nonTechnical",
    completed: { shared: COMPLETED_AT },
  });
  const opens = new Date("2026-12-14T00:00:00");
  assert.equal(engine.chapterOpensAt(chapters[2]).getTime(), opens.getTime());
  assert.equal(
    engine.chapterOpensAt(chapters[1]).getTime(),
    new Date("2026-12-07T00:00:00").getTime(),
  );

  const before = engine.evaluateQuests(
    chapters,
    ctx,
    new Date(opens.getTime() - 1),
  );
  assert.equal(before.states[1].status, "locked");
  assert.equal(before.states[1].opensAt.getTime(), opens.getTime());
  assert.equal(before.current, null);
  assert.equal(
    engine.evaluateQuests(chapters, ctx, opens).states[1].status,
    "offered",
  );
  assert.equal(
    engine.evaluateQuests(chapters, context(), new Date("2026-11-29T00:00:00"))
      .states[0].status,
    "locked",
  );

  const dev = engine.evaluateQuests(
    chapters,
    context(),
    new Date("2026-11-29T00:00:00"),
    true,
  );
  assert.deepEqual(
    dev.states.map(({ status }) => status),
    ["offered", "offered"],
  );
});

test("missing or invalid calendar configuration disables date gating", () => {
  for (const start of [undefined, "not-a-date"]) {
    const engine = loadEngine(start);
    const chapters = [chapter(3, [quest("future")])];
    assert.equal(engine.chapterOpensAt(chapters[0]), undefined);
    assert.equal(
      engine.evaluateQuests(chapters, context(), new Date("2000-01-01")).current
        .status,
      "offered",
    );
  }
});

test("empty chapter lists and chapters produce an empty board and base forge", () => {
  for (const chapters of [[], [chapter(1), chapter(2)]]) {
    const selected = chaptersForTrack(chapters, "nonTechnical");
    assert.deepEqual(evaluateQuests(selected, context(), NOW), {
      states: [],
      current: null,
      previous: null,
      completedCount: 0,
      total: 0,
    });
    assert.equal(forgeLevelFor(selected, EMPTY_PROGRESS), 1);
  }
});

test("stable IDs preserve completion after edits; removed tasks and new IDs cannot inherit it", () => {
  const old = [
    chapter(1, [
      quest("retained"),
      quest("removed", { reward: { forgeLevel: 2 } }),
    ]),
  ];
  const progress = {
    ...EMPTY_PROGRESS,
    completed: { retained: COMPLETED_AT, removed: COMPLETED_AT },
  };
  assert.equal(evaluateQuests(old, context(progress), NOW).completedCount, 2);
  assert.equal(forgeLevelFor(old, progress), 3);

  const changed = [
    chapter(1, [
      quest("retained", { title: "Renamed", door: 20 }),
      quest("added", { door: 1, reward: { forgeLevel: 1 } }),
    ]),
  ];
  const board = evaluateQuests(changed, context(progress), NOW);
  assert.deepEqual(
    board.states.map(({ quest, status }) => [quest.id, status]),
    [
      ["retained", "done"],
      ["added", "offered"],
    ],
  );
  assert.equal(board.total, 2);
  assert.equal(board.completedCount, 1);
  assert.equal(forgeLevelFor(changed, progress), 1);
  assert.equal(
    progress.completed.removed,
    COMPLETED_AT,
    "evaluation must not rewrite persisted facts",
  );
});

test("forge rewards are isolated to the selected track, with shared rewards on both", () => {
  const chapters = [
    chapter(1, [
      quest("shared", { reward: { forgeLevel: 1 } }),
      quest("tech", { track: "technical", reward: { forgeLevel: 1 } }),
      quest("editor", { track: "nonTechnical", reward: { forgeLevel: 2 } }),
      quest("unfinished", { reward: { forgeLevel: 3 } }),
    ]),
  ];
  const completed = {
    shared: COMPLETED_AT,
    tech: COMPLETED_AT,
    editor: COMPLETED_AT,
  };
  assert.equal(
    forgeLevelFor(chaptersForTrack(chapters, "technical"), {
      ...EMPTY_PROGRESS,
      completed,
    }),
    3,
  );
  assert.equal(
    forgeLevelFor(chaptersForTrack(chapters, "nonTechnical"), {
      ...EMPTY_PROGRESS,
      completed,
    }),
    4,
  );
  assert.equal(
    forgeLevelFor(chaptersForTrack(chapters, "technical"), {
      ...EMPTY_PROGRESS,
      completed: { editor: COMPLETED_AT },
    }),
    1,
  );
  assert.equal(
    forgeLevelFor(chaptersForTrack(chapters, "nonTechnical"), {
      ...EMPTY_PROGRESS,
      completed: { tech: COMPLETED_AT },
    }),
    1,
  );
});

test("real chapters share startup while all existing code/window tasks stay technical", () => {
  const all = CHAPTERS.flatMap(({ quests }) => quests);
  const startup = all.find(({ id }) => id === "the-broken-forge");
  assert.ok(startup);
  assert.equal(startup.track, undefined);
  assert.equal(startup.checkedBy, "game");
  const codeTasks = all.filter(
    ({ checkedBy }) => checkedBy === "code" || checkedBy === "window",
  );
  assert.ok(codeTasks.length > 0);
  for (const task of [...codeTasks, theForgeButton])
    assert.equal(task.track, "technical", task.id);
  for (const track of ["technical", "nonTechnical"]) {
    const selected = chaptersForTrack(CHAPTERS, track);
    assert.equal(
      evaluateQuests(selected, context({ track }), NOW).current.quest.id,
      startup.id,
    );
    for (const task of codeTasks) {
      assert.equal(
        selected.some(({ quests }) => quests.includes(task)),
        track === "technical",
        task.id,
      );
    }
  }
});

test("week one ends with custom input and has no Document view quest", () => {
  assert.deepEqual(
    CHAPTERS[0].quests.map(({ id }) => id),
    [
      "the-broken-forge",
      "branns-ledger",
      "the-guilds-law",
      "the-drawing-board",
    ],
  );
});

// Studio practice remains available, but only the code check unlocks the next door.
const STUDIO_STEPS = [
  { id: "branns-ledger", before: ["the-broken-forge"], next: "the-guilds-law" },
  {
    id: "the-guilds-law",
    before: ["the-broken-forge", "branns-ledger"],
    next: "the-drawing-board",
  },
  {
    id: "the-drawing-board",
    before: ["the-broken-forge", "branns-ledger", "the-guilds-law"],
    next: null,
  },
];
function studioBoard(
  step,
  { solved = false, done = false } = {},
) {
  const ids = done ? [...step.before, step.id] : step.before;
  return evaluateQuests(
    chaptersForTrack(CHAPTERS, "technical"),
    context({
      track: "technical",
      completed: Object.fromEntries(ids.map((id) => [id, COMPLETED_AT])),
      briefed: { [step.id]: true },
      solved: solved ? { [step.id]: { at: COMPLETED_AT } } : {},
    }),
    NOW,
  );
}

const stateOf = (board, id) =>
  board.states.find(({ quest }) => quest.id === id);

test("Studio-practice quests name their real Studio step and are technical", () => {
  const all = [...CHAPTERS.flatMap(({ quests }) => quests), theForgeButton];
  const named = all.filter(
    ({ studioPractice }) => studioPractice !== undefined,
  );
  assert.deepEqual(
    named.map(({ id }) => id).sort(),
    STUDIO_STEPS.map(({ id }) => id).sort(),
  );
  for (const quest of named) {
    assert.equal(typeof quest.studioPractice, "string", quest.id);
    assert.notEqual(quest.studioPractice.trim(), "", quest.id);
    assert.equal(quest.track, "technical", quest.id);
    assert.equal(quest.bonus, undefined, quest.id);
  }
  assert.equal(named.length, STUDIO_STEPS.length);
});

for (const step of STUDIO_STEPS) {
  test(`${step.id}: code pass is enough; Studio is optional`, () => {
    for (const solved of [false, true]) {
      const board = studioBoard(step, { solved });
      const state = stateOf(board, step.id);
      assert.equal(state.result.done, solved);
      assert.deepEqual(
        Object.fromEntries(
          state.result.objectives.map(({ label, done }) => [label, done]),
        ),
        { "Koden er bestått": solved },
      );
      // Passing the check is not completion: the hook records it on the next render.
      assert.equal(state.status, "active");
      assert.equal(board.completedCount, step.before.length);
      if (step.next)
        assert.equal(stateOf(board, step.next).status, "locked");
      else assert.equal(board.current.quest.id, step.id);
    }
  });

  test(`${step.id}: a recorded completion stays done without code`, () => {
    const board = studioBoard(step, { done: true });
    const state = stateOf(board, step.id);
    assert.equal(state.status, "done");
    assert.equal(state.result.done, false);
    assert.equal(board.completedCount, step.before.length + 1);
    if (step.next)
      assert.equal(stateOf(board, step.next).status, "offered");
    else assert.equal(board.current, null);
  });
}
