/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  finishedWeeks,
  fridayOf,
  shareText,
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

test("the share text says how far and how, never what", () => {
  const done = board(week1.quests.map(() => "done"));
  const completed = Object.fromEntries(
    week1.quests.map((q) => [q.id, "2026-12-03T12:00:00"]),
  );
  const summary = weekSummary(done, 1, {
    completed,
    hints: { [week1.quests[1].id]: 2 },
  });
  const text = shareText(summary, 3);
  const lines = text.split("\n");
  assert.equal(lines[0], "Julekalenderen · Uke 1 · Studio");
  assert.match(
    lines[1],
    new RegExp(`${week1.quests.length} av ${week1.quests.length} luker`),
  );
  assert.match(lines[2], /Smia nivå 3 · ferdig torsdag · 2 hint brukt/);
  for (const quest of week1.quests) assert.ok(!text.includes(quest.title));
  assert.doesNotMatch(text, /\p{Extended_Pictographic}/u);
});

test("a week's summary shows once, and again if the week gets more doors", () => {
  assert.equal(weekNeedsSummary(undefined, 3), true);
  assert.equal(weekNeedsSummary(3, 3), false);
  assert.equal(weekNeedsSummary(2, 3), true, "a door was added after it was seen");
  assert.equal(weekNeedsSummary(true, 3), false, "older saves count as seen");
});
