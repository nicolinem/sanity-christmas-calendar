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
  assert.deepEqual(first.completed, {});
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

test("resetting progress also removes saved code answers but keeps unrelated storage", () => {
  records.set(progress.storageKey("reset"), JSON.stringify({ introSeen: true }));
  records.set("winter-quest:code:branns-ledger", "learner code");
  records.set("winter-quest:code:the-guilds-law", "another answer");
  records.set("other-app:preference", "keep me");

  progress.resetProgress("reset");

  assert.equal(progress.readProgress("reset").introSeen, false);
  assert.equal(records.has("winter-quest:code:branns-ledger"), false);
  assert.equal(records.has("winter-quest:code:the-guilds-law"), false);
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
