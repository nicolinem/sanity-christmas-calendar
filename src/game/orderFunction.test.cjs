/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const { newPublishes, runOrderFunction } = require("./orderFunction.ts");
const { WINDOW_TASKS } =
  require("../components/hud/codeWindow/tasks/loadTasks.cjs")();
const { runModule } = require("../components/hud/codeWindow/runCode.ts");

const order = (id, item, updatedAt) => ({ _id: id, item, updatedAt });
const signText = (sign) => sign?.text?.[0]?.children?.[0]?.text;
const solution = () => {
  const task = WINDOW_TASKS["baker-function"];
  return runModule(task.solution, task.modules).exports.onOrderPublished;
};

test("the first look only remembers; later, new and republished orders count", () => {
  const first = newPublishes(null, [order("a", "Julekake", "1")]);
  assert.deepEqual(first.changed, []);
  const next = newPublishes(first.seen, [
    order("a", "Julekake", "2"),
    order("b", "Lussekatter", "1"),
  ]);
  assert.deepEqual(
    next.changed.map((o) => o._id),
    ["a", "b"],
  );
  assert.deepEqual(
    newPublishes(next.seen, [order("a", "Julekake", "2")]).changed,
    [],
  );
});

test("our solution writes the sign once and leaves it when it already says so", async () => {
  const fn = solution();
  const first = await runOrderFunction(fn, [order("a", "Julekake")], null);
  assert.equal(signText(first.sign), "Dagens bestilling: Julekake");
  assert.deepEqual(
    first.runs.map((r) => r.wrote),
    [true],
  );
  const again = await runOrderFunction(
    fn,
    [order("a", "Julekake")],
    first.sign,
  );
  assert.deepEqual(
    again.runs.map((r) => r.wrote),
    [false],
  );
  const empty = await runOrderFunction(fn, [order("c", "  ")], first.sign);
  assert.equal(empty.runs[0].wrote, false);
});

test("a function that throws is reported, and the sign stays", async () => {
  const result = await runOrderFunction(
    () => {
      throw new Error("ups");
    },
    [order("a", "Julekake")],
    null,
  );
  assert.equal(result.runs[0].error, "ups");
  assert.equal(result.sign, null);
});
