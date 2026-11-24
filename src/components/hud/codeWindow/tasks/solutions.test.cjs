/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");

// «Vis løsning» hands the player a whole file. It has to pass when it runs in
// the window, and the starter must not.
const { WINDOW_TASKS } = require("./loadTasks.cjs")();
const { runModule } = require("../runCode.ts");

async function verdictFor(task, source) {
  const loaded = runModule(source, task.modules, task.importHelp);
  if (!loaded.ok) return { done: false, why: loaded.message };
  const verdict = await task.judge(loaded.exports);
  return {
    done: verdict.done,
    solvedAs: verdict.solvedAs,
    why: verdict.requirements
      ?.filter((r) => !r.done)
      .map((r) => `${r.label}: ${r.message ?? ""}`)
      .join("; "),
  };
}

for (const task of Object.values(WINDOW_TASKS)) {
  test(`${task.id}: the solution passes, the starter doesn't`, async () => {
    assert.ok(task.solution && task.solution !== task.starter);
    const solved = await verdictFor(task, task.solution);
    assert.equal(solved.done, true, solved.why);
    // Without solvedAs the window says «bestått» but the luke never counts.
    assert.ok(solved.solvedAs, "a passing verdict must say how it was solved");
    assert.equal((await verdictFor(task, task.starter)).done, false);
  });
}
