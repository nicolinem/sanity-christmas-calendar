/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  finishedWeeks,
  fridayOf,
  weekSummary,
  weekNeedsSummary,
} = require("./weeks.ts");
const { CHAPTERS } = require("./chapters.ts");

const week1 = CHAPTERS[0];
const state = (quest, status) => ({
  quest,
  chapter: week1,
  status,
  result: { done: false },
});
const board = (statuses) => ({
  states: week1.quests.map((q, i) => state(q, statuses[i])),
  current: null,
  previous: null,
  completedCount: 0,
  total: week1.quests.length,
});

test("a week is finished only when every core door is done", () => {
  const all = week1.quests.map(() => "done");
  assert.deepEqual(finishedWeeks(board(all)), [1]);
  const notYet = [...all.slice(0, -1), "active"];
  assert.deepEqual(finishedWeeks(board(notYet)), []);
});

test("the solutions Friday falls in the week the chapter opens", () => {
  const friday = fridayOf(new Date("2026-12-01T00:00:00"));
  assert.equal(friday.getDate(), 4);
  assert.equal(friday.getDay(), 5);
});

test("a week's summary shows once, and again if the week gets more doors", () => {
  assert.equal(weekNeedsSummary(undefined, 3), true);
  assert.equal(weekNeedsSummary(3, 3), false);
  assert.equal(
    weekNeedsSummary(2, 3),
    true,
    "a door was added after it was seen",
  );
  assert.equal(weekNeedsSummary(true, 3), false, "older saves count as seen");
});
