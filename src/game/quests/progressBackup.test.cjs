/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test, beforeEach, afterEach, mock } = require("node:test");
require("sucrase/register");
const {
  EMPTY_PROGRESS,
  mergeProgress,
  normalizeProgress,
  progressJson,
} = require("./progressMerge.ts");

const PROJECT = "backup-test";
const AT = "2026-12-01T10:00:00.000Z";
const LATER = "2026-12-02T10:00:00.000Z";
const LATEST = "2026-12-03T10:00:00.000Z";

let originalWindow;
let records;
let progress;
let backup;
let doc; // the backup document's progress, as the route stores it
let requests;
let answer; // status the fake route answers with

// A new page load: the modules start over, localStorage stays.
function load() {
  for (const file of ["./progress.ts", "./progressBackup.ts"])
    delete require.cache[require.resolve(file)];
  progress = require("./progress.ts");
  backup = require("./progressBackup.ts");
}

// The route's merge, without Sanity (the route itself: progressRoute.test.cjs).
async function send(url, init) {
  requests.push(init);
  if (answer !== 200) return { ok: false, status: answer };
  const sent = normalizeProgress(JSON.parse(init.body));
  const saved = doc ? normalizeProgress(JSON.parse(doc)) : null;
  doc = progressJson(saved ? mergeProgress(saved, sent) : sent);
  return {
    ok: true,
    status: 200,
    json: async () => ({ progress: JSON.parse(doc) }),
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

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
  doc = null;
  requests = [];
  answer = 200;
  load();
});

afterEach(() => {
  if (originalWindow)
    Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
});

test("progress comes back after localStorage is cleared or in another browser", async () => {
  progress.updateProgress(PROJECT, (p) => ({
    ...p,
    track: "nonTechnical",
    trackChosen: true,
    introSeen: true,
    sharePrompted: true,
    figure: { body: "fox" },
    name: "Nissen",
    completed: { "first-weapon": AT },
  }));
  const stop = backup.startProgressBackup(PROJECT, { send });
  await settle();
  stop();
  assert.equal(requests.length, 1);

  records.clear(); // Cleared browser data, or a browser that never had any.
  load();
  assert.deepEqual(progress.readProgress(PROJECT).completed, {});
  let notified = 0;
  progress.subscribeProgress(() => notified++);
  backup.startProgressBackup(PROJECT, { send });
  await settle();
  const restored = progress.readProgress(PROJECT);
  assert.equal(restored.track, "nonTechnical");
  assert.equal(restored.name, "Nissen");
  assert.deepEqual(restored.figure, { body: "fox" });
  assert.deepEqual(restored.completed, { "first-weapon": AT });
  assert.ok(notified > 0, "the game is told, so it shows the restored state");
  // Saved here too, so the Studio (same origin) sees it.
  assert.deepEqual(
    JSON.parse(records.get(progress.storageKey(PROJECT))).completed,
    { "first-weapon": AT },
  );
});

test("a fresh browser that changes something first doesn't override the backup's choices", async () => {
  doc = progressJson({
    ...EMPTY_PROGRESS,
    track: "nonTechnical",
    trackChosen: true,
    sharePrompted: true,
    shareProfile: true,
    figure: { body: "fox" },
    name: "Nissen",
    deepest: 2,
    inventory: { ice: 3 },
    completed: { "first-weapon": AT },
    savedAt: "2020-01-01T00:00:00.000Z",
  });
  // Saved now, so newer than the backup, but none of those choices made yet.
  progress.updateProgress(PROJECT, (p) => ({
    ...p,
    seenGear: { "hat:bobble": true },
  }));
  backup.startProgressBackup(PROJECT, { send });
  await settle();
  const merged = progress.readProgress(PROJECT);
  assert.equal(merged.track, "nonTechnical");
  assert.equal(merged.name, "Nissen");
  assert.equal(merged.shareProfile, true);
  assert.deepEqual(merged.inventory, { ice: 3 });
  assert.deepEqual(merged.seenGear, { "hat:bobble": true });
  assert.deepEqual(merged.completed, { "first-weapon": AT });
});

test("«Nytt spill» replaces the older game in the backup and in other browsers", async () => {
  const oldGame = {
    ...EMPTY_PROGRESS,
    trackChosen: true,
    completed: { "first-weapon": AT },
    xp: 40,
    savedAt: AT,
  };
  doc = progressJson(oldGame);
  progress.resetProgress(PROJECT);
  const stop = backup.startProgressBackup(PROJECT, { send });
  await settle();
  stop();
  assert.deepEqual(JSON.parse(doc).completed, {});
  assert.equal(JSON.parse(doc).xp, 0);

  // Another browser still has the old game.
  records.set(progress.storageKey(PROJECT), JSON.stringify(oldGame));
  load();
  backup.startProgressBackup(PROJECT, { send });
  await settle();
  assert.deepEqual(progress.readProgress(PROJECT).completed, {});
  assert.deepEqual(JSON.parse(doc).completed, {});
});

test("the backup is written at most once a second, and when the page closes", async () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.parse(AT) });
  try {
    backup.startProgressBackup(PROJECT, { send });
    await settle();
    assert.equal(requests.length, 1);
    for (let i = 1; i <= 5; i++)
      progress.updateProgress(PROJECT, (p) => ({ ...p, xp: i }));
    await settle();
    assert.equal(requests.length, 1);
    mock.timers.tick(1000);
    await settle();
    assert.equal(requests.length, 2);
    assert.equal(JSON.parse(doc).xp, 5);
    mock.timers.tick(5000);
    await settle();
    assert.equal(requests.length, 2, "nothing new, nothing sent");
  } finally {
    mock.timers.reset();
  }

  const listeners = {};
  const target = {
    addEventListener: (name, fn) => (listeners[name] = fn),
    removeEventListener: () => {},
  };
  Object.assign(globalThis.window, target);
  globalThis.document = { ...target, visibilityState: "visible" };
  try {
    load();
    const stop = backup.startProgressBackup(PROJECT, { send });
    await settle();
    requests.length = 0;
    progress.updateProgress(PROJECT, (p) => ({ ...p, xp: 99 }));
    listeners.pagehide();
    await settle();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].keepalive, true);
    assert.equal(JSON.parse(doc).xp, 99);
    stop();
  } finally {
    delete globalThis.document;
  }
});

test("without a token the game stops trying and plays on", async () => {
  answer = 503;
  progress.updateProgress(PROJECT, (p) => ({ ...p, introSeen: true }));
  backup.startProgressBackup(PROJECT, { send });
  await settle();
  progress.updateProgress(PROJECT, (p) => ({ ...p, xp: 3 }));
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(requests.length, 1);
  assert.equal(progress.readProgress(PROJECT).xp, 3);
});

test("the demo and ?dev don't write a backup", () => {
  assert.equal(backup.backupWanted("abc123", ""), true);
  assert.equal(backup.backupWanted("demo", ""), false);
  assert.equal(backup.backupWanted("abc123", "?dev", "development"), false);
  assert.equal(backup.backupWanted("abc123", "?dev=1", "development"), false);
  // ?dev does nothing in a production build, so neither does it here.
  assert.equal(backup.backupWanted("abc123", "?dev", "production"), true);
});

test("merging keeps everything earned from both copies", () => {
  const a = {
    ...EMPTY_PROGRESS,
    completed: { one: LATER, two: AT },
    hints: { one: 2, two: 1 },
    side: {
      ice: { at: AT, step: 2 },
      bread: { at: AT, step: 0, done: LATER },
    },
    solved: { one: { at: AT } },
    metBlacksmith: true,
    xp: 30,
    deepest: 3,
    savedAt: LATEST,
  };
  const b = {
    ...EMPTY_PROGRESS,
    completed: { one: AT, three: LATER },
    hints: { one: 1, three: 3 },
    side: { ice: { at: AT, step: 1 }, bread: { at: AT, step: 2 } },
    chests: { "cave-5": true },
    wraithDefeated: true,
    xp: 50,
    deepest: 1,
    savedAt: AT,
  };
  const merged = mergeProgress(a, b);
  assert.deepEqual(merged.completed, { one: AT, two: AT, three: LATER });
  assert.deepEqual(merged.hints, { one: 2, two: 1, three: 3 });
  assert.deepEqual(merged.side, {
    ice: { at: AT, step: 2 },
    bread: { at: AT, step: 0, done: LATER },
  });
  assert.deepEqual(merged.solved, { one: { at: AT } });
  assert.deepEqual(merged.chests, { "cave-5": true });
  assert.equal(merged.metBlacksmith && merged.wraithDefeated, true);
  assert.equal(merged.xp, 50);
  assert.equal(merged.deepest, 3);
  assert.equal(merged.savedAt, LATEST);
  assert.equal(progressJson(mergeProgress(b, a)), progressJson(merged));
});

test("choices that can change come from the copy saved last", () => {
  const older = {
    ...EMPTY_PROGRESS,
    trackChosen: true,
    track: "nonTechnical",
    sharePrompted: true,
    shareProfile: true,
    figure: { body: "fox" },
    name: "Nissen",
    deepest: 2,
    inCave: true,
    trip: { ice: 1 },
    inventory: { ice: 3 },
    savedAt: AT,
  };
  const newer = {
    ...older,
    track: "technical",
    shareProfile: false,
    figure: { body: "owl" },
    name: undefined, // cleared in the character sheet
    inCave: undefined, // back from the cave
    trip: {},
    inventory: { ice: 1 }, // two spent at the forge
    savedAt: LATER,
  };
  delete newer.name;
  delete newer.inCave;
  const merged = mergeProgress(older, newer);
  assert.equal(merged.track, "technical");
  assert.equal(merged.shareProfile, false);
  assert.deepEqual(merged.figure, { body: "owl" });
  assert.equal(Object.hasOwn(merged, "name"), false);
  assert.equal(Object.hasOwn(merged, "inCave"), false);
  assert.deepEqual(merged.trip, {});
  assert.deepEqual(merged.inventory, { ice: 1 });
});

test("the chosen weapon follows the copy saved last, and a fresh browser keeps it", () => {
  const older = { ...EMPTY_PROGRESS, equipped: "sword-1", savedAt: AT };
  const newer = { ...EMPTY_PROGRESS, equipped: "axe-2", savedAt: LATER };
  assert.equal(mergeProgress(older, newer).equipped, "axe-2");
  const fresh = { ...EMPTY_PROGRESS, savedAt: LATER };
  assert.equal(mergeProgress(older, fresh).equipped, "sword-1");
  assert.equal(
    Object.hasOwn(mergeProgress(EMPTY_PROGRESS, fresh), "equipped"),
    false,
  );
});

test("merging again with the merged copy changes nothing", () => {
  const copies = [
    { ...EMPTY_PROGRESS },
    { ...EMPTY_PROGRESS, completed: { one: AT }, savedAt: AT },
    {
      ...EMPTY_PROGRESS,
      trackChosen: true,
      track: "nonTechnical",
      figure: { body: "fox" },
      deepest: 1,
      inventory: { ice: 2 },
      savedAt: LATER,
    },
    { ...EMPTY_PROGRESS, hints: { one: 3 }, xp: 5, savedAt: LATER },
    { ...EMPTY_PROGRESS, startedAt: LATER, savedAt: LATEST },
  ];
  for (const local of copies)
    for (const saved of copies) {
      const backedUp = mergeProgress(saved, local);
      assert.equal(
        progressJson(mergeProgress(local, backedUp)),
        progressJson(backedUp),
      );
    }
});

test("a removed figure doesn't come back from another browser", () => {
  const withFigure = {
    ...EMPTY_PROGRESS,
    figure: { body: "fox" },
    name: "Nissen",
    lookAt: AT,
    sharePrompted: true,
    shareProfile: true,
    shareAt: AT,
    savedAt: AT,
  };
  const removed = {
    ...EMPTY_PROGRESS,
    lookAt: LATER,
    sharePrompted: true,
    shareProfile: false,
    shareAt: LATER,
    savedAt: LATER,
  };
  // The other browser has played on since, but hasn't heard of the removal.
  const stale = { ...withFigure, xp: 9, savedAt: LATEST };
  for (const merged of [
    mergeProgress(removed, withFigure),
    mergeProgress(stale, removed),
    mergeProgress(removed, stale),
  ]) {
    assert.equal(Object.hasOwn(merged, "figure"), false);
    assert.equal(Object.hasOwn(merged, "name"), false);
    assert.equal(merged.shareProfile, false);
  }
  assert.equal(mergeProgress(stale, removed).xp, 9);
});

test("sharing is never switched on by a merge the player didn't make", () => {
  const no = { ...EMPTY_PROGRESS, sharePrompted: true, savedAt: LATER };
  const yes = { ...no, shareProfile: true, savedAt: AT };
  // Older saves have no shareAt: copies that disagree don't share.
  assert.equal(mergeProgress(yes, { ...no, savedAt: AT }).shareProfile, false);
  assert.equal(
    mergeProgress({ ...yes, savedAt: LATEST }, no).shareProfile,
    false,
  );
  assert.equal(
    mergeProgress(yes, { ...yes, savedAt: LATER }).shareProfile,
    true,
  );
  // A fresh browser that hasn't been asked takes the backup's answer.
  assert.equal(
    mergeProgress({ ...EMPTY_PROGRESS, savedAt: LATEST }, yes).shareProfile,
    true,
  );
  // With times, the last answer counts, yes or no.
  assert.equal(
    mergeProgress({ ...yes, shareAt: LATER }, { ...no, shareAt: AT })
      .shareProfile,
    true,
  );
  assert.equal(
    mergeProgress(
      { ...yes, shareAt: AT, savedAt: LATEST },
      {
        ...no,
        shareAt: LATER,
      },
    ).shareProfile,
    false,
  );
});

test("the game hears once when the backup has answered, so sharing can wait for it", async () => {
  let settled = 0;
  const cancel = backup.startProgressBackup(PROJECT, {
    send,
    onSettled: () => settled++,
  });
  assert.equal(settled, 0);
  await settle();
  assert.equal(settled, 1);
  progress.updateProgress(PROJECT, (p) => ({ ...p, xp: 1 }));
  cancel();

  // No token: answered all the same, and the game plays on.
  answer = 503;
  load();
  backup.startProgressBackup(PROJECT, { send, onSettled: () => settled++ });
  await settle();
  assert.equal(settled, 2);

  // Stopped before the answer (React runs effects twice in development).
  answer = 200;
  load();
  backup.startProgressBackup(PROJECT, { send, onSettled: () => settled++ })();
  await settle();
  assert.equal(settled, 2);
});

test("Om meg follows the figure: the latest choice wins, and a removal sticks", () => {
  const about = { food: "taco", activity: "ski", topics: ["a", "b", "c"] };
  const older = {
    ...EMPTY_PROGRESS,
    figure: { body: "fox" },
    lookAt: AT,
    savedAt: AT,
  };
  const newer = { ...older, about, lookAt: LATER, savedAt: AT };
  assert.deepEqual(mergeProgress(older, newer).about, about);
  assert.deepEqual(mergeProgress(newer, older).about, about);
  const removed = { ...EMPTY_PROGRESS, lookAt: LATEST, savedAt: AT };
  assert.equal(Object.hasOwn(mergeProgress(newer, removed), "about"), false);
});

test("a backup's Om meg is cleaned, and a broken one left out", () => {
  assert.deepEqual(
    normalizeProgress({
      about: { food: " taco ", activity: "å gå", topics: ["x"] },
    }).about,
    { food: "taco", activity: "gå", topics: ["x"] },
  );
  assert.equal(Object.hasOwn(normalizeProgress({ about: 5 }), "about"), false);
});
