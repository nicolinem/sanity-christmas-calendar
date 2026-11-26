/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { bakerFunctionTask } = require("./bakerFunction.tsx");
const { runModule } = require("../runCode.ts");

const run = (source) => {
  const result = runModule(source, bakerFunctionTask.modules);
  assert.equal(result.ok, true, result.message);
  return bakerFunctionTask.judge(result.exports);
};

test("the starter does not pass the simulated Function challenge", async () => {
  assert.equal((await run(bakerFunctionTask.starter)).done, false);
});

test("skipping empty orders and checking the current sign pass all three checks", async () => {
  const source = bakerFunctionTask.starter
    .replace(
      "// Sjekk at bestillingen har en vare.",
      "if (!order?.item?.trim()) return",
    )
    .replace(
      "// Ikke skriv hvis skiltet allerede viser denne teksten.",
      "if (sign?.text?.[0]?.children?.[0]?.text === text) return",
    );
  const verdict = await run(source);
  assert.equal(verdict.done, true, verdict.error);
});

test("unconditional sign writes fail the repeat-delivery check", async () => {
  const source = bakerFunctionTask.starter.replace(
    "// Sjekk at bestillingen har en vare.",
    "if (!order?.item?.trim()) return",
  );
  const verdict = await run(source);
  assert.equal(verdict.requirements[0].done, true);
  assert.equal(verdict.requirements[2].done, false);
});

test("the task has the shape of a real Sanity Function and its blueprint", () => {
  assert.match(bakerFunctionTask.starter, /documentEventHandler/);
  assert.match(bakerFunctionTask.starter, /event\.data/);
  assert.doesNotMatch(bakerFunctionTask.starter, /transition|event\.document/);
  const blueprint = bakerFunctionTask.references[0].source;
  assert.match(blueprint, /on: \["create", "update"\]/);
  assert.match(blueprint, /_type == "bakeryOrder"/);
});
