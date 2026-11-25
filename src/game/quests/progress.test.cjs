/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
require("sucrase/register");

let originalWindow;
let records;
let progress;
const COMPLETED_AT = "2026-11-30T12:00:00Z";

function loadProgress() {
  // Reset the module's single-project snapshot cache to simulate a page reload.
  delete require.cache[require.resolve("./progress.ts")];
  return require("./progress.ts");
}

beforeEach(() => {
  originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  records = new Map();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key) => records.get(key) ?? null,
        setItem: (key, value) => records.set(key, value),
        removeItem: (key) => records.delete(key),
        key: (index) => [...records.keys()][index] ?? null,
        get length() {
          return records.size;
        },
      },
    },
  });
  progress = loadProgress();
});

afterEach(() => {
  if (originalWindow)
    Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
  delete require.cache[require.resolve("./progress.ts")];
});

test("fresh progress defaults to technical and keeps a stable snapshot", () => {
  const first = progress.readProgress("fresh");
  assert.equal(first.track, "technical");
  assert.equal(first.trackChosen, false);
  assert.equal(first.shareProfile, false);
  assert.equal(first.sharePrompted, false);
  assert.deepEqual(first.completed, {});
  assert.deepEqual(first.seenGear, {});
  assert.equal(first, progress.readProgress("fresh"));
  assert.equal(progress.EMPTY_PROGRESS.track, "technical");
});

test("legacy saves ignore skipped, default to technical, and preserve earned completion", () => {
  const legacy = {
    completed: { first: COMPLETED_AT },
    skipped: { second: COMPLETED_AT },
    briefed: { first: true },
    hints: { first: 2 },
    solved: { first: { at: COMPLETED_AT, icon: "hammer" } },
    metBlacksmith: true,
    wraithDefeated: true,
    introSeen: true,
    struck: { fire: true },
  };
  records.set(progress.storageKey("legacy"), JSON.stringify(legacy));
  const restored = progress.readProgress("legacy");
  assert.equal(restored.track, "technical");
  assert.equal(restored.trackChosen, true);
  assert.equal(restored.shareProfile, false);
  assert.equal(restored.sharePrompted, false);
  assert.equal(Object.hasOwn(restored, "skipped"), false);
  const { skipped, ...earned } = legacy;
  assert.ok(skipped.second);
  for (const [key, value] of Object.entries(earned))
    assert.deepEqual(restored[key], value, key);
  assert.equal(restored.completed.second, undefined);

  // Normal subsequent writes must not reintroduce the obsolete field.
  progress.updateProgress("legacy", (value) => ({
    ...value,
    introSeen: false,
  }));
  const saved = JSON.parse(records.get(progress.storageKey("legacy")));
  assert.equal(Object.hasOwn(saved, "skipped"), false);
  assert.deepEqual(saved.completed, legacy.completed);
});

test("an invalid saved track falls back to technical", () => {
  for (const track of ["unknown", null, 123, "Technical"]) {
    const project = `invalid-${track}`;
    records.set(
      progress.storageKey(project),
      JSON.stringify({ track, completed: { first: COMPLETED_AT } }),
    );
    const restored = progress.readProgress(project);
    assert.equal(restored.track, "technical");
    assert.equal(restored.completed.first, COMPLETED_AT);
  }
});

test("nonTechnical selection and completion survive writing and a fresh module load", () => {
  progress.updateProgress("editor", (value) => ({
    ...value,
    track: "nonTechnical",
    completed: { shared: COMPLETED_AT, editor: COMPLETED_AT },
  }));
  const saved = JSON.parse(records.get(progress.storageKey("editor")));
  assert.equal(saved.track, "nonTechnical");
  progress = loadProgress();
  const restored = progress.readProgress("editor");
  assert.equal(restored.track, "nonTechnical");
  assert.deepEqual(restored.completed, saved.completed);
  assert.equal(restored, progress.readProgress("editor"));
});

test("tracks and earned facts are isolated by project, including after reload", () => {
  progress.updateProgress("alpha", (value) => ({
    ...value,
    track: "nonTechnical",
    completed: { alpha: COMPLETED_AT },
  }));
  assert.equal(progress.readProgress("beta").track, "technical");
  assert.deepEqual(progress.readProgress("beta").completed, {});
  progress.updateProgress("beta", (value) => ({
    ...value,
    completed: { beta: COMPLETED_AT },
  }));
  progress = loadProgress();
  for (const project of ["alpha", "beta", "alpha"]) {
    const restored = progress.readProgress(project);
    assert.equal(
      restored.track,
      project === "alpha" ? "nonTechnical" : "technical",
    );
    assert.deepEqual(restored.completed, { [project]: COMPLETED_AT });
  }
  assert.notEqual(progress.storageKey("alpha"), progress.storageKey("beta"));
  assert.deepEqual(progress.readProgress("demo").completed, {});
});

test("newly seen gear survives reload and stays isolated by project", () => {
  progress.updateProgress("gear-alpha", (value) => ({
    ...value,
    seenGear: { "hat:bobble": true },
  }));
  progress = loadProgress();
  assert.deepEqual(progress.readProgress("gear-alpha").seenGear, {
    "hat:bobble": true,
  });
  assert.deepEqual(progress.readProgress("gear-beta").seenGear, {});
});

test("unavailable storage does not prevent in-memory progress or notifications", () => {
  Object.defineProperty(window, "localStorage", {
    get() {
      throw new Error("Storage blocked");
    },
  });
  assert.equal(progress.readProgress("blocked").track, "technical");
  let notifications = 0;
  const unsubscribe = progress.subscribeProgress(() => {
    notifications += 1;
  });
  assert.doesNotThrow(() =>
    progress.updateProgress("blocked", (value) => ({
      ...value,
      track: "nonTechnical",
      completed: { shared: COMPLETED_AT },
    })),
  );
  assert.equal(progress.readProgress("blocked").track, "nonTechnical");
  assert.equal(progress.readProgress("blocked").completed.shared, COMPLETED_AT);
  assert.equal(notifications, 1);
  unsubscribe();
  progress.resetProgress("blocked");
  assert.equal(progress.readProgress("blocked").track, "technical");
  assert.deepEqual(progress.readProgress("blocked").completed, {});
  assert.equal(notifications, 1);
});

test("resetting progress removes saved task answers but keeps unrelated storage", () => {
  records.set(
    progress.storageKey("reset"),
    JSON.stringify({ introSeen: true }),
  );
  records.set("winter-quest:code:branns-ledger", "learner code");
  records.set("winter-quest:code:the-guilds-law", "another answer");
  records.set("winter-quest:board:archive-model", "half a board");
  records.set("other-app:preference", "keep me");

  progress.resetProgress("reset");

  assert.equal(progress.readProgress("reset").introSeen, false);
  assert.equal(progress.readProgress("reset").trackChosen, false);
  assert.equal(progress.readProgress("reset").shareProfile, false);
  assert.equal(progress.readProgress("reset").sharePrompted, false);
  assert.equal(records.has("winter-quest:code:branns-ledger"), false);
  assert.equal(records.has("winter-quest:code:the-guilds-law"), false);
  assert.equal(records.has("winter-quest:board:archive-model"), false);
  assert.equal(records.get("other-app:preference"), "keep me");
});

test("a failed storage write keeps the updated cached progress", () => {
  window.localStorage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  assert.doesNotThrow(() =>
    progress.updateProgress("full", (value) => ({
      ...value,
      track: "nonTechnical",
    })),
  );
  assert.equal(progress.readProgress("full").track, "nonTechnical");
  assert.equal(records.size, 0);
});

test("server-side reads without window safely return default progress", () => {
  delete globalThis.window;
  assert.equal(progress.readProgress("server").track, "technical");
  assert.doesNotThrow(() =>
    progress.updateProgress("server", (value) => ({
      ...value,
      introSeen: true,
    })),
  );
  assert.equal(progress.readProgress("server").introSeen, true);
});

test("malformed or null persisted data falls back to fresh progress", () => {
  for (const raw of ["{broken", "null", "false", "42"]) {
    records.set(progress.storageKey(raw), raw);
    assert.equal(progress.readProgress(raw), progress.EMPTY_PROGRESS);
  }
  for (const seenGear of [null, [], "invalid"]) {
    records.set(
      progress.storageKey(`invalid-seen-${String(seenGear)}`),
      JSON.stringify({ seenGear }),
    );
    assert.deepEqual(
      progress.readProgress(`invalid-seen-${String(seenGear)}`).seenGear,
      {},
    );
  }
});

test("legacy Studio confirmations are discarded without losing completed quests or solved code", () => {
  records.set(
    progress.storageKey("legacy-studio"),
    JSON.stringify({
      completed: { "branns-ledger": COMPLETED_AT },
      solved: { "branns-ledger": { at: COMPLETED_AT } },
      studioConfirmed: { "branns-ledger": COMPLETED_AT },
    }),
  );
  const restored = progress.readProgress("legacy-studio");
  assert.equal(Object.hasOwn(restored, "studioConfirmed"), false);
  assert.equal(restored.completed["branns-ledger"], COMPLETED_AT);
  assert.deepEqual(restored.solved, {
    "branns-ledger": { at: COMPLETED_AT },
  });
});

test("a new project after an expired one takes the old progress once", () => {
  records.set(
    "winter-quest:progress:oldproj1",
    JSON.stringify({ track: "nonTechnical", completed: { a: COMPLETED_AT } }),
  );
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "newproj2";
  process.env.NEXT_PUBLIC_SANITY_PREVIOUS_PROJECT_ID = "oldproj1";
  try {
    progress = loadProgress();
    const moved = progress.readProgress("newproj2");
    assert.equal(moved.track, "nonTechnical");
    assert.deepEqual(moved.completed, { a: COMPLETED_AT });
    assert.ok(records.has("winter-quest:progress:newproj2"));
    // Other projects don't borrow it.
    assert.deepEqual(progress.readProgress("other").completed, {});
    assert.equal(progress.PLAYER_ID, "newproj2");
  } finally {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SANITY_PREVIOUS_PROJECT_ID;
  }
});

test("saves without side quests get empty side and found records", () => {
  records.set(
    progress.storageKey("before-side"),
    JSON.stringify({ completed: { "the-broken-forge": COMPLETED_AT } }),
  );
  const restored = progress.readProgress("before-side");
  assert.deepEqual(restored.side, {});
  assert.deepEqual(restored.found, {});
  for (const bad of [null, [], "invalid", 3]) {
    const key = `bad-side-${String(bad)}`;
    records.set(
      progress.storageKey(key),
      JSON.stringify({ side: bad, found: bad }),
    );
    assert.deepEqual(progress.readProgress(key).side, {});
    assert.deepEqual(progress.readProgress(key).found, {});
  }
});

test("side quests and found spots survive a reload and an unrelated update", () => {
  const side = {
    "warm-drink": { at: COMPLETED_AT, step: 1, done: COMPLETED_AT },
  };
  const found = { "flour-trail-1": true };
  records.set(
    progress.storageKey("with-side"),
    JSON.stringify({ side, found }),
  );
  progress.updateProgress("with-side", (value) => ({
    ...value,
    introSeen: true,
  }));
  progress = loadProgress();
  const restored = progress.readProgress("with-side");
  assert.deepEqual(restored.side, side);
  assert.deepEqual(restored.found, found);
  assert.equal(restored.introSeen, true);
});

test("xp and inventory default safely and drop bad values", () => {
  const fresh = progress.readProgress("xp-fresh");
  assert.equal(fresh.xp, 0);
  assert.deepEqual(fresh.inventory, {});
  for (const xp of [-3, "x", NaN, null]) {
    records.set(
      progress.storageKey(`xp-${String(xp)}`),
      JSON.stringify({ xp }),
    );
    assert.equal(progress.readProgress(`xp-${String(xp)}`).xp, 0);
  }
  records.set(
    progress.storageKey("inv"),
    JSON.stringify({
      xp: 40,
      inventory: { isskar: 2, malm: -1, x: 1.5, y: "2" },
    }),
  );
  const saved = progress.readProgress("inv");
  assert.equal(saved.xp, 40);
  assert.deepEqual(saved.inventory, { isskar: 2 });
});

test("deepest defaults to 0 and drops bad values", () => {
  assert.equal(progress.readProgress("deep-fresh").deepest, 0);
  records.set(progress.storageKey("deep-missing"), JSON.stringify({ xp: 1 }));
  assert.equal(progress.readProgress("deep-missing").deepest, 0);
  for (const deepest of [-2, 3.5, "4", null]) {
    const key = `deep-${String(deepest)}`;
    records.set(progress.storageKey(key), JSON.stringify({ deepest }));
    assert.equal(progress.readProgress(key).deepest, 0);
  }
  records.set(progress.storageKey("deep-ok"), JSON.stringify({ deepest: 7 }));
  assert.equal(progress.readProgress("deep-ok").deepest, 7);
});

test("xp, inventory and deepest survive an unrelated update", () => {
  records.set(
    progress.storageKey("cave-keep"),
    JSON.stringify({ xp: 40, inventory: { isskar: 2 }, deepest: 6 }),
  );
  progress.updateProgress("cave-keep", (value) => ({
    ...value,
    introSeen: true,
  }));
  progress = loadProgress();
  const restored = progress.readProgress("cave-keep");
  assert.equal(restored.xp, 40);
  assert.deepEqual(restored.inventory, { isskar: 2 });
  assert.equal(restored.deepest, 6);
  assert.equal(restored.introSeen, true);
});

test("trip and inCave default safely and drop bad values", () => {
  const fresh = progress.readProgress("trip-fresh");
  assert.deepEqual(fresh.trip, {});
  assert.equal("inCave" in fresh, false);
  records.set(
    progress.storageKey("trip-bad"),
    JSON.stringify({
      trip: { malm: 2, isskar: -1, x: 1.5, y: "3", z: null },
      inCave: "yes",
    }),
  );
  const bad = progress.readProgress("trip-bad");
  assert.deepEqual(bad.trip, { malm: 2 });
  assert.equal("inCave" in bad, false);
  records.set(
    progress.storageKey("trip-ok"),
    JSON.stringify({ trip: { malm: 1 }, inCave: true }),
  );
  assert.equal(progress.readProgress("trip-ok").inCave, true);
});

test("bosses and chests are washed like found", () => {
  assert.deepEqual(progress.EMPTY_PROGRESS.bosses, {});
  assert.deepEqual(progress.EMPTY_PROGRESS.chests, {});
  records.set(progress.storageKey("no-cave-facts"), JSON.stringify({}));
  assert.deepEqual(progress.readProgress("no-cave-facts").bosses, {});
  for (const bad of [null, [], "x", 3]) {
    const key = `bad-cave-${String(bad)}`;
    records.set(
      progress.storageKey(key),
      JSON.stringify({ bosses: bad, chests: bad }),
    );
    assert.deepEqual(progress.readProgress(key).bosses, {});
    assert.deepEqual(progress.readProgress(key).chests, {});
  }
  records.set(
    progress.storageKey("mixed-cave"),
    JSON.stringify({
      bosses: { yeti: true, bad: 1 },
      chests: { "cave-5": true },
    }),
  );
  assert.deepEqual(progress.readProgress("mixed-cave").bosses, { yeti: true });
  assert.deepEqual(progress.readProgress("mixed-cave").chests, {
    "cave-5": true,
  });
});
