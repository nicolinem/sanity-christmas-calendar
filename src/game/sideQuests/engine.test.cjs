/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  acceptSide,
  advanceSide,
  deliverSide,
  evaluateSideQuests,
  busyGivers,
  sideMarkers,
  sideObjectives,
} = require("./engine.ts");
const { EMPTY_PROGRESS } = require("../quests/progress.ts");
const { CHAPTERS } = require("../quests/chapters.ts");

const AT = "2026-12-02T10:00:00.000Z";
const NOW = new Date("2026-12-02T12:00:00");

const potion = { id: "p1", source: "sanity", kind: "potion" };

// Small, self-contained quests so the engine is tested apart from the content.
const drink = {
  id: "test-drink",
  title: "Drikk",
  giver: "kari",
  kind: "sanity",
  requires: { luke: ["the-broken-forge"] },
  ask: ["Har du noe varmt?"],
  goal: "Publiser en drikk.",
  steps: [
    {
      kind: "studio",
      label: "Publiser en drikk",
      check: (ctx) => ({
        done: ctx.items.some(
          (i) => i.source === "sanity" && i.kind === "potion",
        ),
      }),
    },
  ],
  thanks: "Takk!",
  reward: { unlock: ["gear:hat:bobble"] },
};

const trail = {
  id: "test-trail",
  title: "Sporet",
  giver: "bakeren",
  kind: "world",
  requires: { chapter: 2 },
  ask: ["Følg sporet."],
  goal: "Følg sporet.",
  steps: [
    { kind: "find", spot: "a", label: "Første" },
    { kind: "find", spot: "b", label: "Andre" },
  ],
  thanks: "Takk!",
  reward: { unlock: ["gear:extra:cape"] },
};

const after = {
  ...drink,
  id: "test-after",
  giver: "brann",
  requires: { side: ["test-drink"] },
};

const QUESTS = [drink, trail, after];

function ctx(progress = {}, items = []) {
  return {
    items,
    progress: { ...EMPTY_PROGRESS, ...progress },
    codeChecks: {},
    sanityConfigured: true,
  };
}

function states(progress, items, now = NOW, dev = false) {
  const list = evaluateSideQuests(
    QUESTS,
    CHAPTERS,
    ctx(progress, items),
    now,
    dev,
  );
  return Object.fromEntries(list.map((s) => [s.quest.id, s]));
}

const lukeOne = { completed: { "the-broken-forge": AT } };

test("a side quest stays locked until its luke is done", () => {
  assert.equal(states({})["test-drink"].status, "locked");
  assert.equal(states(lukeOne)["test-drink"].status, "available");
});

test("requires.luke is met by any one of the lukes, whatever the track", () => {
  const either = {
    ...drink,
    requires: { luke: ["follow-the-trail", "who-is-lying"] },
  };
  const run = (completed) =>
    evaluateSideQuests([either], CHAPTERS, ctx({ completed }), NOW)[0].status;
  assert.equal(run({}), "locked");
  assert.equal(run({ "who-is-lying": AT }), "available");
  assert.equal(run({ "follow-the-trail": AT }), "available");
});

test("requires.chapter follows the calendar, like the lukes", () => {
  const before = new Date("2026-12-03T12:00:00");
  const monday = new Date("2026-12-07T09:00:00");
  assert.equal(states({}, [], before)["test-trail"].status, "locked");
  assert.equal(states({}, [], monday)["test-trail"].status, "available");
});

test("requires.side waits for the other side quest to be delivered", () => {
  assert.equal(states(lukeOne)["test-after"].status, "locked");
  const delivered = {
    ...lukeOne,
    side: { "test-drink": { at: AT, step: 1, done: AT } },
  };
  assert.equal(states(delivered)["test-after"].status, "available");
});

test("?dev makes every untaken side quest available", () => {
  const all = states({}, [], NOW, true);
  for (const id of ["test-drink", "test-trail", "test-after"])
    assert.equal(all[id].status, "available");
});

test("a taken studio quest is ready while the check passes, and active again if it stops", () => {
  const taken = acceptSide({ ...EMPTY_PROGRESS, ...lukeOne }, "test-drink", AT);
  assert.deepEqual(taken.side["test-drink"], { at: AT, step: 0 });
  const waiting = states(taken, []);
  assert.equal(waiting["test-drink"].status, "active");
  assert.equal(waiting["test-drink"].step, 0);
  assert.equal(waiting["test-drink"].result.done, false);
  const ready = states(taken, [potion])["test-drink"];
  assert.equal(ready.status, "ready");
  assert.equal(ready.step, 1);
  // The drink was deleted before it was handed over.
  assert.equal(states(taken, [])["test-drink"].status, "active");
});

test("something made before the quest was taken still counts", () => {
  const taken = acceptSide({ ...EMPTY_PROGRESS, ...lukeOne }, "test-drink", AT);
  assert.equal(states(taken, [potion])["test-drink"].status, "ready");
});

test("find steps move on one at a time and remember the spot", () => {
  let p = acceptSide({ ...EMPTY_PROGRESS }, "test-trail", AT);
  assert.equal(states(p, [], NOW, true)["test-trail"].step, 0);
  // Out of order: the second spot isn't the step in progress yet.
  assert.equal(advanceSide(p, trail, 1), p);
  p = advanceSide(p, trail, 0);
  assert.equal(p.found.a, true);
  assert.equal(states(p, [], NOW, true)["test-trail"].status, "active");
  assert.equal(states(p, [], NOW, true)["test-trail"].step, 1);
  p = advanceSide(p, trail, 1);
  assert.equal(p.found.b, true);
  assert.equal(states(p, [], NOW, true)["test-trail"].status, "ready");
  // Pressing E again changes nothing.
  assert.equal(advanceSide(p, trail, 1), p);
});

test("delivering only works when ready, and never touches the lukes", () => {
  const taken = acceptSide({ ...EMPTY_PROGRESS, ...lukeOne }, "test-drink", AT);
  const active = states(taken, [])["test-drink"];
  assert.equal(deliverSide(taken, active, AT), taken);
  const ready = states(taken, [potion])["test-drink"];
  const done = deliverSide(taken, ready, AT);
  assert.equal(done.side["test-drink"].done, AT);
  assert.equal(done.completed, taken.completed);
  // Delivered stays delivered, even when the drink is gone.
  assert.equal(states(done, [])["test-drink"].status, "done");
  assert.equal(deliverSide(done, states(done, [])["test-drink"], AT), done);
});

test("delivering a side quest adds its reward.items once", () => {
  const quest = {
    ...drink,
    id: "test-items",
    reward: { items: [{ id: "isskar", count: 2 }] },
  };
  const taken = acceptSide({ ...EMPTY_PROGRESS }, "test-items", AT);
  const done = deliverSide(taken, { quest, status: "ready", step: 1 }, AT);
  assert.equal(done.inventory.isskar, 2);
  const again = deliverSide(done, { quest, status: "done", step: 1 }, AT);
  assert.equal(again.inventory.isskar, 2);
});

test("taking a quest twice, or one that is done, changes nothing", () => {
  const taken = acceptSide({ ...EMPTY_PROGRESS }, "test-drink", AT);
  assert.equal(acceptSide(taken, "test-drink", "2026-12-03T00:00:00Z"), taken);
});

test("unknown ids and broken records in a save are ignored", () => {
  const saved = {
    ...lukeOne,
    side: {
      "gone-quest": { at: AT, step: 3 },
      "test-drink": { at: AT, step: "x" },
    },
  };
  const all = states(saved, []);
  assert.equal(all["gone-quest"], undefined);
  assert.equal(all["test-drink"].status, "active");
  assert.equal(all["test-drink"].step, 0);
});

test("markers: «!» to take, «?» to deliver, nothing where a luke waits", () => {
  const taken = acceptSide({ ...EMPTY_PROGRESS, ...lukeOne }, "test-drink", AT);
  const list = evaluateSideQuests(
    QUESTS,
    CHAPTERS,
    ctx(taken, [potion]),
    NOW,
    true,
  );
  assert.deepEqual(sideMarkers(list, []), {
    kari: "?",
    bakeren: "!",
    brann: "!",
  });
  assert.deepEqual(sideMarkers(list, ["kari", "brann"]), { bakeren: "!" });
  const fresh = evaluateSideQuests(QUESTS, CHAPTERS, ctx(lukeOne), NOW);
  assert.deepEqual(sideMarkers(fresh, []), { kari: "!" });
});

test("the journal ticks off steps as they're done", () => {
  let p = acceptSide({ ...EMPTY_PROGRESS }, "test-trail", AT);
  const done = (progress) =>
    sideObjectives(states(progress, [], NOW, true)["test-trail"]).map(
      (o) => o.done,
    );
  assert.deepEqual(done(p), [false, false]);
  p = advanceSide(p, trail, 0);
  assert.deepEqual(done(p), [true, false]);
  p = advanceSide(p, trail, 1);
  assert.deepEqual(done(p), [true, true]);
  // Not taken: nothing is ticked.
  assert.deepEqual(done({}), [false, false]);
});

test("the luke's giver shows no side marker while the luke is in hand", () => {
  const luke = (status, extra = {}) => ({
    quest: { giver: "bakeren", ...extra },
    status,
  });
  assert.deepEqual(busyGivers(null), []);
  for (const status of ["offered", "active"])
    assert.deepEqual(busyGivers(luke(status)), ["bakeren"]);
  // Brann gives lukes when no giver is named.
  assert.deepEqual(busyGivers({ quest: {}, status: "active" }), ["brann"]);
  // The person an active luke asks about is busy too.
  assert.deepEqual(busyGivers(luke("active", { asksNpc: "kari" })), [
    "bakeren",
    "kari",
  ]);
});
